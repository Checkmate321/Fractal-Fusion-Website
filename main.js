/* ==========================================================================
   FRACTAL FUSION, FTC 27188
   main.js, the only script on the site.

   No framework, no build step, no dependencies. Plain functions in one file,
   read top to bottom.

   ---------------------------------------------------------------------------
   HOW A PAGE COMES TOGETHER
   ---------------------------------------------------------------------------
   Every page is static HTML with two empty divs, #header and #footer.
   include() fetches header.html and footer.html and drops them in.

   Because that is a fetch, two things follow:

     1. The site must be served over http, not opened from the file system.
        Run: python3 -m http.server 8000
     2. Anything that touches the nav has to wait for the promise. The links
        do not exist until the fetch resolves.

   ---------------------------------------------------------------------------
   WHERE THE CONTENT LIVES
   ---------------------------------------------------------------------------
   Growing content is JSON, never markup, so adding to the site never means
   editing HTML:

       data/log.json         build log entries, rendered by log.html,
                             entry.html and the latest three on the home page
       data/resources.json   downloads and guides on resources.html
       data/sponsors.json    the detailed list on sponsors.html

   Log entries are sorted newest first at render time, so new ones are always
   appended to the end of the file and order never has to be thought about.

   All values from those files pass through esc() before reaching the page.
   They are typed by hand, so they are treated as text and never as markup.

   ---------------------------------------------------------------------------
   SECTIONS, IN ORDER
   ---------------------------------------------------------------------------
   PARTIALS            header and footer injection, active nav marking
   SPONSOR STRIP       the scrolling logo marquee on the home page
   KICKOFF COUNTDOWN   the countdown to the season reveal
   EXTERNAL LINKS      opens off site links in a new tab, adds rel safety
   HELPERS             escaping, date formatting, loading the log
   LOG INDEX           the card grid and topic filters
   SINGLE ENTRY        one entry, rendered from the ?id= in the address
   HOME                the latest three entries
   SPONSORS            the detailed sponsor list
   RESOURCES           downloads, with pending items shown but not clickable
   FORMS               submissions to Web3Forms, without leaving the page
   ADD LOG             composes a submission into ready to paste JSON
   HERO ROBOT          the 3D model on the home page
   CLICK SOUND         interface click feedback
   BOOT                what actually runs, and on which pages

   ---------------------------------------------------------------------------
   A NOTE ON FAILURE
   ---------------------------------------------------------------------------
   When a JSON file will not parse, the page says so in plain language and
   names the likely cause, a stray comma. The person fixing it is a teammate
   at eleven at night, not a developer, so the console is a fallback rather
   than the message.
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
      /* Most often this is the site being opened from the file system rather
         than served. See the note at the top of this file. */
      console.error('[include]', err);
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

/* ==========================================================================
   SPONSOR STRIP
   Three logos do not cover a wide screen, so the one set in the markup is
   cloned until half the run overflows the viewport, and the run always holds
   an even number of sets so its two halves are identical. The CSS then slides
   it by half its width and the loop has no seam.
   ========================================================================== */

var MARQUEE_SPEED = 55;   /* px per second, held constant at any width */

function fillMarquee() {
  var run = document.querySelector('.marquee-run');
  if (!run) return;

  var master = run.querySelector('.marquee-set');
  if (!master) return;

  /* Measure a still, single set: clones and the slide both distort the width. */
  run.classList.remove('is-running');
  while (run.children.length > 1) run.removeChild(run.lastElementChild);

  /* Includes the set's trailing gap, which is padding, so the halves are exact.
     .spon carries a fixed size in CSS, so this does not wait on the logos. */
  var setWidth = master.getBoundingClientRect().width;
  if (!setWidth) return;

  var perHalf = Math.max(1, Math.ceil(window.innerWidth / setWidth));

  for (var i = 1; i < perHalf * 2; i++) {
    var copy = master.cloneNode(true);
    /* One set is enough to read out. The rest are the same logos again. */
    copy.setAttribute('aria-hidden', 'true');
    /* aria-hidden alone would leave the copies in the tab order: reachable by
       keyboard but invisible to a screen reader, the worst of both. */
    var links = copy.querySelectorAll('a');
    for (var j = 0; j < links.length; j++) links[j].tabIndex = -1;
    run.appendChild(copy);
  }

  run.style.setProperty('--marquee-time', (setWidth * perHalf / MARQUEE_SPEED) + 's');
  run.classList.add('is-running');
}

fillMarquee();

