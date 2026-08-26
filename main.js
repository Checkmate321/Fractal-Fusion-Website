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

  /* download tells the browser to save the file rather than try to display it. */
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

function initForms() {
  document.querySelectorAll('form[data-web3form]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var status = form.querySelector('.form-status');
      var btn    = form.querySelector('button[type="submit"]');
      var data   = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      if (btn) btn.disabled = true;
      if (status) status.textContent = 'Sending\u2026';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) { return res.json(); })
        .then(function (out) {
          if (!out.success) throw new Error(out.message || 'Web3Forms rejected the submission');
          form.reset();
          if (status) status.textContent = 'Thank you. We will reply to that address within a couple of days.';
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

function buildRobot(stage) {
  var mv = document.createElement('model-viewer');

  mv.setAttribute('src', ROBOT_URL);
  mv.setAttribute('alt', 'Sierah, the 2026 competition robot, rotating slowly');

  /* Turntable. auto-rotate-delay 0 because there is no interaction to wait for,
     and the rotation is the whole point of putting it here. */
  mv.setAttribute('auto-rotate', '');
  mv.setAttribute('auto-rotate-delay', '0');
  mv.setAttribute('rotation-per-second', '16deg');

  /* Drag to look, but never zoom or pan: zoom would eat the page scroll, and
     panning lets a visitor lose the robot off the edge of its own stage. */
  mv.setAttribute('camera-controls', '');
  mv.setAttribute('disable-zoom', '');
  mv.setAttribute('disable-pan', '');
  mv.setAttribute('interaction-prompt', 'none');

  /* The CAD is authored Z up, as CAD is. glTF is Y up, so without this the
     robot arrives lying on its back and the hero shows its underside. Measured,
     not guessed: the bounding box is 0.452 x 0.450 x 0.422 m, and the short
     axis is the one that has to point at the sky. */
  mv.setAttribute('orientation', '0deg -90deg 0deg');

  /* A long lens flattens perspective, which is what makes a CAD render read as
     a drawing rather than a photograph. The orbit is the reference three
     quarter view: round the front, slightly above. The radius sits under 100%
     so the robot fills its stage instead of floating in the middle of it. */
  mv.setAttribute('field-of-view', '24deg');
  mv.setAttribute('camera-orbit', '35deg 72deg 80%');
  mv.setAttribute('min-camera-orbit', 'auto 55deg auto');
  mv.setAttribute('max-camera-orbit', 'auto 88deg auto');

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
