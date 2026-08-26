# Fractal Fusion, fractalfusion.team

Website for <em>FIRST</em> Tech Challenge team 27188, Orlando Science Middle High Charter.

Plain HTML, CSS and JavaScript. **No build step, no npm, no framework.**
Clone it, run a server, edit files.

---

## Running it locally

`header.html` and `footer.html` are pulled in with `fetch()`, and browsers block
`fetch` on `file://`. **Opening index.html by double clicking will show a page with
no header or footer.** Start a server instead:

```
cd "Fractal Fusion Website"
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

---

## Files

```
index.html  log.html  entry.html          the pages
resources.html  sponsors.html
partners.html  about.html

header.html  footer.html                  injected into every page by main.js
style.css                                 the only stylesheet
main.js                                   the only script

data/                                     content that grows (JSON)
files/logos/                              team and sponsor logos
files/log/                                photos, one folder per log entry
```

## Editing

### Colours

Top of `style.css`. Three colours, nothing else. No raw hex value should ever
appear below the `:root` block.

```
--light  #DCE7F7   periwinkle   light ground, text on dark
--dark   #2E3A55   slate navy   dark ground, text on light
--c1     #FBEFA1   butter       SHAPE on light, TEXT on dark
```

The yellow sits at 1.07:1 against the periwinkle, so on light grounds it is only
ever a fill, a bar or an underline, never text. On navy it reaches 9.70:1 and
works as type.

### Tones

There are only two, and both are mixed from `currentColor`:

```
--mute   currentColor at 75%   secondary text, labels, captions
--hair   currentColor at 18%   borders and rules
```

Because they resolve against the surrounding text colour, one token works on
either ground. Nothing needs overriding when a section flips to navy.

### Cards

A card inverts its ground. A card on light is `--dark`, a card on dark is
`--light`. Never a tint, never a partial opacity fill. Use `.card--line` when a
dense grid would otherwise be all slabs.

### Responsive

**There are no breakpoints.** Every size is fluid, using `clamp()` against
viewport width, and for the two largest spacing steps against viewport height as
well. Layouts collapse on their own:

* the nav carries `flex: 1 1 22rem`, so it drops to its own row when there is no
  longer room beside the wordmark
* grids use `repeat(auto-fit, minmax(min(100%, X), 1fr))`, so columns wrap and
  never force the page wider than the viewport

The only `@media` rule in the file is `prefers-reduced-motion`, which is a user
setting rather than a breakpoint.

### Nav

Links live in `header.html` only. Each page sets `<body data-page="...">` and
`main.js` marks the matching link active. **Anything touching the nav must run
inside the `.then()`** in `main.js`, because the links do not exist until the
fetch resolves.

---

## Adding a log entry

See `ADDING-A-LOG-ENTRY.md` (Chunk 2).

---

## Before this goes live

- [ ] **Replace the fixture log entries.** They are invented placeholders written
      to test the schema. A site whose purpose is a credible record cannot ship
      with made up engineering history on it.
- [ ] Swap the donate URL on `sponsors.html` for the real one.
- [ ] Point the Web3Forms key at the team address. It currently delivers to a
      personal inbox for testing. The public facing address is
      `fractal.fusion27188@gmail.com`.
- [ ] Replace `ffLogo.png` with a vector if the source file turns up, and check
      the artifact at the centre of the spiral.
- [ ] Confirm the award list and the "1st in Florida" npOPR claim against your
      own records before either goes on a page.

## Build order

1. Done. Foundation: structure, tokens, header and footer, page shells
2. Mission log: `data/log.json`, card grid, filters, entry pages
3. Intake pipeline: Google Form to transcriber to repo
4. Landing page
5. Sponsors
6. Partners
7. Resources
8. About, meta, sitemap, ship
