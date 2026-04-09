/**
 * BSides South Jersey - Live View
 * Fetches schedule/schedule.json and displays:
 *   - What's happening NOW on each track
 *   - What's coming NEXT with a live countdown (MM:SS)
 *   - A 10-minute visual alert banner before each session (auto-dismisses at session start)
 */
(function () {
  'use strict';

  const SCHEDULE_FILE = 'schedule/schedule.json';

  // --- Utilities ---

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toMinutes(timeStr) {
    const parts = String(timeStr).split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function toDisplay(timeStr) {
    const parts = String(timeStr).split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
  }

  function minutesToDisplay(min) {
    const h = Math.floor(min / 60);
    const m = String(min % 60).padStart(2, '0');
    return toDisplay(String(h).padStart(2, '0') + ':' + m);
  }

  // --- State ---

  let scheduleData   = null;
  let conferenceDate = null;

  // Tracks which next-session time-buckets we have already alerted for
  // so the 10-minute warning fires exactly once per session.
  const alertedKeys = new Set();

  // --- Clock helpers ---

  function effectiveNow() {
    return new Date();
  }

  function isConferenceDay() {
    if (!conferenceDate) return false;
    const now = effectiveNow();
    return (
      now.getFullYear() === conferenceDate.getFullYear() &&
      now.getMonth()    === conferenceDate.getMonth()    &&
      now.getDate()     === conferenceDate.getDate()
    );
  }

  function currentMilliseconds() {
    const now = effectiveNow();
    return now.getHours() * 3600000 +
           now.getMinutes() * 60000 +
           now.getSeconds() * 1000 +
           now.getMilliseconds();
  }

  function currentMinutes() {
    const now = effectiveNow();
    return now.getHours() * 60 + now.getMinutes();
  }

  // --- Schedule queries ---

  function getCurrentSlots() {
    if (!scheduleData) return [];
    const min = currentMinutes();
    return scheduleData.slots.filter(function (s) {
      return toMinutes(s.start) <= min && min < toMinutes(s.end);
    });
  }

  // Returns the minute-offset of the next session start time (> now).
  function getNextStartMin() {
    if (!scheduleData) return null;
    const min = currentMinutes();
    let nextMin = Infinity;
    scheduleData.slots.forEach(function (s) {
      const sm = toMinutes(s.start);
      if (sm > min && sm < nextMin) nextMin = sm;
    });
    return nextMin === Infinity ? null : nextMin;
  }

  function getNextSlots() {
    const nextMin = getNextStartMin();
    if (nextMin === null) return [];
    return scheduleData.slots.filter(function (s) {
      return toMinutes(s.start) === nextMin;
    });
  }

  // Seconds until next session starts, using millisecond precision.
  function getCountdownSeconds() {
    const nextMin = getNextStartMin();
    if (nextMin === null) return null;
    const nextMs  = nextMin * 60000;
    const nowMs   = currentMilliseconds();
    const diff    = nextMs - nowMs;
    return diff <= 0 ? 0 : Math.ceil(diff / 1000);
  }

  // --- 10-minute alert ---

  function checkTenMinuteAlert() {
    const nextSlots = getNextSlots();
    if (!nextSlots.length) return;

    const countdownSec = getCountdownSeconds();
    if (countdownSec === null) return;

    const nextMin  = getNextStartMin();
    const alertKey = 'alert_' + nextMin;

    // Trigger when ≤ 600 s (10 min) remain and we haven't alerted yet.
    if (countdownSec <= 600 && !alertedKeys.has(alertKey)) {
      alertedKeys.add(alertKey);
      fireAlert(nextSlots, countdownSec);
    }
  }

  function fireAlert(nextSlots, countdownSec) {
    const banner = document.getElementById('live-alert-banner');
    const text   = document.getElementById('live-alert-text');
    if (!banner || !text) return;

    const minsLeft = Math.ceil(countdownSec / 60);

    const names = nextSlots
      .filter(function (s) { return s.speaker || s.speakers; })
      .map(function (s) {
        return s.speaker ||
          (Array.isArray(s.speakers) ? s.speakers.join(', ') : '');
      })
      .filter(Boolean);

    const speakerText = names.length ? names.join(' \u2022 ') : 'Next Session';
    const timeText    = toDisplay(nextSlots[0].start);

    text.innerHTML =
      '<span class="live-alert-icon" aria-hidden="true">\u26a0</span> ' +
      '<strong>' + minsLeft + '-MINUTE WARNING</strong> \u2014 ' +
      esc(speakerText) + ' begins at ' + esc(timeText);

    banner.style.display = '';
    banner.classList.add('live-alert-pulse');

    // Auto-dismiss when the session starts (countdownSec seconds from now).
    var dismissAfterMs = countdownSec * 1000;
    setTimeout(function () {
      banner.style.display = 'none';
      banner.classList.remove('live-alert-pulse');
    }, dismissAfterMs);
  }

  // --- Track label lookup ---

  function getTrackLabel(trackId) {
    if (!scheduleData) return trackId;
    const t = scheduleData.tracks.find(function (tr) { return tr.id === trackId; });
    return t ? t.label : trackId;
  }

  // --- Slot card HTML ---

  function renderCard(slot) {
    const isKeynote = slot.isKeynote || slot.type === 'keynote';
    const isBreak   = ['break', 'registration', 'lunch', 'ceremony'].includes(slot.type);
    const isPanel   = slot.type === 'panel';

    let cls = 'live-track-card';
    if (isKeynote) cls += ' live-track-card--keynote';
    else if (isBreak) cls += ' live-track-card--break';
    else if (isPanel) cls += ' live-track-card--panel';

    const trackLabel = slot.track === 'all'
      ? 'All Tracks'
      : getTrackLabel(slot.track);

    const trackHtml   = '<span class="live-card-track">' + esc(trackLabel) + '</span>';
    const badgeHtml   = isKeynote
      ? '<span class="live-card-badge">KEYNOTE</span>'
      : (isPanel ? '<span class="live-card-badge live-card-badge--panel">PANEL</span>' : '');

    let speakerHtml = '';
    if (slot.speaker) {
      speakerHtml = '<div class="live-card-speaker">' + esc(slot.speaker) + '</div>';
    } else if (Array.isArray(slot.speakers) && slot.speakers.length) {
      speakerHtml = '<div class="live-card-speaker">' +
        slot.speakers.map(esc).join(' &middot; ') + '</div>';
    }

    const timeHtml = '<div class="live-card-time">' +
      esc(toDisplay(slot.start)) + ' \u2013 ' + esc(toDisplay(slot.end)) + '</div>';

    return '<div class="' + cls + '">' +
      trackHtml +
      badgeHtml +
      '<div class="live-card-title">' + esc(slot.title) + '</div>' +
      speakerHtml +
      timeHtml +
      '</div>';
  }

  // --- Main update loop (runs every second) ---

  function update() {
    if (!scheduleData) return;

    const isConfDay = isConferenceDay();

    // ── Elements ─────────────────────────────────────────────────────────────
    const statusEl         = document.getElementById('live-status');
    const countdownBlock   = document.getElementById('live-countdown-block');
    const countdownValue   = document.getElementById('live-countdown-value');
    const countdownLabel   = document.getElementById('live-countdown-label');
    const nowSection       = document.getElementById('live-now-section');
    const nowCards         = document.getElementById('live-now-cards');
    const nextSection      = document.getElementById('live-next-section');
    const nextHeader       = document.getElementById('live-next-header');
    const nextCards        = document.getElementById('live-next-cards');
    const preconfSection   = document.getElementById('live-preconf-section');

    // ── Non-conference day ────────────────────────────────────────────────────
    if (!isConfDay) {
      if (preconfSection) preconfSection.style.display = '';
      if (countdownBlock) countdownBlock.style.display = 'none';
      if (nowSection)     nowSection.style.display     = 'none';
      if (nextSection)    nextSection.style.display    = 'none';

      if (statusEl && conferenceDate) {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const confMidnight  = new Date(conferenceDate); confMidnight.setHours(0, 0, 0, 0);
        const diffDays = Math.round((confMidnight - todayMidnight) / 86400000);

        if (diffDays > 0) {
          statusEl.textContent = '> Conference begins in ' + diffDays + ' day' +
            (diffDays === 1 ? '' : 's') + '.';
          statusEl.className = 'live-status live-status--upcoming';
        } else if (diffDays < 0) {
          statusEl.textContent = '> Conference has concluded. See you next year!';
          statusEl.className = 'live-status live-status--past';
        }
      }
      return;
    }

    // ── Conference day ────────────────────────────────────────────────────────
    if (preconfSection) preconfSection.style.display = 'none';

    const currentSlots = getCurrentSlots();
    const nextSlots    = getNextSlots();
    const nextMin      = getNextStartMin();
    const countdownSec = getCountdownSeconds();
    const isWarning    = countdownSec !== null && countdownSec <= 600;
    const conferenceEnded = !currentSlots.length && !nextSlots.length;

    // Status banner
    if (statusEl) {
      if (conferenceEnded) {
        statusEl.textContent = '> Conference has concluded for today. Thanks for joining!';
        statusEl.className = 'live-status live-status--past';
      } else {
        statusEl.textContent = '> Conference is LIVE \u2014 ' +
          scheduleData.conference.displayDate;
        statusEl.className = 'live-status live-status--today';
      }
    }

    // Countdown
    if (countdownBlock) {
      if (countdownSec !== null && !conferenceEnded) {
        countdownBlock.style.display = '';

        const mm = String(Math.floor(countdownSec / 60)).padStart(2, '0');
        const ss = String(countdownSec % 60).padStart(2, '0');
        if (countdownValue) countdownValue.textContent = mm + ':' + ss;
        if (countdownLabel && nextMin !== null) {
          countdownLabel.textContent = 'NEXT SESSION AT ' + minutesToDisplay(nextMin);
        }

        countdownBlock.classList.toggle('live-countdown-block--warning', isWarning);
      } else {
        countdownBlock.style.display = 'none';
      }
    }

    // Check 10-minute alert
    checkTenMinuteAlert();

    // NOW section
    if (nowSection && nowCards) {
      if (currentSlots.length) {
        nowSection.style.display = '';
        nowCards.innerHTML = currentSlots.map(renderCard).join('');
      } else {
        nowSection.style.display = 'none';
      }
    }

    // NEXT section
    if (nextSection && nextCards) {
      if (nextSlots.length) {
        nextSection.style.display = '';
        if (nextHeader && nextMin !== null) {
          nextHeader.innerHTML =
            '<span class="prompt-symbol">&gt;</span> COMING UP NEXT \u2014 ' +
            esc(minutesToDisplay(nextMin));
        }
        nextCards.innerHTML = nextSlots.map(renderCard).join('');
      } else {
        nextSection.style.display = 'none';
      }
    }
  }

  // --- Init ---

  function init() {
    const alertClose = document.getElementById('live-alert-close');

    if (alertClose) {
      alertClose.addEventListener('click', function () {
        const banner = document.getElementById('live-alert-banner');
        if (banner) {
          banner.style.display = 'none';
          banner.classList.remove('live-alert-pulse');
        }
      });
    }

    // Load schedule
    fetch(SCHEDULE_FILE)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        scheduleData = data;

        // Parse conference date as local midnight
        var parts = String(data.conference.date).split('-');
        conferenceDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );

        // Populate page subtitle from JSON
        var datetimeEl = document.getElementById('live-page-datetime');
        if (datetimeEl && data.conference) {
          var d = data.conference.displayDate || '';
          datetimeEl.innerHTML = esc(d) + (d ? ' &nbsp;|&nbsp; Real-Time Session Tracker' : 'Real-Time Session Tracker');
        }

        // Populate pre-conference placeholder with date from JSON
        var preconfMsg = document.getElementById('live-preconf-message');
        if (preconfMsg && data.conference) {
          var pd = data.conference.displayDate || '';
          preconfMsg.innerHTML =
            'The live view activates on conference day' +
            (pd ? ', ' + esc(pd) : '') +
            '.<br />Check the <a href="schedule.html" class="live-preconf-link">full schedule</a> for session details.';
        }

        // Initial render, then tick every second
        update();
        setInterval(update, 1000);
      })
      .catch(function () {
        var statusEl = document.getElementById('live-status');
        if (statusEl) {
          statusEl.textContent = '> Error loading schedule data.';
          statusEl.className = 'live-status live-status--error';
        }
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
