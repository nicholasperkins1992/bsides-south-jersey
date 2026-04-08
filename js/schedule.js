/**
 * BSides South Jersey - Schedule Page
 * Fetches schedule/schedule.json and renders an interactive, time-proportional
 * multi-track schedule grid with:
 *   - A live "now" progress bar (conference day only)
 *   - Past-event greying
 *   - Auto-scroll to current time
 *   - Click/tap modal with talk description and speaker bio
 */
(function () {
  'use strict';

  const SCHEDULE_FILE = 'schedule/schedule.json';
  const SPEAKERS_DIR  = 'speakers/';

  // Minutes from midnight for the full visible grid window
  const GRID_START_HOUR = 8;   // 08:00
  const GRID_END_HOUR   = 17;  // 17:00 (buffer past last event)
  const GRID_START_MIN  = GRID_START_HOUR * 60;
  const GRID_TOTAL_MIN  = (GRID_END_HOUR * 60) - GRID_START_MIN;

  // Height in pixels per minute (controls the vertical density of the grid)
  const PX_PER_MIN = 2.8;

  /** Minimal HTML escaping for dynamic content. */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /** Convert "HH:MM" string to total minutes from midnight. */
  function toMinutes(timeStr) {
    const parts = String(timeStr).split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  /** Convert 24h "HH:MM" to display "H:MM AM/PM". */
  function toDisplay(timeStr) {
    const parts = String(timeStr).split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  }

  /** Return the pixel top offset for a given time string within the grid. */
  function topPx(timeStr) {
    return (toMinutes(timeStr) - GRID_START_MIN) * PX_PER_MIN;
  }

  /** Return the pixel height for a slot's duration. */
  function heightPx(startStr, endStr) {
    return (toMinutes(endStr) - toMinutes(startStr)) * PX_PER_MIN;
  }

  // ─── Modal ───────────────────────────────────────────────────────────────────

  let modal, modalBackdrop, modalClose, modalTitle, modalSpeaker,
      modalTime, modalDesc, modalBioWrap, modalBio;

  function setupModal() {
    modal         = document.getElementById('scheduleModal');
    modalBackdrop = modal.querySelector('[data-close-schedule-modal]');
    modalClose    = document.getElementById('scheduleModalClose');
    modalTitle    = document.getElementById('scheduleModalTitle');
    modalSpeaker  = document.getElementById('scheduleModalSpeaker');
    modalTime     = document.getElementById('scheduleModalTime');
    modalDesc     = document.getElementById('scheduleModalDesc');
    modalBioWrap  = document.getElementById('scheduleModalBioWrap');
    modalBio      = document.getElementById('scheduleModalBio');

    modalBackdrop.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function openModal(slot) {
    modalTitle.textContent   = slot.title || '';
    modalSpeaker.textContent = slot.speaker || '';
    modalSpeaker.style.display = slot.speaker ? '' : 'none';
    modalTime.textContent    =
      toDisplay(slot.start) + ' – ' + toDisplay(slot.end);
    modalDesc.textContent    = slot.description || '';
    modalDesc.style.display  = slot.description ? '' : 'none';

    // Clear previous bio
    modalBioWrap.style.display = 'none';
    modalBio.innerHTML = '';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('speaker-modal-open');

    // Lazy-load speaker bio if a speakerFile is provided
    if (slot.speakerFile) {
      const url = SPEAKERS_DIR + slot.speakerFile + '.json';
      fetch(url)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (data) {
          const bioRaw = data.bio || '';
          const bioText = Array.isArray(bioRaw) ? bioRaw : [bioRaw];
          modalBio.innerHTML = bioText
            .map(function (p) { return '<p>' + esc(p) + '</p>'; })
            .join('');
          modalBioWrap.style.display = '';
        })
        .catch(function () {
          // Speaker JSON not available yet — modal still shown without bio
        });
    }
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('speaker-modal-open');
  }

  // ─── Now Bar ─────────────────────────────────────────────────────────────────

  let nowBarEl = null;
  let mobileCurrentGroup = null;
  let mobileNextGroup = null;
  let conferenceDate = null;
  // Stashed after data loads so updateMobileGroups() can read slot times.
  let scheduleSlots = null;

  // ─── Debug / Test Mode ───────────────────────────────────────────────────────
  // mockDate overrides the real clock when set.
  // Click/tap "Schedule" 5× to open the input overlay; Enter to apply; Escape to cancel.
  let mockDate = null;

  /** Returns the effective "now" — real clock or mock override. */
  function effectiveNow() {
    return mockDate ? new Date(mockDate) : new Date();
  }

  function isConferenceDay() {
    if (!conferenceDate) return false;
    const today = effectiveNow();
    return (
      today.getFullYear() === conferenceDate.getFullYear() &&
      today.getMonth()    === conferenceDate.getMonth() &&
      today.getDate()     === conferenceDate.getDate()
    );
  }

  function currentMinutes() {
    const now = effectiveNow();
    return now.getHours() * 60 + now.getMinutes();
  }

  function nowTimeLabel() {
    const min = currentMinutes();
    const h = Math.floor(min / 60);
    const m = String(min % 60).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    return '▶ NOW ' + dh + ':' + m + ' ' + ampm;
  }

  /** Label for the amber "upcoming" divider: "▶ IN X MINUTES" */
  function nextStartLabel() {
    if (!scheduleSlots) return '';
    const min = currentMinutes();
    let nextMin = Infinity;
    scheduleSlots.forEach(function (s) {
      const sm = toMinutes(s.start);
      if (sm > min && sm < nextMin) nextMin = sm;
    });
    if (nextMin === Infinity) return '';
    const diff = nextMin - min;
    if (diff < 1) return '▶ STARTING NOW';
    return '▶ IN ' + diff + (diff === 1 ? ' MINUTE' : ' MINUTES');
  }

  function updateNowBar() {
    if (!nowBarEl) return;
    if (!isConferenceDay()) return;

    const min = currentMinutes();
    const top = (min - GRID_START_MIN) * PX_PER_MIN;

    // Only show bar when within grid range
    if (min < GRID_START_MIN || min > GRID_START_MIN + GRID_TOTAL_MIN) {
      nowBarEl.style.display = 'none';
      return;
    }
    nowBarEl.style.display = '';
    nowBarEl.style.top = top + 'px';
    nowBarEl.querySelector('.schedule-now-label').textContent = nowTimeLabel();
  }

  function updateMobileGroups() {
    const list = document.getElementById('schedule-mobile-list');
    if (!list || !scheduleSlots) return;

    const min = isConferenceDay() ? currentMinutes() : null;

    // Classify slot ids into currently-active and next-upcoming batch
    const currentSet = new Set();
    let nextStartMin = Infinity;

    if (min !== null) {
      scheduleSlots.forEach(function (s) {
        const sm = toMinutes(s.start);
        const em = toMinutes(s.end);
        if (sm <= min && min < em) {
          currentSet.add(s.id);
        } else if (sm > min && sm < nextStartMin) {
          nextStartMin = sm;
        }
      });
    }

    const nextSet = new Set();
    if (nextStartMin !== Infinity) {
      scheduleSlots.forEach(function (s) {
        if (toMinutes(s.start) === nextStartMin) nextSet.add(s.id);
      });
    }

    // Update group labels and visibility
    if (currentSet.size > 0) {
      mobileCurrentGroup.querySelector('.schedule-mobile-group-label').textContent = '\u25b6 NOW';
      mobileCurrentGroup.style.display = '';
    } else {
      mobileCurrentGroup.style.display = 'none';
    }
    if (nextSet.size > 0) {
      const min = currentMinutes();
      let nextMin = Infinity;
      scheduleSlots.forEach(function (s) {
        const sm = toMinutes(s.start);
        if (sm > min && sm < nextMin) nextMin = sm;
      });
      const diff = nextMin === Infinity ? 0 : nextMin - min;
      const timeStr = nextMin === Infinity ? '' : toDisplay(
        String(Math.floor(nextMin / 60)).padStart(2, '0') + ':' + String(nextMin % 60).padStart(2, '0')
      );
      const diffLabel = diff < 1 ? timeStr + ' (starting now)' : timeStr + ' (in ' + diff + (diff === 1 ? ' minute)' : ' minutes)');
      mobileNextGroup.querySelector('.schedule-mobile-group-label').textContent = '\u25b6 NEXT \u2014 ' + diffLabel;
      mobileNextGroup.style.display = '';
    } else {
      mobileNextGroup.style.display = 'none';
    }

    // Build the expected sequence of direct list children (groups stand in for their slots)
    const slotsInOrder = scheduleSlots.filter(function (s) { return s.type !== 'transition'; });
    const desired = [];
    let cgAdded = false;
    let ngAdded = false;

    slotsInOrder.forEach(function (s) {
      if (currentSet.has(s.id)) {
        if (!cgAdded) { desired.push(mobileCurrentGroup); cgAdded = true; }
      } else if (nextSet.has(s.id)) {
        if (!ngAdded) { desired.push(mobileNextGroup); ngAdded = true; }
      } else {
        const el = document.getElementById('mobile-slot-' + s.id);
        if (el) desired.push(el);
      }
    });

    // Move each slot to its correct parent
    slotsInOrder.forEach(function (s) {
      const el = document.getElementById('mobile-slot-' + s.id);
      if (!el) return;
      if (currentSet.has(s.id)) {
        if (el.parentElement !== mobileCurrentGroup) mobileCurrentGroup.appendChild(el);
      } else if (nextSet.has(s.id)) {
        if (el.parentElement !== mobileNextGroup) mobileNextGroup.appendChild(el);
      } else {
        if (el.parentElement !== list) list.appendChild(el);
      }
    });

    // Re-sort direct list children to match desired order
    desired.forEach(function (el, i) {
      if (list.children[i] !== el) {
        list.insertBefore(el, list.children[i] || null);
      }
    });
  }

  function scrollToNow() {
    if (!isConferenceDay()) return;
    requestAnimationFrame(function () {
      // Detect which layout is active by checking if the mobile list is rendered
      const mobileList = document.getElementById('schedule-mobile-list');
      const isMobileLayout = mobileList &&
        window.getComputedStyle(mobileList).display !== 'none';

      var target;
      if (isMobileLayout) {
        // Prefer scrolling to the "NOW" header box, then amber upcoming box
        const scrollTarget = (mobileCurrentGroup && mobileCurrentGroup.style.display !== 'none')
          ? mobileCurrentGroup
          : (mobileNextGroup && mobileNextGroup.style.display !== 'none') ? mobileNextGroup : null;
        if (scrollTarget) {
          const rect = scrollTarget.getBoundingClientRect();
          target = Math.max(0, rect.top + window.pageYOffset - window.innerHeight * 0.2);
        }
      } else if (nowBarEl && nowBarEl.style.display !== 'none') {
        const rect = nowBarEl.getBoundingClientRect();
        target = Math.max(0, rect.top + window.pageYOffset - window.innerHeight * 0.3);
      }
      if (target === undefined) return;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  }

  // ─── Status Banner ───────────────────────────────────────────────────────────

  function renderStatusBanner(confDate) {
    const banner = document.getElementById('schedule-status-banner');
    if (!banner) return;

    const today = effectiveNow();
    today.setHours(0, 0, 0, 0);
    const conf = new Date(confDate);
    conf.setHours(0, 0, 0, 0);

    const diffDays = Math.round((conf - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      banner.textContent = '> Conference begins in ' + diffDays + ' day' +
        (diffDays === 1 ? '' : 's') + '. Times shown are Eastern.';
      banner.className = 'schedule-status-banner schedule-status-banner--upcoming';
    } else if (diffDays === 0) {
      banner.textContent = '> Conference is TODAY! Times shown are Eastern.';
      banner.className = 'schedule-status-banner schedule-status-banner--today';
    } else {
      banner.textContent = '';
      banner.className = 'schedule-status-banner';
    }
  }

  // ─── Grid Builder ────────────────────────────────────────────────────────────

  function buildGrid(data) {
    const container = document.querySelector('.schedule-grid-container');
    if (!container) return;

    const tracks = data.tracks;
    const slots  = data.slots;

    // Total height of the time axis area
    const totalHeight = GRID_TOTAL_MIN * PX_PER_MIN;

    // ── Outer wrapper: time labels + track columns side by side
    const wrapper = document.createElement('div');
    wrapper.className = 'schedule-grid-wrapper';

    // ── Time label column
    const timeCol = document.createElement('div');
    timeCol.className = 'schedule-time-column';
    timeCol.style.height = totalHeight + 'px';

    // Generate a label every 30 minutes
    for (let m = 0; m <= GRID_TOTAL_MIN; m += 30) {
      const absMin = GRID_START_MIN + m;
      const h = Math.floor(absMin / 60);
      const min = String(absMin % 60).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const dh = h % 12 || 12;

      const label = document.createElement('div');
      label.className = 'schedule-time-label';
      label.style.top = (m * PX_PER_MIN) + 'px';
      label.textContent = dh + ':' + min + ' ' + ampm;
      timeCol.appendChild(label);
    }

    wrapper.appendChild(timeCol);

    // ── Tracks area
    const tracksArea = document.createElement('div');
    tracksArea.className = 'schedule-tracks-area';

    // Track header row
    const headerRow = document.createElement('div');
    headerRow.className = 'schedule-track-headers';
    tracks.forEach(function (track) {
      const h = document.createElement('div');
      h.className = 'schedule-track-header';
      h.textContent = track.label;
      headerRow.appendChild(h);
    });
    tracksArea.appendChild(headerRow);

    // Track columns body
    const columnsBody = document.createElement('div');
    columnsBody.className = 'schedule-columns-body';
    columnsBody.style.height = totalHeight + 'px';

    // Create one column per track
    const trackCols = {};
    tracks.forEach(function (track) {
      const col = document.createElement('div');
      col.className = 'schedule-track-column';
      col.setAttribute('data-track', track.id);
      col.style.height = totalHeight + 'px';
      columnsBody.appendChild(col);
      trackCols[track.id] = col;
    });

    // ── Now bar (positioned inside columnsBody)
    nowBarEl = document.createElement('div');
    nowBarEl.className = 'schedule-now-bar';
    nowBarEl.innerHTML = '<span class="schedule-now-label"></span>';
    nowBarEl.style.display = 'none';
    columnsBody.appendChild(nowBarEl);

    // ── Place slots
    slots.forEach(function (slot) {
      if (slot.type === 'transition') return; // skip dividers

      const top    = topPx(slot.start);
      const height = heightPx(slot.start, slot.end);
      const isClickable = ['talk', 'keynote', 'panel', 'ceremony'].includes(slot.type);

      if (slot.track === 'all' || slot.isKeynote) {
        // Full-width slot — spans a pseudo-element overlaid across all track columns
        const card = document.createElement('div');
        card.id = 'slot-' + slot.id;
        card.className = buildSlotClass(slot, isClickable);
        card.style.cssText = 'top:' + top + 'px;height:' + height + 'px;';
        if (isClickable) {
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');
          card.setAttribute('aria-label', slot.title);
        }
        card.innerHTML = buildSlotInner(slot);
        // Overlay covers all track columns
        columnsBody.appendChild(card);
        // Position it absolutely to span full width of columnsBody
        card.style.position = 'absolute';
        card.style.left  = '0';
        card.style.right = '0';
        card.style.zIndex = '2';
      } else {
        const col = trackCols[slot.track];
        if (!col) return;

        const card = document.createElement('div');
        card.id = 'slot-' + slot.id;
        card.className = buildSlotClass(slot, isClickable);
        card.style.cssText = 'top:' + top + 'px;height:' + height + 'px;';
        if (isClickable) {
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');
          card.setAttribute('aria-label', slot.title);
        }
        card.innerHTML = buildSlotInner(slot);
        col.appendChild(card);
      }
    });

    tracksArea.appendChild(columnsBody);
    wrapper.appendChild(tracksArea);
    container.appendChild(wrapper);

    // ── Event delegation for modal triggers
    container.addEventListener('click', function (e) {
      const card = e.target.closest('[role="button"]');
      if (!card) return;
      const slotId = card.id.replace('slot-', '');
      const slot = slots.find(function (s) { return s.id === slotId; });
      if (slot) openModal(slot);
    });
    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[role="button"]');
      if (!card) return;
      e.preventDefault();
      const slotId = card.id.replace('slot-', '');
      const slot = slots.find(function (s) { return s.id === slotId; });
      if (slot) openModal(slot);
    });

    return slots;
  }

  function buildSlotClass(slot, isClickable) {
    const classes = ['schedule-slot', 'schedule-slot--' + slot.type];
    if (slot.isKeynote) classes.push('schedule-slot--is-keynote');
    if (isClickable)   classes.push('schedule-slot--clickable');
    return classes.join(' ');
  }

  function buildSlotInner(slot) {
    const parts = [];
    const timeStr = toDisplay(slot.start) + '–' + toDisplay(slot.end);

    if (slot.type === 'keynote' || slot.isKeynote) {
      parts.push('<span class="schedule-slot-badge">KEYNOTE</span>');
    }
    if (slot.type === 'panel') {
      parts.push('<span class="schedule-slot-badge schedule-slot-badge--panel">PANEL</span>');
    }

    parts.push('<span class="schedule-slot-time">' + esc(timeStr) + '</span>');

    if (slot.speaker) {
      parts.push('<span class="schedule-slot-speaker">' + esc(slot.speaker) + '</span>');
    }

    parts.push('<span class="schedule-slot-title">' + esc(slot.title) + '</span>');

    if (['talk', 'keynote', 'panel'].includes(slot.type) && slot.description) {
      parts.push('<span class="schedule-slot-hint">tap for details</span>');
    }

    return parts.join('');
  }

  // ─── Mobile List View ────────────────────────────────────────────────────────

  function buildMobileList(data) {
    const list = document.getElementById('schedule-mobile-list');
    if (!list) return;

    // Stash for use by updateMobileNowDivider() and nextStartLabel()
    scheduleSlots = data.slots;

    const slots = data.slots.filter(function (s) { return s.type !== 'transition'; });

    slots.forEach(function (slot) {
      const isClickable = ['talk', 'keynote', 'panel', 'ceremony'].includes(slot.type);
      const item = document.createElement('div');
      item.id = 'mobile-slot-' + slot.id;
      item.className = buildSlotClass(slot, isClickable) + ' schedule-slot--mobile';

      if (isClickable) {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', slot.title);
      }

      // Track label for multi-track slots on mobile
      let trackLabel = '';
      if (slot.track !== 'all' && !slot.isKeynote) {
        const trackName = data.tracks.find(function (t) { return t.id === slot.track; });
        if (trackName) {
          trackLabel = '<span class="schedule-slot-track-label">' + esc(trackName.label) + '</span>';
        }
      }

      const timeStr = toDisplay(slot.start) + ' – ' + toDisplay(slot.end);
      item.innerHTML = [
        trackLabel,
        slot.isKeynote ? '<span class="schedule-slot-badge">KEYNOTE</span>' : '',
        slot.type === 'panel' ? '<span class="schedule-slot-badge schedule-slot-badge--panel">PANEL</span>' : '',
        '<span class="schedule-slot-time">' + esc(timeStr) + '</span>',
        slot.speaker ? '<span class="schedule-slot-speaker">' + esc(slot.speaker) + '</span>' : '',
        '<span class="schedule-slot-title">' + esc(slot.title) + '</span>',
      ].join('');

      list.appendChild(item);
    });

    // Group wrappers — populated and positioned by updateMobileGroups() each tick
    mobileCurrentGroup = document.createElement('div');
    mobileCurrentGroup.id = 'mobile-current-group';
    mobileCurrentGroup.className = 'schedule-mobile-group schedule-mobile-group--current';
    mobileCurrentGroup.setAttribute('aria-hidden', 'true');
    mobileCurrentGroup.innerHTML = '<div class="schedule-mobile-group-label"></div>';
    mobileCurrentGroup.style.display = 'none';
    list.appendChild(mobileCurrentGroup);

    mobileNextGroup = document.createElement('div');
    mobileNextGroup.id = 'mobile-next-group';
    mobileNextGroup.className = 'schedule-mobile-group schedule-mobile-group--next';
    mobileNextGroup.setAttribute('aria-hidden', 'true');
    mobileNextGroup.innerHTML = '<div class="schedule-mobile-group-label"></div>';
    mobileNextGroup.style.display = 'none';
    list.appendChild(mobileNextGroup);

    // Event delegation for mobile modal
    list.addEventListener('click', function (e) {
      const card = e.target.closest('[role="button"]');
      if (!card) return;
      const slotId = card.id.replace('mobile-slot-', '');
      const slot = data.slots.find(function (s) { return s.id === slotId; });
      if (slot) openModal(slot);
    });
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[role="button"]');
      if (!card) return;
      e.preventDefault();
      const slotId = card.id.replace('mobile-slot-', '');
      const slot = data.slots.find(function (s) { return s.id === slotId; });
      if (slot) openModal(slot);
    });

    return data.slots;
  }

  // ─── Debug / Test Overlay ────────────────────────────────────────────────────
  // Press 'C' to open. Type a datetime like "2026-04-18 10:30", press Enter.
  // A TEST MODE badge appears while active. Click/tap "Schedule" 5× again or click Reset to clear.

  function setupDebugOverlay(data, tick) {
    // Build overlay DOM
    const overlay = document.createElement('div');
    overlay.id = 'schedule-debug-overlay';
    overlay.className = 'schedule-debug-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = [
      '<div class="schedule-debug-box">',
      '  <div class="schedule-debug-title">&#62; SET TEST TIME</div>',
      '  <div class="schedule-debug-hint">Format: YYYY-MM-DD HH:MM (24h, e.g. 2026-04-18 10:30)</div>',
      '  <div class="schedule-debug-input-row">',
      '    <span class="schedule-debug-prompt">&#62;_</span>',
      '    <input',
      '      id="schedule-debug-input"',
      '      class="schedule-debug-input"',
      '      type="text"',
      '      maxlength="16"',
      '      autocomplete="off"',
      '      spellcheck="false"',
      '      aria-label="Test datetime input"',
      '    />',
      '  </div>',
      '  <div class="schedule-debug-actions">',
      '    <button type="button" id="schedule-debug-apply" class="schedule-debug-btn">APPLY [Enter]</button>',
      '    <button type="button" id="schedule-debug-cancel" class="schedule-debug-btn schedule-debug-btn--cancel">CANCEL [Esc]</button>',
      '  </div>',
      '  <div class="schedule-debug-error" id="schedule-debug-error"></div>',
      '</div>',
    ].join('');
    document.body.appendChild(overlay);

    // Build persistent badge
    const badge = document.createElement('div');
    badge.id = 'schedule-debug-badge';
    badge.className = 'schedule-debug-badge';
    badge.style.display = 'none';
    badge.innerHTML =
      '<span id="schedule-debug-badge-text"></span>' +
      '<button type="button" id="schedule-debug-reset" class="schedule-debug-reset" aria-label="Clear test time">&#10005; RESET</button>';
    document.body.appendChild(badge);

    const input     = document.getElementById('schedule-debug-input');
    const errorEl   = document.getElementById('schedule-debug-error');
    const applyBtn  = document.getElementById('schedule-debug-apply');
    const cancelBtn = document.getElementById('schedule-debug-cancel');
    const resetBtn  = document.getElementById('schedule-debug-reset');
    const badgeText = document.getElementById('schedule-debug-badge-text');

    function openOverlay() {
      // Pre-fill with current mock or a conference-day hint
      input.value = mockDate
        ? formatForInput(new Date(mockDate))
        : data.conference.date + ' 09:00';
      errorEl.textContent = '';
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () { input.focus(); input.select(); });
    }

    function closeOverlay() {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      errorEl.textContent = '';
    }

    function applyMock() {
      const val = input.value.trim();
      // Accept "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM"
      const normalised = val.replace(' ', 'T');
      const parsed = new Date(normalised);
      if (isNaN(parsed.getTime())) {
        errorEl.textContent = 'Invalid format. Use: 2026-04-18 10:30';
        input.focus();
        return;
      }
      mockDate = normalised;
      badge.style.display = 'flex';
      badgeText.textContent = 'TEST MODE: ' + formatDisplay(parsed);
      closeOverlay();
      renderStatusBanner(data.conference.date);
      tick();
      scrollToNow();
    }

    function clearMock() {
      mockDate = null;
      badge.style.display = 'none';
      renderStatusBanner(data.conference.date);
      tick();
    }

    /** Format a Date as "YYYY-MM-DD HH:MM" for the input field. */
    function formatForInput(d) {
      const pad = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    /** Format a Date for the badge display. */
    function formatDisplay(d) {
      const pad = function (n) { return String(n).padStart(2, '0'); };
      let h = d.getHours();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
        ' ' + h + ':' + pad(d.getMinutes()) + ' ' + ampm;
    }

    applyBtn.addEventListener('click', applyMock);
    cancelBtn.addEventListener('click', closeOverlay);
    resetBtn.addEventListener('click', clearMock);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyMock(); }
      if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); }
    });

    // Close on backdrop click (outside the box)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });

    // 5 taps/clicks on the "Schedule" heading toggles the overlay
    var _titleClickCount = 0;
    var _titleClickTimer = null;
    var titleEl = document.getElementById('schedule-page-title');
    if (titleEl) {
      titleEl.addEventListener('click', function () {
        _titleClickCount++;
        clearTimeout(_titleClickTimer);
        if (_titleClickCount >= 5) {
          _titleClickCount = 0;
          if (overlay.style.display === 'flex') {
            closeOverlay();
          } else {
            openOverlay();
          }
        } else {
          _titleClickTimer = setTimeout(function () { _titleClickCount = 0; }, 3000);
        }
      });
    }
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  async function init() {
    setupModal();

    let data;
    try {
      const resp = await fetch(SCHEDULE_FILE);
      if (!resp.ok) throw new Error('Could not load schedule (' + resp.status + ')');
      data = await resp.json();
    } catch (err) {
      const container = document.querySelector('.schedule-grid-container');
      if (container) {
        container.innerHTML =
          '<p style="color:var(--terminal-dim-green);padding:20px;">' +
          'Schedule data unavailable. Please check back soon.</p>';
      }
      return;
    }

    // Parse conference date
    if (data.conference && data.conference.date) {
      conferenceDate = new Date(data.conference.date + 'T00:00:00');
    }

    // Populate date/time subtitle from JSON
    const datetimeEl = document.getElementById('schedule-page-datetime');
    if (datetimeEl && data.conference) {
      const d = data.conference.displayDate || '';
      const t = data.conference.displayTime || '';
      datetimeEl.innerHTML = esc(d) + (d && t ? ' &nbsp;|&nbsp; ' : '') + esc(t);
    }

    renderStatusBanner(data.conference.date);

    // Build desktop grid
    const slots = buildGrid(data);

    // Build mobile list
    buildMobileList(data);

    // Named tick — called by setInterval AND visibilitychange
    function tick() {
      renderStatusBanner(data.conference.date);
      updateNowBar();

      if (isConferenceDay()) {
        const min = currentMinutes();

        // Desktop slots
        if (slots) {
          slots.forEach(function (slot) {
            const card = document.getElementById('slot-' + slot.id);
            if (!card) return;
            if (toMinutes(slot.end) <= min) {
              card.classList.add('schedule-slot--past');
            } else {
              card.classList.remove('schedule-slot--past');
            }
          });
        }

        // Mobile slots — mark past
        data.slots.forEach(function (slot) {
          const card = document.getElementById('mobile-slot-' + slot.id);
          if (!card) return;
          if (toMinutes(slot.end) <= min) {
            card.classList.add('schedule-slot--past');
          } else {
            card.classList.remove('schedule-slot--past');
          }
        });
      }
      // Always update mobile groups (handles show/hide on non-conference days too)
      updateMobileGroups();
    }

    // Initial render
    tick();
    scrollToNow();

    // Refresh every minute via interval
    setInterval(tick, 60000);

    // Also refresh immediately when the user returns to the tab
    // (mobile browsers throttle/kill timers in background tabs)
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') tick();
    });

    // Debug / test mode overlay (tap "Schedule" 5×)
    setupDebugOverlay(data, tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
