/* ====================================================================
   api/check.js — why publishing is not working

   /api/publish deliberately returns a vague message: its real errors can
   name your repository, your branch, or what a token is missing, and it
   is open to the internet. That vagueness is useless when you are the one
   setting it up, so the same checks are available here, in order, with
   the first failure named.

       GET /api/check

   It reports configuration and reachability. It never publishes, and it
   never returns the token — only whether one is present and what GitHub
   makes of it.
   ==================================================================== */

'use strict';

const browser = require('./_browser');
const github = require('./_github');

function step(name, detail, ok) {
  return { step: name, ok: Boolean(ok), detail: detail };
}

module.exports = async function handler(req, res) {
  /* This reports the repository name and whether a token is valid, which
     is not something a public deployment should hand out. It stays shut
     unless you deliberately open it: set ALLOW_CHECK=1 while setting up,
     and remove it once publishing works. */
  if (process.env.ALLOW_CHECK !== '1') {
    res.status(404);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      error: 'Diagnostics are off. Set ALLOW_CHECK=1 in the Vercel project ' +
             'environment variables and redeploy to turn them on.'
    }));
  }

  const checks = [];
  let fatal = null;

  /* 1. Environment ---------------------------------------------------- */
  const hasToken = Boolean(process.env.GITHUB_TOKEN);
  const repo = process.env.GITHUB_REPO || '';
  const branch = process.env.GITHUB_BRANCH || 'main';

  checks.push(step('GITHUB_TOKEN', hasToken ? 'present' : 'MISSING — set it in Project Settings → Environment Variables, then redeploy', hasToken));
  checks.push(step('GITHUB_REPO', repo || 'MISSING — should look like "yourname/invitation-platform"', Boolean(repo)));
  checks.push(step('GITHUB_BRANCH', branch, true));
  checks.push(step('Vercel KV', process.env.KV_REST_API_URL
    ? 'attached — rate limits are shared and exact'
    : 'not attached — rate limits are per function instance only', true));

  if (!hasToken || !repo) fatal = 'Environment variables are incomplete.';

  /* 2. The renderer, and whether js/ made it into the deployment ------- */
  if (!fatal) {
    try {
      const IH = browser.load('https://example.com/');
      const sample = { eventType: 'wedding', title: 'Check', groomName: 'A', brideName: 'B', date: '2026-01-01' };
      IH.invitation.applyTemplate(sample, 'elegant-floral');
      const html = IH.exportPage.buildHtml(sample, { up: '../' });
      checks.push(step('renderer', 'loaded and rendered ' + html.length + ' characters', html.length > 500));
      if (html.length <= 500) fatal = 'The renderer produced almost nothing.';
    } catch (err) {
      checks.push(step('renderer', err.message, false));
      fatal = 'The renderer could not load — this is the usual cause of a failed publish.';
    }
  }

  /* 3. GitHub: does the token actually reach this repository? ---------- */
  if (!fatal) {
    try {
      const cfg = github.config();
      const probe = await fetch('https://api.github.com/repos/' + cfg.repo, {
        headers: {
          Authorization: 'Bearer ' + cfg.token,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'InviteHub'
        }
      });

      if (probe.status === 401) {
        checks.push(step('github', 'the token was rejected (401) — it may be expired or mistyped', false));
        fatal = 'GitHub rejected the token.';
      } else if (probe.status === 404) {
        checks.push(step('github', 'repository not found (404) — check GITHUB_REPO, and that the fine-grained token lists this repository', false));
        fatal = 'GitHub cannot see that repository with this token.';
      } else if (!probe.ok) {
        checks.push(step('github', 'unexpected status ' + probe.status, false));
        fatal = 'GitHub responded unexpectedly.';
      } else {
        const info = await probe.json();
        const perms = info.permissions || {};
        checks.push(step('github', 'reached ' + info.full_name +
          ' (default branch ' + info.default_branch + ')', true));
        checks.push(step('write access', perms.push
          ? 'the token may write to this repository'
          : 'NO WRITE ACCESS — the fine-grained token needs Contents: Read and write', Boolean(perms.push)));
        if (!perms.push) fatal = 'The token cannot write to the repository.';

        if (info.default_branch && info.default_branch !== cfg.branch) {
          checks.push(step('branch', 'publishing to "' + cfg.branch + '" but the repository default is "' +
            info.default_branch + '" — set GITHUB_BRANCH if that is wrong', true));
        }
      }
    } catch (err) {
      checks.push(step('github', err.message, false));
      fatal = 'Could not reach GitHub.';
    }
  }

  res.status(fatal ? 500 : 200);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    ok: !fatal,
    summary: fatal || 'Everything publishing needs is in place.',
    checks: checks
  }, null, 2));
};