/* A window dragged wider needs more clones, or the tail runs out mid screen. */
var marqueeWait;
window.addEventListener('resize', function () {
  clearTimeout(marqueeWait);
  marqueeWait = setTimeout(fillMarquee, 150);
});


/* ==========================================================================
   KICKOFF COUNTDOWN
   The date lives in the markup, in the time element's datetime, so this only
   formats it. Units drop off the front as the date closes in, so the readout
   is never padded with a leading 0d. Two digits on everything but the days,
   which keeps the string one width and stops it jittering every second.
   ========================================================================== */

function startKickoff() {
  var el = document.getElementById('kickoff');
  if (!el) return;

  var when = Date.parse(el.getAttribute('datetime'));
  if (isNaN(when)) return;               /* leave the written date in place */

  var label = el.nextElementSibling;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function tick() {
    var left = when - Date.now();

    if (left <= 0) {
      el.textContent = 'Now';
      if (label) label.textContent = 'FTC season under way';
      return true;                       /* nothing left to count */
    }

    var secs  = Math.floor(left / 1000);
    var days  = Math.floor(secs / 86400);
    var hours = Math.floor(secs % 86400 / 3600);
    var mins  = Math.floor(secs % 3600 / 60);

    /* d:h:m:s, two digits each, leading groups dropping off as they empty. */
    var clock = pad(mins) + ':' + pad(secs % 60);
    if (days || hours) clock = pad(hours) + ':' + clock;
    if (days)          clock = pad(days)  + ':' + clock;

    el.textContent = clock;
    return false;
  }

  if (tick()) return;
  var timer = setInterval(function () { if (tick()) clearInterval(timer); }, 1000);
}

startKickoff();


/* ==========================================================================
   EXTERNAL LINKS
   Anything pointing off this host opens in a new tab. Swept here rather than
   set by hand so the pages still being written, and the donate URL when it
   lands, cannot forget. An explicit target in the markup always wins.
   ========================================================================== */

function markExternalLinks(root) {
  var links = (root || document).querySelectorAll('a[href]');

  for (var i = 0; i < links.length; i++) {
    var a = links[i];
    if (a.target) continue;                    /* the author already chose */

    var url = new URL(a.getAttribute('href'), location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;   /* mailto:, tel: */
    if (url.host === location.host) continue;  /* our own pages */

    a.target = '_blank';
    if (!a.rel) a.rel = 'noopener';
  }
}

markExternalLinks();

include('header', '/header.html').then(function () {
  markActiveNav();
  markExternalLinks(document.getElementById('header'));
});
include('footer', '/footer.html').then(function () {
  markExternalLinks(document.getElementById('footer'));
});


/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */

var LOG_URL = 'data/log.json';
var TOPICS  = ['CAD', 'Mechanical', 'Misc', 'Outreach', 'Software', 'Strategy'];
var MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* Entry text is typed by hand into a form, so it is rendered as text and
   never interpreted as markup. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* The date string is split by hand. new Date('2026-02-14') is read as UTC
   midnight, which renders as the 13th anywhere west of Greenwich. */
function fmtDate(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return esc(iso);
  return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0];
}

