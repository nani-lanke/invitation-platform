/* ====================================================================
   api/_github.js — the repository, over HTTP

   The token lives in a Vercel environment variable and is read only in
   this file, which only ever runs on the server. If it reaches a browser
   it is game over: anyone could write to the repository. Nothing here is
   imported by anything under js/.

   Environment:
     GITHUB_TOKEN   fine-grained PAT, Contents: read and write
     GITHUB_REPO    'username/invitation-platform'
     GITHUB_BRANCH  optional, defaults to 'main'

   Exports:
     config()               -> { repo, branch } or throws if unset
     getFile(path)          -> { text, sha } | null
     putFile(path, text, message) -> { path, sha, url }
   ==================================================================== */

'use strict';

const API = 'https://api.github.com';

function config() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN and GITHUB_REPO must be set in the Vercel project.');
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error('GITHUB_REPO should look like "username/repository".');
  }

  return { token: token, repo: repo, branch: process.env.GITHUB_BRANCH || 'main' };
}

function headers(token) {
  return {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'InviteHub'
  };
}

/* A path is built from a validated filename, but this is the last place
   before it becomes a URL, so traversal is refused here too. */
function safePath(repoPath) {
  if (typeof repoPath !== 'string' || !repoPath ||
      repoPath.indexOf('..') !== -1 || repoPath.charAt(0) === '/') {
    throw new Error('Refusing an unsafe repository path: ' + repoPath);
  }
  return repoPath.split('/').map(encodeURIComponent).join('/');
}

async function getFile(repoPath) {
  const cfg = config();
  const url = API + '/repos/' + cfg.repo + '/contents/' + safePath(repoPath) +
              '?ref=' + encodeURIComponent(cfg.branch);

  const res = await fetch(url, { headers: headers(cfg.token) });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error('GitHub refused to read ' + repoPath + ' (' + res.status + ')');
  }

  const body = await res.json();
  return {
    sha: body.sha,
    text: Buffer.from(body.content || '', 'base64').toString('utf8')
  };
}

/* Creating and updating are the same call; an update just has to name the
   blob it replaces, so an existing file is looked up first. */
async function putFile(repoPath, text, message) {
  const cfg = config();
  const existing = await getFile(repoPath);

  const url = API + '/repos/' + cfg.repo + '/contents/' + safePath(repoPath);
  const res = await fetch(url, {
    method: 'PUT',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers(cfg.token)),
    body: JSON.stringify({
      message: message,
      content: Buffer.from(text, 'utf8').toString('base64'),
      branch: cfg.branch,
      sha: existing ? existing.sha : undefined
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error('GitHub refused to write ' + repoPath + ' (' + res.status + '): ' + detail.slice(0, 300));
  }

  const body = await res.json();
  return {
    path: repoPath,
    sha: body.content && body.content.sha,
    url: body.content && body.content.html_url,
    replaced: Boolean(existing)
  };
}

/* ------------------------------------------------------------------
   Many files, one commit.

   The Contents API used above writes a single file per call, which for an
   invitation with a photo, a background, a gallery and a track would mean
   six commits for one action — six entries in the history, six rebuilds,
   and a window where the page is live but its photos are not. The Git
   Data API assembles everything first and moves the branch once:

     blobs -> tree (on top of the current one) -> commit -> move the ref
   ------------------------------------------------------------------ */

async function api(cfg, path, init) {
  const res = await fetch(API + '/repos/' + cfg.repo + path, Object.assign({
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers(cfg.token))
  }, init || {}));

  if (!res.ok) {
    const detail = await res.text();
    throw new Error('GitHub ' + res.status + ' on ' + path + ': ' + detail.slice(0, 300));
  }
  return res.json();
}

/* files: [{ path, content }] where content is base64 of the raw bytes. */
async function putFiles(files, message) {
  const cfg = config();
  files.forEach(function (f) { safePath(f.path); });

  const ref = await api(cfg, '/git/ref/heads/' + encodeURIComponent(cfg.branch));
  const head = await api(cfg, '/git/commits/' + ref.object.sha);

  const blobs = [];
  for (const f of files) {
    const blob = await api(cfg, '/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: f.content, encoding: 'base64' })
    });
    blobs.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const tree = await api(cfg, '/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: head.tree.sha, tree: blobs })
  });

  const commit = await api(cfg, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: message, tree: tree.sha, parents: [ref.object.sha] })
  });

  await api(cfg, '/git/refs/heads/' + encodeURIComponent(cfg.branch), {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha })
  });

  return { commit: commit.sha, count: files.length };
}

module.exports = { config: config, getFile: getFile, putFile: putFile, putFiles: putFiles };
