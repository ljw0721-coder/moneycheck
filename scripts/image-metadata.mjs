// Shared image-rights policy for article generation, backfills and deploy checks.
// Credits identify creators/providers; they never establish copyright ownership.
import { readFileSync } from 'node:fs';

export const SITE = 'https://trendcheck.today';
export const FALLBACK_IMAGE = `${SITE}/og-default.png`;
export const DEFAULT_RIGHTS_FILE = new URL('../data/image-rights.json', import.meta.url);
export const loadImageRights = (file = DEFAULT_RIGHTS_FILE) => JSON.parse(readFileSync(file, 'utf8'));
export const imageUrl = (value) => new URL(value, SITE).href;
// A '<' in JSON-LD must not terminate its containing HTML script element.
export const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim() || /^(unknown|tbd|todo|placeholder)$/i.test(value.trim())) {
    throw new Error(`${field}: verified, non-empty text is required`);
  }
}

function requireUrl(value, field) {
  requireText(value, field);
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${field}: an HTTPS URL without credentials is required`);
}

function requireAgent(agent, field) {
  if (!agent || !['Person', 'Organization'].includes(agent['@type'])) throw new Error(`${field}: Person or Organization is required`);
  requireText(agent.name, `${field}.name`);
}

export function validateRightsRecord(url, record) {
  requireUrl(url, 'image URL');
  if (!record || !['cc0', 'public-domain', 'copyrighted'].includes(record.rightsStatus)) throw new Error(`${url}: verified rightsStatus is required`);
  for (const field of ['sourcePage', 'license']) requireUrl(record[field], field);
  for (const field of ['creditText', 'copyrightNotice', 'evidence']) requireText(record[field], field);
  requireAgent(record.creator, 'creator');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.verifiedOn || '') || Number.isNaN(Date.parse(record.verifiedOn))) throw new Error('verifiedOn: YYYY-MM-DD is required');
  if (record.usageInfo) requireUrl(record.usageInfo, 'usageInfo');
  if (record.acquireLicensePage) requireUrl(record.acquireLicensePage, 'acquireLicensePage');
  for (const evidenceUrl of record.evidenceUrls || []) requireUrl(evidenceUrl, 'evidenceUrls');

  if (record.rightsStatus === 'copyrighted') {
    // An actual holder and its source-verified notice are mandatory; no publisher default.
    requireAgent(record.copyrightHolder, 'copyrightHolder');
    if (!record.copyrightNotice.includes(record.copyrightHolder.name)) throw new Error('copyrightNotice must identify the verified copyrightHolder');
  } else {
    if (record.copyrightHolder || /©|\(c\)|all rights reserved/i.test(record.copyrightNotice)) throw new Error('CC0/public-domain images must not claim a copyright holder or reserved copyright');
    if (record.rightsStatus === 'cc0') {
      if (record.license !== 'https://creativecommons.org/publicdomain/zero/1.0/' || record.copyrightNotice !== 'CC0 1.0 Universal; no copyright reserved.') throw new Error('CC0 requires the CC0 dedication and no-copyright notice');
    } else {
      requireText(record.jurisdiction, 'public-domain jurisdiction');
      if (!/public domain/i.test(record.copyrightNotice)) throw new Error('public-domain notice must state its actual public-domain status');
      if (/creativecommons\.org\/publicdomain\/zero\//.test(record.license)) throw new Error('An author public-domain release is not automatically CC0');
    }
  }
  return record;
}

export function buildImageObject(value, registry) {
  const url = imageUrl(value);
  const record = validateRightsRecord(url, registry[url]);
  const image = {
    '@type': 'ImageObject', url, contentUrl: url,
    creditText: record.creditText, creator: record.creator,
    license: record.license, copyrightNotice: record.copyrightNotice,
    isBasedOn: record.sourcePage,
  };
  // Public-domain works need no acquisition link. Add one only when verified.
  for (const key of ['usageInfo', 'acquireLicensePage', 'copyrightHolder']) {
    if (record[key]) image[key] = record[key];
  }
  return image;
}

// Inspect every JSON-LD node, including @graph, image arrays and nested objects.
export function imageObjects(value) {
  if (!value || typeof value !== 'object') return [];
  const found = [value['@type']].flat().includes('ImageObject') ? [value] : [];
  return found.concat(Object.values(value).flatMap(imageObjects));
}

export function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script\s*>/gi)];
  return blocks.map((match) => JSON.parse(match[1]));
}

const decodeAttribute = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
}

export function validateArticleImages(html, registry) {
  const errors = [];
  let nodes;
  try { nodes = parseJsonLd(html); } catch (error) { return [`Invalid JSON-LD: ${error.message}`]; }
  const images = nodes.flatMap(imageObjects);
  for (const image of images) {
    try {
      const url = imageUrl(image.contentUrl || image.url);
      const expected = buildImageObject(url, registry);
      for (const key of Object.keys(expected)) {
        if (JSON.stringify(image[key]) !== JSON.stringify(expected[key])) errors.push(`${url}: ${key} differs from verified image rights`);
      }
      // Catch unverified rights claims even if they are not in the expected object.
      for (const key of ['copyrightHolder', 'copyrightYear', 'acquireLicensePage', 'usageInfo']) {
        if (image[key] !== undefined && expected[key] === undefined) errors.push(`${url}: unverified ${key}`);
      }
    } catch (error) { errors.push(error.message); }
  }
  // Any custom social/inline article image must also carry its verified ImageObject.
  const urls = [];
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], 'property')?.toLowerCase() === 'og:image') urls.push(attribute(match[0], 'content'));
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) urls.push(attribute(match[0], 'src'));
  for (const value of urls.filter(Boolean)) {
    try {
      const url = imageUrl(decodeAttribute(value));
      if (url === FALLBACK_IMAGE) continue; // A generic fallback is not a third-party rights claim.
      buildImageObject(url, registry);
      if (!images.some((image) => image.contentUrl === url)) errors.push(`${url}: custom article image has no ImageObject with contentUrl`);
    } catch (error) { errors.push(error.message); }
  }
  return [...new Set(errors)];
}