function byDateDesc(a, b) {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

/* Sorted newest first at render time, so entries are always appended to the
   end of the file and their order in it never matters. */
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

  /* Only topics with entries behind them get a button, so no filter can lead
     to an empty page. */
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

      /* The filter is mirrored into the address, so a filtered view can be
         linked to from anywhere. */
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
        '<a class="btn btn--accent" href="log.html">Back to the log</a>' +
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
   HOME, latest entries
   -------------------------------------------------------------------------- */

function renderHomeLog(entries) {
  var host = document.getElementById('home-log');
  if (!host) return;
  host.innerHTML = entries.slice(0, 3).map(cardHTML).join('');
}


/* --------------------------------------------------------------------------
   SPONSORS
   -------------------------------------------------------------------------- */

var SPONSOR_URL = 'data/sponsors.json';

function tileHTML(s) {
  var img = '<img class="sponsor-logo" src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy">';
  return s.url
    ? '<a class="sponsor-tile" href="' + esc(s.url) + '" rel="noopener" title="' + esc(s.name) + '">' + img + '</a>'
    : '<div class="sponsor-tile">' + img + '</div>';
}

function rowHTML(s) {
  return '<div class="sponsor-row">' +
      tileHTML(s) +
      '<div>' +
        '<h3>' + esc(s.name) + '</h3>' +
        '<p>' + esc(s.note || '') + '</p>' +
        (s.url ? '<a class="lnk" href="' + esc(s.url) + '" rel="noopener">Visit site</a>' : '') +
      '</div>' +
    '</div>';
}

function renderSponsors() {
  var hosts = document.querySelectorAll('[data-sponsors]');
  if (!hosts.length) return;

  fetch(SPONSOR_URL)
    .then(function (res) {
      if (!res.ok) throw new Error(SPONSOR_URL + ' returned ' + res.status);
      return res.json();
    })
    .then(function (list) {
      hosts.forEach(function (host) {
        host.innerHTML = (host.dataset.sponsors === 'detailed')
          ? list.map(rowHTML).join('')
          : list.map(tileHTML).join('');
      });
    })
    .catch(function (err) {
      console.error('[sponsors]', err);
      hosts.forEach(function (host) {
        host.innerHTML = '<div class="todo">The sponsor list could not be loaded. ' +
          'Check data/sponsors.json for a missing or extra comma.</div>';
      });
    });
}


/* --------------------------------------------------------------------------
   RESOURCES
   -------------------------------------------------------------------------- */

var RESOURCE_URL = 'data/resources.json';

function resourceHTML(r) {
  var live = r.href && !r.placeholder;

  var inner =
    '<span class="res-type">' + esc(r.type) + '</span>' +
    '<h3>' + esc(r.title) + '</h3>' +
    '<p class="res-summary">' + esc(r.summary) + '</p>' +
    '<span class="res-meta label">' + esc(r.meta || '') + '</span>';

  if (!live) {
    return '<div class="card card--line res-card is-pending">' + inner + '</div>';
  }

  /* download asks the browser to save the file rather than try to render it,
     which matters for the CAD models. */
  return '<a class="card card--line res-card" href="' + esc(r.href) + '"' +
         (r.download ? ' download' : ' rel="noopener"') + '>' + inner + '</a>';
}

function renderResources() {
  var host = document.getElementById('res-grid');
  if (!host) return;

  fetch(RESOURCE_URL)
    .then(function (res) {
      if (!res.ok) throw new Error(RESOURCE_URL + ' returned ' + res.status);
      return res.json();
    })
    .then(function (list) {
      host.innerHTML = list.map(resourceHTML).join('');
    })
    .catch(function (err) {
      console.error('[resources]', err);
      host.innerHTML = '<div class="todo">The resource list could not be loaded. ' +
        'Check data/resources.json for a missing or extra comma.</div>';
    });
}

renderResources();


/* --------------------------------------------------------------------------
   FORMS, posted to Web3Forms so the visitor never leaves the site
   -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
   ADD LOG, composes the entry so transcribing is copy and paste
   -------------------------------------------------------------------------- */

/* Builds the same id format used throughout data/log.json: a few words of
   the title, lowercase, hyphen separated. */
function slugify(title) {
  var parts = String(title).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  return parts.length ? parts.join('-') : 'entry';
}

/* Turns blank line separated text into one array item per paragraph. JSON
   strings cannot hold a line break, which is why body is a list. */
function toParagraphs(text) {
  return String(text).split(/\n\s*\n/)
    .map(function (p) { return p.replace(/\s+/g, ' ').trim(); })
    .filter(Boolean);
}

function buildLogEntry(form) {
  var get = function (n) {
    var el = form.querySelector('[name="' + n + '"]');
    return el ? el.value.trim() : '';
  };

  var date  = get('date');
  var title = get('title');
  var body  = toParagraphs(get('body'));

  return {
    id: (date || 'undated') + '-' + slugify(title),
    date: date,
    topic: get('topic') || 'Misc',
    title: title,
    summary: get('summary'),
    body: body.length ? body : [''],
    images: []
  };
}

/* Puts the finished entry into the hidden fields Web3Forms transmits, and
   gives the email a subject worth reading in an inbox. */
function composeLogEntry(form) {
  var entry = buildLogEntry(form);
  var json  = JSON.stringify(entry, null, 2);

  var author = form.querySelector('[name="author"]');

  var lines = [
    'New build log entry from ' + ((author && author.value.trim()) || 'someone') + '.',
    '',
    'Paste this at the END of the list in data/log.json.',
    'Remember the comma after the entry above it.',
    '',
    json,
    ''
  ];

  /* The folder URL is held in the markup, where it works without JavaScript,
     and read back from there so there is only ever one copy of it. */
  var folder = document.getElementById('photo-folder');

  lines.push('If there are photos for this one they will be in the shared folder,');
  lines.push('named with the date.');
  if (folder) lines.push(folder.href);
  lines.push('');
  lines.push('Download them into files/log/' + entry.id + '/, rename 01, 02, then');
  lines.push('add one { "src": ..., "caption": "" } per photo to images.');
  lines.push('If there are none, images stays [].');

  var msg = form.querySelector('[name="message"]');
  if (msg) msg.value = lines.join('\n');

  var subj = form.querySelector('[name="subject"]');
  if (subj) subj.value = 'Build log: ' + (entry.title || 'untitled');

  return json;
}

/* Also puts the JSON on the page, so whoever filled the form in can hand it
   over immediately instead of waiting for the email. */
function showLogJson(form, json) {
  var out = form.querySelector('.json-out');
  if (!out) return;

  out.querySelector('code').textContent = json;
  out.hidden = false;

  var btn = out.querySelector('.json-copy');
  if (btn && !btn.dataset.wired) {
    btn.dataset.wired = '1';
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(json).then(function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      }).catch(function () {
        btn.textContent = 'Select it manually';
      });
    });
  }
}


