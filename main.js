/* ==========================================================================
   FRACTAL FUSION — main.js
   Chunk 1: header/footer injection + active nav.
   ========================================================================== */

/* Pull a partial into an element by id. */
function include(id, file) {
  var host = document.getElementById(id);
  if (!host) return Promise.resolve();

  return fetch(file)
    .then(function (res) {
      if (!res.ok) throw new Error(file + ' → ' + res.status);
      return res.text();
    })
    .then(function (html) { host.innerHTML = html; })
    .catch(function (err) {
      console.error('[include]', err);
      // Running from file://? fetch is blocked. Use: python3 -m http.server
    });
}

/* Mark the current page in the nav.
   Must run AFTER the header lands — the links do not exist before that. */
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
