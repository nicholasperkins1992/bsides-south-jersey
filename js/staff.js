/**
 * BSides South Jersey - Dynamic Staff Loader
 * Fetches staff JSON files from the staff/ directory and
 * populates the .staff-grid element on about.html.
 *
 * Staff are grouped by their "order" priority (lower = displayed first).
 * Within each priority group the display order is randomised on every page load.
 */
(function () {
  'use strict';

  const STAFF_DIR = 'staff/';
  const INDEX_FILE = STAFF_DIR + 'index.json';

  /** Minimal HTML escaping for dynamic content. */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /** Fisher-Yates shuffle – mutates and returns the array. */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /**
   * Build a staff <article> card element.
   * Shows photo + name linked to LinkedIn.
   */
  function buildCard(member) {
    var name = esc(member.name || 'Unknown');
    var linkedin = esc(member.linkedin || '#');
    var photo = member.photo ? esc(member.photo) : '';

    var a = document.createElement('a');
    a.className = 'speaker-card staff-card';
    a.href = member.linkedin || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', name + ' LinkedIn profile');
    a.innerHTML = [
      '<div class="speaker-photo-frame">',
      '  <img class="speaker-photo" src="' + photo + '" alt="Portrait of ' + name + '" />',
      '</div>',
      '<h3 class="speaker-name staff-name">' + name + '</h3>',
    ].join('\n');

    return a;
  }

  /** Fetch and render all staff into the .staff-grid element. */
  async function loadStaff() {
    var grid = document.querySelector('.staff-grid');
    if (!grid) return;

    try {
      var indexResp = await fetch(INDEX_FILE);
      if (!indexResp.ok) {
        throw new Error('Could not load staff index (' + indexResp.status + ')');
      }
      var index = await indexResp.json();
      var files = Array.isArray(index.staff) ? index.staff : [];
      if (files.length === 0) return;

      // Fetch all staff JSONs in parallel; tolerate individual failures.
      var results = await Promise.allSettled(
        files.map(async function (filename) {
          var url = STAFF_DIR + filename;
          var resp = await fetch(url);
          if (!resp.ok) throw new Error('Could not load ' + url + ' (' + resp.status + ')');
          return await resp.json();
        })
      );

      var members = results
        .filter(function (r) { return r.status === 'fulfilled'; })
        .map(function (r) { return r.value; });

      if (members.length === 0) return;

      // Group by order priority.
      var groups = {};
      members.forEach(function (m) {
        var priority = (m.order !== undefined && m.order !== null) ? m.order : 0;
        if (!groups[priority]) groups[priority] = [];
        groups[priority].push(m);
      });

      // Sort priority keys ascending, shuffle within each group, then flatten.
      var sortedKeys = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
      var ordered = [];
      sortedKeys.forEach(function (key) {
        shuffle(groups[key]).forEach(function (m) { ordered.push(m); });
      });

      // Render cards.
      grid.innerHTML = '';
      ordered.forEach(function (member) {
        grid.appendChild(buildCard(member));
      });
    } catch (err) {
      console.error('[staff.js]', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStaff);
  } else {
    loadStaff();
  }
}());