/* Wording the browser's own messages do not manage: short, plain, and about
   the field rather than about the specification. */
function validationMessage(el) {
  var v = el.validity;

  if (v.valueMissing) {
    if (el.tagName === 'SELECT') return 'Please pick one';
    if (el.type === 'checkbox')  return 'Please tick this';
    return 'This one is needed';
  }
  if (v.typeMismatch && el.type === 'email') return 'That does not look like an email address';
  if (v.rangeUnderflow || v.rangeOverflow)   return 'That date is out of range';
  if (v.tooShort)        return 'A little longer, please';
  if (v.tooLong)         return 'That is a little too long';
  if (v.patternMismatch) return 'That is not the format we expect';

  return el.validationMessage || 'Please check this one';
}

function clearFieldError(field) {
  if (!field) return;
  field.classList.remove('is-invalid');

  var msg = field.querySelector('.field-error');
  if (msg) msg.remove();

  var control = field.querySelector('input, select, textarea');
  if (control) {
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
  }
}

function clearFormErrors(form) {
  form.querySelectorAll('.field').forEach(clearFieldError);
}

/* Marks every control that is not filled in properly, puts the reason under
   it, moves focus to the first one, and reports how many there were. */
function showFormErrors(form) {
  clearFormErrors(form);

  var bad = [];

  for (var i = 0; i < form.elements.length; i++) {
    var el = form.elements[i];

    /* Hidden fields and the honeypot are exempt: willValidate is false for
       anything the browser would not check itself. */
    if (!el.willValidate || el.checkValidity()) continue;

    bad.push(el);

    var field = el.closest('.field');
    if (!field) continue;

    field.classList.add('is-invalid');

    var id  = (el.id || el.name || 'field') + '-error';
    var msg = document.createElement('span');
    msg.className   = 'field-error';
    msg.id          = id;
    msg.textContent = validationMessage(el);
    field.appendChild(msg);

    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', id);
  }

  if (bad.length) bad[0].focus();
  return bad.length;
}


