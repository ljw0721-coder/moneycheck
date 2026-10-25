#!/usr/bin/env node
// send-domain-mail.mjs — trendcheck.today 도메인 발신의 유일한 경로.
// Standing rule (user, 2026-10-25 13:11 KST): every domain send must be copied
// to the user's Gmail (ljw0721@gmail.com) as a clearly marked 발신 사본.
// This script enforces the copy; do NOT call the CF Email Sending API directly.
//
// Usage:
//   CF_EMAIL_TOKEN_FILE=<path-to-token-file> node scripts/send-domain-mail.mjs \
//     --to <recipient> --subject <subject> --text-file <body.txt> [--from hello@trendcheck.today]
//
// Secrets: the API token is only read from the file named by CF_EMAIL_TOKEN_FILE
// (e.g. the vault item path). It is never logged or included in the copy.
// Output logs only recipient, subject, and message_ids.
import { readFileSync } from 'node:fs';

const ACCOUNT_ID = 'ebcfab6441facedbab9970d72eb928ea';
const COPY_TO = 'ljw0721@gmail.com';
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/email/sending/send`;

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

const to = arg('to');
const subject = arg('subject');
const textFile = arg('text-file');
const from = arg('from') || 'hello@trendcheck.today';
const tokenFile = process.env.CF_EMAIL_TOKEN_FILE;

if (!to || !subject || !textFile || !tokenFile) {
  console.error('required: --to --subject --text-file and env CF_EMAIL_TOKEN_FILE');
  process.exit(2);
}
const text = readFileSync(textFile, 'utf8');
const token = readFileSync(tokenFile, 'utf8').trim();

async function send(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const main = await send({ to, from, subject, text });
if (!main.success) {
  console.error(JSON.stringify({ stage: 'main', errors: main.errors }));
  process.exit(1);
}
const mainId = main.result?.message_id || '';
const queuedAt = new Date().toISOString();

const copyBody = [
  '이 메일은 발신 사본입니다 (사용자 상시 규칙 2026-10-25).',
  '',
  `원본 발송 시각(UTC): ${queuedAt}`,
  `원본 발송 상태: Cloudflare 전송 큐 투입 완료(queued)`,
  `원본 message_id: ${mainId}`,
  '',
  '----- 원본 메일 -----',
  `받는 사람: ${to}`,
  `보낸 사람: ${from}`,
  `제목: ${subject}`,
  '',
  text.trimEnd(),
  '',
  '----- 사본 끝 -----',
].join('\n');

const copy = await send({
  to: COPY_TO,
  from,
  subject: `[발신 사본] ${subject}`,
  text: copyBody,
});
if (!copy.success) {
  // main send already happened — report both states, never silently
  console.log(JSON.stringify({ stage: 'copy-failed-after-main-sent', main_message_id: mainId, copy_errors: copy.errors }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, to, subject, main_message_id: mainId, copy_message_id: copy.result?.message_id || '' }));
