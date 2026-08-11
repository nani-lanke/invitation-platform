/* ====================================================================
   api/publish.js — POST an invitation, get back its address

   Publishes an invitation page and its assets into invitation_card/
   through the GitHub API.
   ==================================================================== */

'use strict';

const browser = require('./_browser');
const validate = require('./_validate');
const limit = require('./_limit');
const github = require('./_github');

const FOLDER = 'invitation_card';
const MAIN_DIR = 'main_image';
const MUSIC_DIR = 'background_music';

const MAX_BODY = 5 * 1024 * 1024;

function siteRoot(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host + '/';
}

function json(res, status, body) {
  res.status(status).setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Use POST.' });
  }

  const declared = Number(req.headers['content-length'] || 0);

  if (declared > MAX_BODY) {
    return json(res, 413, {
      error: 'That invitation is too large to publish.'
    });
  }

  try {
    const gate = await limit.check(req);

    if (!gate.ok) {
      res.setHeader(
        'Retry-After',
        String(gate.retryAfter)
      );

      return json(res, 429, {
        error: gate.error
      });
    }

    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (err) {
        return json(res, 400, {
          error: 'The request body was not valid JSON.'
        });
      }
    }

    const checked = validate.clean(body);

    if (!checked.ok) {
      return json(res, 400, {
        error: checked.error
      });
    }

    const root = siteRoot(req);

    const IH = browser.load(root);

    const state = checked.state;

    if (!state.customColors) {
      IH.invitation.applyTemplate(
        state,
        state.template
      );
    }

    const base = validate.baseName(
      IH,
      state
    );

    const file = base + '.html';

    const path =
      FOLDER + '/' + file;

    const url =
      root + path;

    const split =
      IH.exportPage.extractAssets(
        state,
        base
      );

    let music = null;

    if (
      String(state.musicFile || '').slice(0, 11) ===
      'data:audio/'
    ) {
      const m =
        /^data:audio\/([\w.+-]+);/.exec(
          state.musicFile
        );

      const ext =
        ({
          mpeg: 'mp3',
          mp3: 'mp3',
          mp4: 'm4a',
          'x-m4a': 'm4a',
          aac: 'aac',
          ogg: 'ogg',
          wav: 'wav',
          'x-wav': 'wav',
          webm: 'webm',
          flac: 'flac'
        })[
          (m && m[1] || '').toLowerCase()
        ] || 'mp3';

      music = {
        path:
          MUSIC_DIR +
          '/' +
          base +
          '_music.' +
          ext,

        data:
          state.musicFile
      };

      split.state.musicFile =
        music.path;
    }

    const mainPhoto =
      split.assets.filter(function (a) {
        return (
          a.path.indexOf(
            MAIN_DIR + '/'
          ) === 0
        );
      })[0] ||
      split.assets[0];

    const html =
      IH.exportPage.buildHtml(
        split.state,
        {
          up: '../',

          canonical: url,

          image:
            mainPhoto
              ? root +
                FOLDER +
                '/' +
                mainPhoto.path
              : ''
        }
      );

    const files = [
      {
        path: path,

        content:
          Buffer
            .from(html, 'utf8')
            .toString('base64')
      }
    ];

    split.assets
      .concat(
        music
          ? [music]
          : []
      )
      .forEach(function (a) {
        files.push({
          path:
            FOLDER +
            '/' +
            a.path,

          content:
            String(a.data).slice(
              String(a.data).indexOf(',') + 1
            )
        });
      });

    const written =
      await github.putFiles(
        files,
        'Publish invitation: ' + file
      );

    return json(res, 201, {
      url: url,

      path: path,

      file: file,

      files:
        files.map(function (f) {
          return f.path;
        }),

      count:
        written.count,

      commit:
        written.commit
    });

  } catch (err) {

    console.error(
      'publish failed:',
      err
    );

    return json(res, 500, {
      error:
        'The invitation could not be published. ' +
        'If you are setting this up, set ' +
        'ALLOW_CHECK=1 and open /api/check — ' +
        'it names the step that failed.'
    });
  }
};