function initForms() {
  document.querySelectorAll('form[data-web3form]').forEach(function (form) {

    /* The markup leaves native validation switched on, so a browser running
       no JavaScript still refuses an incomplete form and posts to Web3Forms
       directly. Now that we are here we can word the refusal better than the
       browser's bubbles do, so we take it over. */
    form.noValidate = true;

    /* An error clears the moment its field is put right, rather than making
       somebody submit again to find out. */
    function recheck(ev) {
      var field = ev.target.closest ? ev.target.closest('.field.is-invalid') : null;
      if (field && ev.target.willValidate && ev.target.checkValidity()) clearFieldError(field);
    }
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var status = form.querySelector('.form-status');
      var btn    = form.querySelector('button[type="submit"]');

      var missing = showFormErrors(form);
      if (missing) {
        if (status) {
          status.textContent = (missing === 1)
            ? 'One field still needs something.'
            : missing + ' fields still need something.';
        }
        return;
      }
      clearFormErrors(form);

      /* Compose first, so the assembled JSON is part of what gets sent. */
      var composed = (form.dataset.compose === 'log') ? composeLogEntry(form) : null;

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      if (btn) btn.disabled = true;
      /* Clear the last outcome, or a failure after a success inherits the
         success styling and reads as a second thank you. */
      form.classList.remove('is-sent');
      if (status) status.textContent = 'Sending\u2026';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json(); })
        .then(function (out) {
          if (!out.success) throw new Error(out.message || 'Web3Forms rejected the submission');
          if (composed) {
            showLogJson(form, composed);
            if (status) status.textContent = 'Sent. It will appear on the site once someone moves it across.';
          } else {
            form.reset();
            if (status) status.textContent = 'Thank you. We will reply to that address within a couple of days.';
          }
          form.classList.add('is-sent');
        })
        .catch(function (err) {
          console.error('[form]', err);
          if (status) {
            status.textContent = 'That did not send. Please email fractal.fusion27188@gmail.com instead.';
          }
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
}

initForms();
renderSponsors();


/* ==========================================================================
   DIALOGS
   [data-dialog="id"] opens the <dialog> with that id, [data-dialog-close]
   closes the one it sits in. The element handles the rest itself: the
   backdrop, Escape, the focus trap, and returning focus to the button that
   opened it. One listener on the document, so markup added later works too.
   ========================================================================== */

function initDialogs() {
  document.addEventListener('click', function (ev) {
    var el = ev.target;
    if (!el || !el.closest) return;

    var closer = el.closest('[data-dialog-close]');
    if (closer) {
      var host = closer.closest('dialog');
      if (host) host.close();
      return;                        /* a link in here still follows its href */
    }

    var opener = el.closest('[data-dialog]');
    if (!opener) return;

    var dlg = document.getElementById(opener.getAttribute('data-dialog'));
    if (!dlg) return;

    ev.preventDefault();
    if (dlg.showModal) dlg.showModal();
    else dlg.setAttribute('open', '');      /* no modal support: still readable */
  });

  /* Click outside to dismiss. The backdrop is not its own element, so this
     goes by geometry rather than by target: a click on the dialog's own
     padding is inside the box and must not close it. detail is 0 for a click
     synthesised by the keyboard, which has no coordinates to test. */
  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (ev) {
      if (!ev.detail) return;
      var r = dlg.getBoundingClientRect();
      if (ev.clientX < r.left || ev.clientX > r.right ||
          ev.clientY < r.top  || ev.clientY > r.bottom) dlg.close();
    });
  });
}

initDialogs();


/* --------------------------------------------------------------------------
   HERO ROBOT, Sierah in 3D

   26Worlds-web.glb is the Worlds CAD run through glTF-Transform: the 9,010
   primitives the exporter emitted were merged per mesh into 35, which took the
   file from 11 MB to 3 MB and the draw calls down with it. The colours are a
   palette texture baked into the model, so nothing here sets a material.

   The viewer and its Draco decoder are vendored in files/vendor rather than
   pulled from a CDN, so the site still clones and runs with no network beyond
   the fonts.
   -------------------------------------------------------------------------- */

var ROBOT_URL   = 'files/CAD/26Worlds-web.glb';
var VIEWER_URL  = 'files/vendor/model-viewer.min.js';
var DRACO_URL   = 'files/vendor/draco/';

/* Three megabytes is a lot to spend on an ornament, so it is not spent on a
   visitor who has said they do not want it. Save Data and a 2g estimate are
   that, in the only two ways a browser offers; reduced motion is a request not
   to be shown a thing that spins. There is deliberately no width test: the
   robot shows on a phone too, stacked under the copy, which does mean a phone
   pays the full download. In every declined case the stage stays empty and
   :empty removes it from the layout. */
function wantsRobot() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  var net = navigator.connection;
  if (net) {
    if (net.saveData) return false;
    if (/2g/.test(net.effectiveType || '')) return false;
  }
  return true;
}

/* How far back the camera sits at rest, which is not a constant.

   The robot is framed against the band's height, and the band does not shrink
   nearly as fast as a phone screen does, so one fixed distance that suits a
   desktop leaves the robot eating most of a small screen. The camera therefore
   walks backwards as the window narrows: 100% of the framing distance at 1024px
   and up, 155% by the time the window is phone width, straight line between.
   The robot ends up occupying about the same share of the screen either way. */
function restingRadius(mv) {
  var w = window.innerWidth;
  var t = Math.min(1, Math.max(0, (1024 - w) / (1024 - 390)));
  var pct = 100 + t * 55;

  /* On a narrow window the canvas is grown taller than the band it sits in, so
     that a lifted robot still covers the band's full height. A model-viewer
     frames its model against the height it is given, so that extra height would
     come straight back out as a bigger robot. Dividing the distance by the same
     ratio cancels it, and reading both heights off the elements keeps the CSS
     the only place the lift is written down. */
  if (mv && mv.parentNode) {
    var band = mv.parentNode.clientHeight;
    if (band > 0) pct *= mv.clientHeight / band;
  }
  return Math.round(pct) + '%';
}

/* 215deg, not 35deg. The intake and the Limelight are the front of this robot
   and they sit at 180deg; 35deg was looking at the flat panel on the back of
   the chassis. 215 keeps the same three quarter angle the opening view always
   had, just taken round the front: 180 for the front, plus the 35 that turns it
   off square. */
