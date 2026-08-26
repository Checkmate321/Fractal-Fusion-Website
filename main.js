/* ==========================================================================
   FRACTAL FUSION, main.js
   The only script. Header and footer injection, plus the engineering log.
   ========================================================================== */


/* --------------------------------------------------------------------------
   PARTIALS
   -------------------------------------------------------------------------- */

/* Pull a partial into an element by id. */
function include(id, file) {
  var host = document.getElementById(id);
  if (!host) return Promise.resolve();

  return fetch(file)
    .then(function (res) {
      if (!res.ok) throw new Error(file + ' returned ' + res.status);
      return res.text();
    })
    .then(function (html) { host.innerHTML = html; })
    .catch(function (err) {
      console.error('[include]', err);
      // Running from file://? fetch is blocked there. Use: python3 -m http.server
    });
}

/* Mark the current page in the nav.
   Must run AFTER the header lands, because the links do not exist before that. */
function markActiveNav() {
  var page = document.body.dataset.page;
  if (!page) return;
  var link = document.querySelector('.site-nav a[data-nav="' + page + '"]');
  if (link) {
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');
  }
}

include('header', 'header.html').then(markActiveNav);
include('footer', 'footer.html');


/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */

var LOG_URL = 'data/log.json';
var TOPICS  = ['CAD', 'Mechanical', 'Misc', 'Outreach', 'Software', 'Strategy'];
var MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* Entry text is pasted in by hand, so never trust it as markup. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Split the string rather than using new Date(), which reads a bare
   YYYY-MM-DD as UTC midnight and lands on the previous day in Florida. */
function fmtDate(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return esc(iso);
  return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
}

