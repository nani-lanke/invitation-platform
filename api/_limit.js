/* ====================================================================
   api/_limit.js — keeping a public write endpoint from being a liability

   /api/publish turns an HTTP request into a commit in your repository.
   Left open, that is a way for a stranger to fill your git history, burn
   the GitHub API budget, and make the repo unpleasant to clone.

   Two counters, both fixed windows:
     per address  — one person, one hour
     everyone     — the whole site, one day, so a botnet spread across
                    many addresses still meets a ceiling

   Where the counters live matters. Vercel runs many function instances,
   so an in-memory counter only limits the instance that happens to serve
   the request — real, but partial. If Vercel KV is attached (its REST
   variables appear in the environment on their own) the counters move
   there and become shared and exact. The in-memory path is the fallback,
   not the design.

   Exports:
     check(ip) -> { ok: true } | { ok: false, error, retryAfter }
   ==================================================================== */

'use strict';

const PER_IP = Number(process.env.PUBLISH_LIMIT_IP || 5);        // per hour
const PER_DAY = Number(process.env.PUBLISH_LIMIT_DAY || 200);    // everyone
const HOUR = 3600;
const DAY = 86400;

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const hasKv = Boolean(KV_URL && KV_TOKEN);

/* --- shared counters, when Vercel KV is attached --------------------- */

async function kv(command) {
  const res = await fetch(KV_URL + '/' + command.map(encodeURIComponent).join('/'), {
    headers: { Authorization: 'Bearer ' + KV_TOKEN }
  });
  if (!res.ok) throw new Error('KV ' + res.status);
  const body = await res.json();
  return body.result;
}

/* INCR then EXPIRE only on the first hit, so the window is fixed rather
   than sliding forward with every request. */
async function bumpKv(key, seconds) {
  const count = Number(await kv(['incr', key]));
  if (count === 1) await kv(['expire', key, String(seconds)]);
  return count;
}

/* --- per-instance counters, when it is not ---------------------------- */

const memory = new Map();

function bumpMemory(key, seconds) {
  const now = Date.now();
  const found = memory.get(key);

  if (!found || found.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + seconds * 1000 });
    return 1;
  }
  found.count += 1;
  return found.count;
}

/* An unbounded Map in a warm instance is a slow leak. */
function sweep() {
  if (memory.size < 5000) return;
  const now = Date.now();
  memory.forEach(function (entry, key) {
    if (entry.resetAt <= now) memory.delete(key);
  });
}

async function bump(key, seconds) {
  if (hasKv) {
    try {
      return await bumpKv(key, seconds);
    } catch (err) {
      /* KV being unreachable must not become an open door, so fall
         through to the local counter rather than skipping the check. */
      console.error('rate limit: KV unavailable, counting locally —', err.message);
    }
  }
  sweep();
  return bumpMemory(key, seconds);
}

/* Vercel sets x-forwarded-for; the client's address is the first entry,
   and the rest are proxies. A caller can add entries but not remove the
   one Vercel appends at the front. */
function addressOf(req) {
  const header = req.headers['x-forwarded-for'] || '';
  const first = String(header).split(',')[0].trim();
  return first || req.socket && req.socket.remoteAddress || 'unknown';
}

async function check(req) {
  const ip = addressOf(req);
  const hour = Math.floor(Date.now() / (HOUR * 1000));
  const day = Math.floor(Date.now() / (DAY * 1000));

  const mine = await bump('ih:pub:' + ip + ':' + hour, HOUR);
  if (mine > PER_IP) {
    return {
      ok: false,
      retryAfter: HOUR,
      error: 'You have published ' + PER_IP + ' invitations in the last hour. Try again later.'
    };
  }

  const all = await bump('ih:pub:all:' + day, DAY);
  if (all > PER_DAY) {
    return {
      ok: false,
      retryAfter: DAY,
      error: 'The site has reached its publishing limit for today. Try again tomorrow.'
    };
  }

  return { ok: true, address: ip, shared: hasKv };
}

module.exports = { check: check };