function restingOrbit(mv) {
  return '215deg 72deg ' + restingRadius(mv);
}

function buildRobot(stage) {
  var mv = document.createElement('model-viewer');

  mv.setAttribute('src', ROBOT_URL);
  mv.setAttribute('alt', 'Sierah, the 2026 competition robot, rotating slowly');

  /* Turntable. The delay is the pause before rotation begins, and it is used
     twice by model-viewer: once after the model loads, and again after every
     interaction. Those two want different numbers. On arrival the robot should
     already be turning, because that is the whole reason it is here; after a
     drag it should hold still long enough for someone to look at what they just
     turned towards. One attribute cannot be both, so it starts at zero and is
     raised to three seconds the first time anybody touches it. */
  mv.setAttribute('auto-rotate', '');
  mv.setAttribute('auto-rotate-delay', '0');
  mv.setAttribute('rotation-per-second', '16deg');

  /* Two things happen the first time somebody touches the robot: the turntable
     starts waiting three seconds before it resumes, and the resting distance
     stops following the window. After that the camera is theirs. */
  var touched = false;

  mv.addEventListener('camera-change', function (ev) {
    if (!ev.detail || ev.detail.source !== 'user-interaction') return;
    touched = true;
    mv.autoRotateDelay = 3000;
  });

  window.addEventListener('resize', function () {
    if (!touched) mv.cameraOrbit = restingOrbit(mv);
  });

  mv.setAttribute('camera-controls', '');
  mv.setAttribute('interaction-prompt', 'none');

  /* Panning stays off. It is the one control that can lose the robot: it slides
     the camera target sideways rather than turning it, so a stray drag leaves an
     empty stage and no obvious way back. Orbit and zoom always end up looking
     at the robot. */
  mv.setAttribute('disable-pan', '');

  /* The CAD is authored Z up, as CAD is. glTF is Y up, so without this the
     robot arrives lying on its back and the hero shows its underside. Measured,
     not guessed: the bounding box is 0.452 x 0.450 x 0.422 m, and the short
     axis is the one that has to point at the sky. */
  mv.setAttribute('orientation', '0deg -90deg 0deg');

  /* A long lens flattens perspective, which is what makes a CAD render read as
     a drawing rather than a photograph. The orbit is the opening three quarter
     view: round the front, slightly above, at whatever distance suits the
     window. */
  mv.setAttribute('field-of-view', '24deg');

  /* Polar runs 5deg to 175deg, very nearly pole to pole: straight down onto the
     top plate at one end and up underneath the drivetrain at the other. It
     stops short of the poles themselves because the camera's up vector is
     undefined exactly there and the view rolls unpredictably passing through.

     The radius stops are picked by what is still worth looking at. 30% is the
     distance at which the robot spans the window: closer than that and you are
     inside the chassis looking at the backs of panels, which reads as a bug.
     300% is small but still legibly a robot; past that it is a speck. Azimuth
     is left unset, which leaves it unbounded, so the turn never hits a wall. */
  mv.setAttribute('min-camera-orbit', 'auto 5deg 30%');
  mv.setAttribute('max-camera-orbit', 'auto 175deg 300%');
  mv.setAttribute('min-field-of-view', '10deg');
  mv.setAttribute('max-field-of-view', '45deg');

  /* neutral, not the default filmic curve, which desaturates saturated colour
     as it brightens and turns the team blue to slate. No shadow and a flat
     environment: the page is two flat tones and the robot should sit in them. */
  mv.setAttribute('tone-mapping', 'neutral');
  mv.setAttribute('environment-image', 'neutral');
  mv.setAttribute('shadow-intensity', '0');
  mv.setAttribute('exposure', '1');

  mv.setAttribute('loading', 'eager');

  /* If the fetch or the decode fails there is no broken box to look at, the
     hero simply goes back to being type. */
  mv.addEventListener('error', function (ev) {
    console.error('[robot]', ev.detail || ev);
    stage.innerHTML = '';
  });

  stage.appendChild(mv);

  /* Only now, with the element in the document: the resting distance divides
     out the canvas to band height ratio, and neither height can be measured
     while the element is still detached. Setting it before appending left the
     ratio at 1 and the robot oversized on every narrow window. */
  mv.setAttribute('camera-orbit', restingOrbit(mv));
}

