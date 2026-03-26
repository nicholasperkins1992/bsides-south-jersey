/**
 * BSides South Jersey - Dynamic Speaker Loader
 * Fetches speaker JSON files from the speakers/ directory and
 * populates the .speakers-grid element on speakers.html.
 *
 * Speakers are displayed in the order they appear in speakers/index.json.
 */
(function () {
  'use strict';

  const SPEAKERS_DIR = 'speakers/';
  const INDEX_FILE = SPEAKERS_DIR + 'index.json';
  const BIO_PREVIEW_LENGTH = 180;

  /** Truncate text to maxLen characters at a word boundary. */
  function truncateAtWord(text, maxLen) {
    if (text.length <= maxLen) return text;
    const cut = text.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '\u2026';
  }

  /** Minimal HTML escaping for dynamic content. */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Build a speaker <article> card element.
   * @param {{ name: string, bio: string, photo: string, role?: string }} speaker
   * @param {string} id - slug derived from the JSON filename
   * @returns {HTMLElement}
   */
  function buildCard(speaker, id) {
    const name = esc(speaker.name || 'Unknown Speaker');
    const role = esc(speaker.role || '');
    const bioRaw = speaker.bio || '';
    const bioText = Array.isArray(bioRaw) ? bioRaw.join('\n\n') : bioRaw;
    const photo = speaker.photo ? esc(speaker.photo) : '';

    const bioPreview = esc(truncateAtWord(bioText, BIO_PREVIEW_LENGTH));
    const bioFull = Array.isArray(bioRaw)
      ? bioRaw.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('\n')
      : esc(bioText);

    const article = document.createElement('article');
    article.className = 'speaker-card';
    article.setAttribute('data-speaker-id', id);
    article.innerHTML = [
      `<div class="speaker-photo-frame"><img class="speaker-photo" src="${photo}" alt="Portrait of ${name}" /></div>`,
      `<h3 class="speaker-name">${name}</h3>`,
      `<p class="speaker-role">${role}</p>`,
      `<p class="speaker-bio-preview">${bioPreview}</p>`,
      `<button type="button" class="speaker-modal-trigger" data-speaker-id="${id}">Read more</button>`,
      `<details class="speaker-bio-details">`,
      `  <summary>`,
      `    <span class="speaker-toggle-open">Read more</span>`,
      `    <span class="speaker-toggle-close">Show less</span>`,
      `  </summary>`,
      Array.isArray(bioRaw)
        ? `  <div class="speaker-bio-expanded">${bioFull}</div>`
        : `  <p class="speaker-bio-expanded">${bioFull}</p>`,
      `</details>`,
    ].join('\n');

    return article;
  }

  /** Fetch and render all speakers into the .speakers-grid element. */
  async function loadSpeakers() {
    const grid = document.querySelector('.speakers-grid');
    if (!grid) return;

    try {
      const indexResp = await fetch(INDEX_FILE);
      if (!indexResp.ok) {
        throw new Error('Could not load speaker index (' + indexResp.status + ')');
      }
      const index = await indexResp.json();
      const files = Array.isArray(index.speakers) ? index.speakers : [];
      if (files.length === 0) return;

      // Fetch all speaker JSONs in parallel; tolerate individual failures.
      const results = await Promise.allSettled(
        files.map(async function (filename) {
          const url = SPEAKERS_DIR + filename;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('Could not load ' + url + ' (' + resp.status + ')');
          const data = await resp.json();
          const id = filename.replace(/\.json$/i, '');
          return { data: data, id: id };
        })
      );

      const speakers = results
        .filter(function (r) { return r.status === 'fulfilled'; })
        .map(function (r) { return r.value; });

      if (speakers.length === 0) return;

      // Replace placeholder content with real cards.
      grid.innerHTML = '';
      speakers.forEach(function (item) {
        grid.appendChild(buildCard(item.data, item.id));
      });

      // Signal that cards are in the DOM (consumed by terminal.js).
      document.dispatchEvent(new CustomEvent('speakersLoaded'));
    } catch (err) {
      console.error('[speakers.js]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSpeakers);
  } else {
    loadSpeakers();
  }
}());
