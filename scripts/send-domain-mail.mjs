#!/usr/bin/env node
// send-domain-mail.mjs — trendcheck.today 도메인 발신의 표준 경로.
// Standing rule (user, 2026-10-25 13:11 KST): every domain send must be copied
// to the user's Gmail (ljw0721@gmail.com) as a clearly marked 발신 사본.
//
// Usage:
//   CF_EMAIL_TOKEN_FILE=<path> node scripts/send-domain-mail.mjs \
//     --to <recipient> --subject <subject> --text-file <body.txt> [--from hello@trendcheck.today]
//   node scripts/send-domain-mail.mjs --retry-copy <send-record.json>   (copy-only, never re-sends original)
//
// Guarantees:
//  - original send fails  -> no copy, non-zero exit, nothing recorded as sent
//  - original sent        -> exactly one copy attempt to the user's Gmail
//  - copy fails           -> durable record at mail-log/<ts>.json, non-zero exit;
//                            recover with --retry-copy (copy only, original never duplicated)
//  - token is read from CF_EMAIL_TOKEN_FILE only and never logged/recorded
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ACCOUNT_ID = 'ebcfab6441facedbab9970d72eb928ea';
const COPY_TO = 'ljw0721@gmail.com';
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/email/sending/send`;
const LOG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'mail-log');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function send(token, payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function buildCopyBody(rec) {
  return [
    '이 메일은 발신 사본입니다 (사용자 상시 규칙 2026-10-25).',
    '',
    `원본 발송 시각(UTC): ${rec.queued_at}`,
    '원본 발송 상태: Cloudflare 전송 큐 투입 완료(queued)',
    `원본 message_id: ${rec.main_message_id}`,
    '',
    '----- 원본 메일 -----',
    `받는 사람: ${rec.to}`,
    `보낸 사람: ${rec.from}`,
    `제목: ${rec.subject}`,
    '',
    rec.text.trimEnd(),
    '',
    '----- 사본 끝 -----',
  ].join('\n');
}

function copyPayload(rec) {
  return { to: COPY_TO, from: rec.from, subject: `[발신 사본] ${rec.subject}`, text: buildCopyBody(rec) };
}

function writeRecord(rec) {
  mkdirSync(LOG_DIR, { recursive: true });
  const p = resolve(LOG_DIR, `${rec.queued_at.replace(/[:.]/g, '-')}.json`);
  writeFileSync(p, JSON.stringify(rec, null, 2));
  return p;
}

const tokenFile = process.env.CF_EMAIL_TOKEN_FILE;
if (!tokenFile) { console.error(JSON.stringify({ error: 'CF_EMAIL_TOKEN_FILE required' })); process.exit(2); }
const token = readFileSync(tokenFile, 'utf8').trim();

// ---- retry-copy mode: send ONLY the copy for a previously-sent original ----
const retryPath = arg('retry-copy');
if (retryPath) {
  const rec = JSON.parse(readFileSync(retryPath, 'utf8'));
  if (rec.copy_status === 'sent') { console.log(JSON.stringify({ ok: true, already_copied: rec.copy_message_id })); process.exit(0); }
  const copy = await send(token, copyPayload(rec));
  if (!copy.success) {
    console.error(JSON.stringify({ stage: 'retry-copy-failed', record: retryPath, errors: copy.errors }));
    process.exit(1);
  }
  rec.copy_status = 'sent';
  rec.copy_message_id = copy.result?.message_id || '';
  writeFileSync(retryPath, JSON.stringify(rec, null, 2));
  console.log(JSON.stringify({ ok: true, retried_copy: true, copy_message_id: rec.copy_message_id }));
  process.exit(0);
}

// ---- normal send mode ----
const to = arg('to');
const subject = arg('subject');
const textFile = arg('text-file');
const from = arg('from') || 'hello@trendcheck.today';
if (!to || !subject || !textFile) {
  console.error(JSON.stringify({ error: 'required: --to --subject --text-file' }));
  process.exit(2);
}
const text = readFileSync(textFile, 'utf8');

const main = await send(token, { to, from, subject, text });
if (!main.success) {
  console.error(JSON.stringify({ stage: 'main', sent: false, copy_sent: false, errors: main.errors }));
  process.exit(1);
}

const rec = {
  to, from, subject, text,
  queued_at: new Date().toISOString(),
  main_message_id: main.result?.message_id || '',
  copy_status: 'pending',
};
const copy = await send(token, copyPayload(rec));
if (!copy.success) {
  rec.copy_status = 'failed';
  const p = writeRecord(rec);
  console.error(JSON.stringify({ stage: 'copy-failed-after-main-sent', main_message_id: rec.main_message_id, copy_sent: false, record: p, retry: `node scripts/send-domain-mail.mjs --retry-copy ${p}` }));
  process.exit(1);
}
rec.copy_status = 'sent';
rec.copy_message_id = copy.result?.message_id || '';
const p = writeRecord(rec);
console.log(JSON.stringify({ ok: true, to, subject, main_message_id: rec.main_message_id, copy_message_id: rec.copy_message_id, record: p }));