function initHeroRobot() {
  var stage = document.getElementById('hero-stage');
  if (!stage || !wantsRobot()) return;

  /* The script is a megabyte and the model three, and neither is needed for the
     page to be readable, so both wait until the browser is otherwise idle.
     Nothing above the fold blocks on either. */
  var start = function () {
    /* The viewer reads this global once, while its module is evaluating, and
       falls back to Google's CDN copy of the Draco decoder if it is not already
       there. It has to be set before the script tag, not after: the static
       setter on the element runs too late, and assigning to it from a classic
       script fails silently. Our model is Draco compressed, so without this the
       page would reach out to gstatic.com on every visit. */
    self.ModelViewerElement = self.ModelViewerElement || {};
    self.ModelViewerElement.dracoDecoderLocation = DRACO_URL;

    var tag = document.createElement('script');
    tag.type = 'module';
    tag.src = VIEWER_URL;
    tag.onload = function () { buildRobot(stage); };
    tag.onerror = function () {
      console.error('[robot] could not load ' + VIEWER_URL);
    };
    document.head.appendChild(tag);
  };

  if (window.requestIdleCallback) {
    requestIdleCallback(start, { timeout: 2500 });
  } else {
    window.addEventListener('load', start);
  }
}

initHeroRobot();


/* --------------------------------------------------------------------------
   CLICK SOUND
   One delegated listener on the document, in the capture phase. Delegated
   because the header and footer arrive by fetch, so anything bound to their
   links directly would miss every one of them. Capture because a handler
   further in may stop propagation.

   The catch that is not obvious: nearly everything on this site is a link, and
   a link unloads the page. The sample is 43ms and a local server answers in
   less, so the header nav, the brand, and the hero buttons all played and were
   cut off before they were audible. Anything that is about to leave the page
   in this tab is therefore held back until the sample has finished. See
   holdFor() for the many clicks that must not be held.
   -------------------------------------------------------------------------- */

var CLICK_SRC = 'files/audio/click.wav';

/* The file peaks at full scale, so it is loud played straight. 0.1 is the level
   you had already settled on for this sample elsewhere. One number to turn. */
var CLICK_VOLUME = 0.1;

/* Size of the fallback element pool, for browsers with no Web Audio and for
   the moment before the sample has decoded. Copies take turns so a short run
   of clicks does not cut itself off. The Web Audio path below needs no pool. */
var CLICK_VOICES = 4;

/* Ceiling on how long a navigation waits for the sound. Normally the sample
   finishes first and this never fires; it is here so a missing or slow file
   cannot leave a link feeling broken. It has to clear the sample plus the
   output latency, or the ceiling cuts the very thing it is waiting for. */
var CLICK_HOLD_MAX = 260;

/* How far behind the graph the speakers are. Reported in seconds where it is
   reported at all, and a small floor otherwise, since every device has some. */
function outputLag() {
  var lag = actx && (actx.outputLatency || actx.baseLatency) || 0;
  return Math.min(120, Math.round(lag * 1000) + 30);
}

/* What counts as clickable. Text fields and their labels are deliberately
   absent: putting a cursor in a field is not the same gesture as pressing
   something. The honeypot checkbox is hidden from people, so it is out too. */
var CLICK_TARGETS = 'a[href], button, select, summary, [role="button"], input[type="submit"]';

/* Whether this click is about to unload the page, so the sound needs holding.
   Every branch here is a click that must be left completely alone. */
function holdFor(ev, el) {
  if (ev.defaultPrevented) return null;          /* someone else owns this click */
  if (el.tagName !== 'A' || !el.href) return null;
  if (ev.button) return null;                    /* middle and right go elsewhere */
  if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return null;   /* new tab, window, download */
  if (el.hasAttribute('download')) return null;
  if (el.target && el.target !== '_self') return null;   /* _blank keeps this page alive */

  var url = new URL(el.href, location.href);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;  /* mailto:, tel: */

  /* A hash on the page we are already on scrolls, it does not unload. */
  if (url.href.split('#')[0] === location.href.split('#')[0]) return null;

  return el.href;
}

/* An HTMLAudioElement plays one sound at a time, so restarting one that is
   already going means seeking it back to zero, and a seek is a swallowed
   click. Copies taking turns only moves the problem along by four. Web Audio
   has no such limit: the file is decoded once and every click gets its own
   source node off the same buffer, so any number of them overlap and none of
   them ever seeks. The element pool below stays as the fallback. */

var actx     = null;   /* created once, resumed on the first real gesture */
var clickBus = null;   /* one gain node, created with the context and kept */
var clickBuf = null;   /* the decoded sample, or null while it is loading */
var voices   = [];     /* fallback pool, used until the buffer is ready */
var nextVoice = 0;

