/* ====================================================================
   api/_expiry.js — how long a hosted invitation stays online

   A hosted card and its host page live through the event and for
   DAYS_AFTER_EVENT days after it. The clock runs to the end of that last
   day in India (the site's market), then:

     api/invite   stops serving the pages ("This invitation has ended")
     api/cleanup  deletes the pages and their media from the repository

   An invitation with no event date counts from the day it was hosted, and
   nobody who pays gets less than DAYS_AFTER_EVENT days from hosting — a
   card published for a date already in the past is not dead on arrival.

   Registry entries written before this rule (no expiresAt) never expire.
   ==================================================================== */

'use strict';

const DAYS_AFTER_EVENT = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

/* 'YYYY-MM-DD' -> the last millisecond of that day in IST (UTC+05:30). */
function endOfDayIst(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''));
  if (!m) return NaN;
  return Date.parse(m[1] + '-' + m[2] + '-' + m[3] + 'T23:59:59.999+05:30');
}

/* -> ISO string of the moment the invitation stops being served. */
function expiresAt(eventDate, hostedAt) {
  const hosted = Date.parse(hostedAt) || Date.now();
  const floor = hosted + DAYS_AFTER_EVENT * DAY_MS;
  const eventEnd = endOfDayIst(eventDate);
  const fromEvent = isNaN(eventEnd) ? floor : eventEnd + DAYS_AFTER_EVENT * DAY_MS;
  return new Date(Math.max(fromEvent, floor)).toISOString();
}

/* Seconds left before an entry expires; Infinity when it never does. */
function secondsLeft(entry, now) {
  const at = entry && Date.parse(entry.expiresAt);
  if (!at) return Infinity;
  return Math.floor((at - (now || Date.now())) / 1000);
}

function isExpired(entry, now) {
  return secondsLeft(entry, now) <= 0;
}

module.exports = {
  DAYS_AFTER_EVENT: DAYS_AFTER_EVENT,
  expiresAt: expiresAt,
  secondsLeft: secondsLeft,
  isExpired: isExpired
};
