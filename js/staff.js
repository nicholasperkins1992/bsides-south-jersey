/**
 * BSides South Jersey - Dynamic Staff Loader
 * Fetches staff JSON files from the staff/ directory and
 * populates the #staff-founders and #staff-organizers grids on about.html.
 *
 * Staff with category "founder" appear in the Founders section.
 * Staff with category "organizer" appear in the Organizers section.
 * Within each section the display order is randomised on every page load.
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
   * Build a staff <a> card element.
   * Shows photo + name linked to LinkedIn.
   */
  function buildCard(member) {
    var name = esc(member.name || 'Unknown');
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

  /** Fetch and render all staff into the two category grids. */
  async function loadStaff() {
    var foundersGrid = document.getElementById('staff-founders');
    var organizersGrid = document.getElementById('staff-organizers');
    if (!foundersGrid && !organizersGrid) return;

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

      // Split into founders and organizers, shuffle each group.
      var founders = shuffle(members.filter(function (m) { return m.category === 'founder'; }));
      var organizers = shuffle(members.filter(function (m) { return m.category === 'organizer'; }));

      // Render founders.
      if (foundersGrid) {
        foundersGrid.innerHTML = '';
        founders.forEach(function (member) {
          foundersGrid.appendChild(buildCard(member));
        });
      }

      // Render organizers.
      if (organizersGrid) {
        organizersGrid.innerHTML = '';
        organizers.forEach(function (member) {
          organizersGrid.appendChild(buildCard(member));
        });
      }
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