/* Sources that are still sounding. A node with nothing referencing it from
   script has been collected mid playback before now, and because the loud
   part of this sample is in its last ten milliseconds, losing the tail loses
   the click. They are dropped again on 'ended'. */
var sounding = [];

function openCtx() {
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!actx) {
    try { actx = new Ctx(); } catch (e) { return null; }
    /* One permanent gain, rather than a fresh one per click. The volume lives
       in one place and the only throwaway node is the source itself. */
    clickBus = actx.createGain();
    clickBus.gain.value = CLICK_VOLUME;
    clickBus.connect(actx.destination);
  }
  return actx;
}

/* Fetched and decoded up front. Until it lands, and on any browser where it
   fails, clicks come out of the element pool exactly as before. */
function loadClickBuffer() {
  var ctx = openCtx();
  if (!ctx || !ctx.decodeAudioData || !window.fetch) return;

  fetch(CLICK_SRC)
    .then(function (res) { return res.arrayBuffer(); })
    .then(function (bytes) {
      /* The callback form, because Safari's promise version arrived late. */
      ctx.decodeAudioData(bytes, function (buf) { clickBuf = buf; }, function () {});
    })
    .catch(function () {});
}

/* onDone, when given, fires when the sample has finished, so a link can wait
   for it. It is best effort: a failure calls it too, because the navigation
   matters more than the click. */
function playClick(onDone) {
  var ctx = actx;

  /* A context opened before any interaction starts suspended. resume() is
     only allowed to work inside a gesture, which is exactly where this runs.
     It is async, so the first click or two still come from the pool. */
  if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();

  if (ctx && clickBus && clickBuf && ctx.state === 'running') {
    var src = ctx.createBufferSource();
    src.buffer = clickBuf;
    src.connect(clickBus);

    sounding.push(src);

    var freed = false;
    function free() {
      if (freed) return;
      freed = true;
      var at = sounding.indexOf(src);
      if (at !== -1) sounding.splice(at, 1);
    }

    src.onended = function () {
      free();
      /* The tail is still in the output buffer when this fires, so a link
         waits out the hardware latency before it unloads the page. */
      if (onDone) setTimeout(onDone, outputLag());
    };

    /* A backstop, because a reference that is only dropped by an event that
       never arrives is a leak. Timed past the end of the sound either way. */
    setTimeout(free, Math.round(clickBuf.duration * 1000) + outputLag() + 60);

    src.start(0);
    return;
  }

  playClickVoice(onDone);
}

function playClickVoice(onDone) {
  if (!voices.length) { if (onDone) onDone(); return; }

  var v = voices[nextVoice];
  nextVoice = (nextVoice + 1) % voices.length;

  try { v.currentTime = 0; } catch (e) {}
  if (onDone) {
    v.addEventListener('ended', function () { setTimeout(onDone, outputLag()); }, { once: true });
  }

  var p = v.play();
  /* Rejects when the file is missing, or when the browser does not count the
     gesture as trusted. Either way a held link still has to go. */
  if (p && p.catch) p.catch(function () { if (onDone) onDone(); });
}

function initClickSound() {
  for (var i = 0; i < CLICK_VOICES; i++) {
    var voice = new Audio(CLICK_SRC);
    voice.preload = 'auto';
    voice.volume = CLICK_VOLUME;
    voices.push(voice);
  }

  loadClickBuffer();

  document.addEventListener('click', function (ev) {
    var el = ev.target;
    if (!el || !el.closest) return;          /* document itself, or a stray node */

    el = el.closest(CLICK_TARGETS);
    if (!el) return;

    var href = holdFor(ev, el);
    if (!href) { playClick(null); return; }  /* nothing to wait for */

    ev.preventDefault();

    /* Leave the moment the sample is done, or at the ceiling, whichever is
       first, and only ever once. */
    var gone = false;
    function go() {
      if (gone) return;
      gone = true;
      location.href = href;
    }

    playClick(go);
    setTimeout(go, CLICK_HOLD_MAX);
  }, true);
}

initClickSound();


/* --------------------------------------------------------------------------
   BOOT
   -------------------------------------------------------------------------- */

if (document.getElementById('log-grid') ||
    document.getElementById('entry')   ||
    document.getElementById('home-log')) {
  loadLog()
    .then(function (entries) {
      renderLogIndex(entries);
      renderEntry(entries);
      renderHomeLog(entries);
      markExternalLinks();          /* entries can carry outside links too */
    })
    .catch(function (err) {
      console.error('[log]', err);
      logError(document.getElementById('log-grid') || document.getElementById('entry'));
    });
}