function byDateDesc(a, b) {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

/* Newest first, so entries can always be appended to the end of the file. */
function loadLog() {
  return fetch(LOG_URL)
    .then(function (res) {
      if (!res.ok) throw new Error(LOG_URL + ' returned ' + res.status);
      return res.json();
    })
    .then(function (list) { return list.slice().sort(byDateDesc); });
}

function logError(host) {
  if (!host) return;
  host.innerHTML =
    '<div class="todo">The log could not be loaded. If you have just edited ' +
    'data/log.json, check it for a missing or extra comma. The browser console ' +
    'has the exact error.</div>';
}

function sampleFlag(entry) {
  return entry.placeholder
    ? '<span class="sample">Sample entry, replace before launch</span>'
    : '';
}


/* --------------------------------------------------------------------------
   LOG INDEX
   -------------------------------------------------------------------------- */

function cardHTML(entry) {
  var thumb = (entry.images && entry.images.length)
    ? '<img class="log-thumb" src="' + esc(entry.images[0].src) + '" alt="" loading="lazy">'
    : '';

  return '' +
    '<a class="card card--dark log-card" href="entry.html?id=' + encodeURIComponent(entry.id) + '">' +
      thumb +
      '<span class="label log-meta">' + esc(entry.topic) + ' &middot; ' + fmtDate(entry.date) + '</span>' +
      '<h3>' + esc(entry.title) + '</h3>' +
      '<p class="log-summary">' + esc(entry.summary) + '</p>' +
      sampleFlag(entry) +
    '</a>';
}

function renderLogIndex(entries) {
  var grid    = document.getElementById('log-grid');
  var filters = document.getElementById('log-filters');
  if (!grid) return;

  var params = new URLSearchParams(location.search);
  var active = params.get('topic');
  if (TOPICS.indexOf(active) === -1) active = 'All';

  /* Only offer a topic that actually has entries behind it. */
  var present = TOPICS.filter(function (t) {
    return entries.some(function (e) { return e.topic === t; });
  });

  function paint() {
    var shown = (active === 'All')
      ? entries
      : entries.filter(function (e) { return e.topic === active; });

    grid.innerHTML = shown.length
      ? shown.map(cardHTML).join('')
      : '<div class="todo">No entries filed under ' + esc(active) + ' yet.</div>';

    if (filters) {
      filters.querySelectorAll('button').forEach(function (b) {
        var on = b.dataset.topic === active;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    var count = document.getElementById('log-count');
    if (count) {
      count.textContent = shown.length + (shown.length === 1 ? ' entry' : ' entries');
    }
  }

  if (filters) {
    filters.innerHTML = ['All'].concat(present).map(function (t) {
      return '<button type="button" data-topic="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');

    filters.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      active = btn.dataset.topic;

      /* Keep the filter in the URL so a view can be linked to. */
      var url = new URL(location.href);
      if (active === 'All') url.searchParams.delete('topic');
      else url.searchParams.set('topic', active);
      history.replaceState(null, '', url);

      paint();
    });
  }

  paint();
}


/* --------------------------------------------------------------------------
   SINGLE ENTRY
   -------------------------------------------------------------------------- */

function renderEntry(entries) {
  var host = document.getElementById('entry');
  if (!host) return;

  var id = new URLSearchParams(location.search).get('id');
  var i  = entries.findIndex(function (e) { return e.id === id; });

  if (i === -1) {
    host.innerHTML = '' +
      '<section class="page-head"><div class="wrap">' +
        '<span class="label">Mission log</span>' +
        '<h1>Entry not found</h1>' +
        '<div class="rule"></div>' +
        '<p class="lede">That entry does not exist, or the link is mistyped.</p>' +
      '</div></section>' +
      '<section class="band band--light"><div class="wrap">' +
        '<a class="btn btn--solid" href="log.html">Back to the log</a>' +
      '</div></section>';
    return;
  }

  var e = entries[i];
  var newer = entries[i - 1];   /* sorted newest first */
  var older = entries[i + 1];

  document.title = e.title + ' | Fractal Fusion, FTC 27188';

  var body = (e.body || []).map(function (p) {
    return '<p>' + esc(p) + '</p>';
  }).join('');

  var figures = (e.images || []).map(function (img) {
    return '<figure class="entry-figure">' +
             '<img src="' + esc(img.src) + '" alt="' + esc(img.caption || '') + '" loading="lazy">' +
             (img.caption ? '<figcaption class="label">' + esc(img.caption) + '</figcaption>' : '') +
           '</figure>';
  }).join('');

  var nav = '';
  if (newer || older) {
    nav = '<nav class="entry-nav">' +
      (older ? '<a class="entry-step" href="entry.html?id=' + encodeURIComponent(older.id) + '">' +
                 '<span class="label">Older</span><span>' + esc(older.title) + '</span></a>'
             : '<span></span>') +
      (newer ? '<a class="entry-step entry-step--next" href="entry.html?id=' + encodeURIComponent(newer.id) + '">' +
                 '<span class="label">Newer</span><span>' + esc(newer.title) + '</span></a>'
             : '<span></span>') +
      '</nav>';
  }

  host.innerHTML = '' +
    '<section class="page-head"><div class="wrap">' +
      '<span class="label">' + esc(e.topic) + ' &middot; ' + fmtDate(e.date) + '</span>' +
      '<h1>' + esc(e.title) + '</h1>' +
      '<div class="rule"></div>' +
      '<p class="lede">' + esc(e.summary) + '</p>' +
      sampleFlag(e) +
    '</div></section>' +
    '<section class="band band--light"><div class="wrap">' +
      '<div class="entry-body measure">' + body + '</div>' +
      figures +
      nav +
    '</div></section>';
}


/* --------------------------------------------------------------------------
   BOOT
   -------------------------------------------------------------------------- */

if (document.getElementById('log-grid') || document.getElementById('entry')) {
  loadLog()
    .then(function (entries) {
      renderLogIndex(entries);
      renderEntry(entries);
    })
    .catch(function (err) {
      console.error('[log]', err);
      logError(document.getElementById('log-grid') || document.getElementById('entry'));
    });
}
