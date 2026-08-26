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
partners.html  about.html  404.html
add-log.html                              unlisted, team only
sitemap.xml  robots.txt

header.html  footer.html                  injected into every page by main.js
style.css                                 the only stylesheet
main.js                                   the only script

data/                                     content that grows (JSON)
files/logos/                              team and sponsor logos
files/audio/click.wav                     UI click, played by main.js
files/log/                                photos, one folder per log entry
files/CAD/                                robot models
files/vendor/                             model-viewer and its Draco decoder
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
* the hero stacks by default, in source order, so a phone gets words, buttons,
  then a centred robot with nothing to reorder

There are two width queries in the file, and both buy order or arrangement
rather than size, which is the one thing a fluid value cannot express:

* the footer at `38rem`, where the social marks and the legal line swap places
* the hero at `64rem`, where the robot stops being a row under the words and
  becomes a layer over them

The remaining `@media` rule is `prefers-reduced-motion`, which is a user setting
rather than a breakpoint.

### Nav

Links live in `header.html` only. Each page sets `<body data-page="...">` and
`main.js` marks the matching link active. **Anything touching the nav must run
inside the `.then()`** in `main.js`, because the links do not exist until the
fetch resolves.

---

## Sponsors

`data/sponsors.json` drives the detailed list on `sponsors.html`. The scrolling
wall on the home page is hand written in `index.html`, so **adding a sponsor
means editing both**. Say the word and the marquee can read from the same JSON.

Every supplied logo is dark ink on transparency, so the wall belongs on a light
band. Do not move it onto navy.

## Resources

`data/resources.json` drives `resources.html`. An entry with `"placeholder": true`
or an empty `href` renders as a non clickable card marked "in progress", so the
page can advertise work that is coming without offering a dead link.

The robot models in `files/CAD/` are real downloads. `.gitattributes` marks
`.glb` as binary so line ending normalisation can never corrupt them.

## The robot in the hero

`index.html` ends its hero with an empty `.hero-stage`. `main.js` fills it with a
`<model-viewer>` showing `files/CAD/26Worlds-web.glb`, Sierah, turning slowly.

**`26Worlds-web.glb` is generated, not authored.** It is `26Worlds.glb` with its
primitives merged, and it is the file the site loads. Keep the original as the
source of truth and regenerate the web copy if the CAD changes:

```
npx @gltf-transform/cli optimize <in>.glb <out>.glb --compress draco
```

That alone will not help much here. The Worlds export arrived as 9,010 separate
primitives that all share one material, and `optimize` skips its `join` step
whenever GPU instancing is on, so the merge has to be done directly against the
scripting API. Merging them per mesh is what took the file from 11 MB to 3 MB:
6 MB of the original was not geometry at all, it was the JSON describing 36,108
accessors. Draw calls fell from 9,010 to 35 at the same time, which matters more
than the megabytes on a phone.

Three things about the viewer are deliberate, and each one is load bearing:

* **It is vendored.** `files/vendor/` holds `model-viewer.min.js` and the Draco
  decoder. model-viewer otherwise fetches that decoder from `gstatic.com` on
  every visit, and the decoder location must be set on `self.ModelViewerElement`
  *before* the script tag: the static property on the element is read too late,
  and assigning to it from a classic script fails silently.
* **`orientation="0deg -90deg 0deg"`.** The CAD is Z up, glTF is Y up. Without
  it the robot lies on its back and the hero shows its underside.
* **`tone-mapping="neutral"`.** The default filmic curve desaturates saturated
  colour as it brightens, which turns the team blue to slate. The model's colours
  are a palette texture baked into the file, so nothing in CSS or JS sets a
  material.

### The two arrangements

Below `64rem` the hero is one column: `.hero-head`, `.hero-actions`,
`.hero-stage`, `.statrow`, in that source order, robot centred under the
buttons. Above it the wrap becomes a three row grid and `.hero-head` and
`.hero-stage` are both placed in row one, so they share a cell and overlap.

The robot sits right of the words at rest without the camera being touched: the
`model-viewer` inside the stage is 170% wide and hung to one side, and the stage
clips the overhang. The obvious alternative, sliding the camera's look at point
sideways, was measured and rejected: it makes the robot swing 97px across the
screen as it turns instead of spinning on the spot, against 0px drift for this.

### Controls

Orbit is unbounded, polar runs 5deg to 175deg (top plate to underside, stopping
short of the poles where the up vector is undefined and the view rolls), and
zoom runs 15% to 400%. 15% is deliberately far enough in that the robot fills
the whole window and covers the words: above `64rem` the stage is a full bleed
`100vw` row laid over the copy, so there is nothing to stop it horizontally.
What does stop it is the row below: the buttons are their own grid row, so the
robot's box ends where theirs begins and the row gap is the clearance you see
above them. Nothing measures the buttons, the grid does it. Panning is the one control left off: it slides the camera
target sideways rather than turning it, so a stray drag leaves an empty stage
with no obvious way back, whereas orbit and zoom always end up looking at the
robot.

**Enabling zoom means the wheel zooms the model instead of scrolling the page**
whenever the pointer is over it, and the model is about a third of the hero.
There is no modifier key for this in model-viewer. Two ways out if it bothers
anyone: require ctrl or the meta key for zoom, the way an embedded map does, or
turn zoom back off with the `disable-zoom` attribute.

`auto-rotate-delay` starts at 0 so the robot is already turning when the page
arrives, then goes to 3000 on the first interaction so the turntable does not
fight someone who is trying to look at something. model-viewer uses that one
value for both the initial pause and the post interaction pause, which is why it
is changed at runtime rather than set once.

The model is fetched unless the visitor has Save Data on, is on an estimated 2g
connection, or has asked for reduced motion. There is deliberately **no width
test**: the robot shows on a phone too, centred under the copy, which does mean a
phone pays the full download. Declined, the stage stays empty, `:empty` removes
it, and the hero is exactly the layout it was before the robot existed. Nothing
on the page waits on any of it.

## Adding a log entry, the easy way

Send people to **`/add-log.html`**. It is unlisted, needs no account, and emails
the entry already formatted as the JSON object. See `GOOGLE-FORM.md`.

## Adding a log entry by hand

See [ADDING-A-LOG-ENTRY.md](ADDING-A-LOG-ENTRY.md). One object appended to
`data/log.json` produces a card, an entry page and a filter count. No HTML is
ever edited.

---

## Before this goes live

- [ ] **Replace the fixture log entries.** They are invented placeholders written
      to test the schema. A site whose purpose is a credible record cannot ship
      with made up engineering history on it.
- [ ] **Swap the donate URL on `sponsors.html`.** It currently points at the
      enquiry form and is marked as a placeholder on the page itself.
- [ ] Point the Web3Forms key at the team address. It currently delivers to a
      personal inbox for testing. The public facing address is
      `fractal.fusion27188@gmail.com`.
- [ ] Replace `ffLogo.png` with a vector if the source file turns up, and check
      the artifact at the centre of the spiral.
- [ ] Confirm the award list against your own records before it goes on a page.

**The sponsorship letter says "among the top 30 robotics teams worldwide".**
FTCScout puts the team 156th of 8,365 on total npOPR for the 2025 season, and
80th of 8,365 in autonomous. Both are excellent and both are checkable in about
thirty seconds by anyone who wants to. The site uses those figures rather than
top 30. The letter should be corrected to match, because the sponsors being
targeted are exactly the people who would look it up.

Season rankings, for reference:

| Season | Total npOPR | Autonomous |
|---|---|---|
| 2024/25 | 690 of 7,641, top 9% | 925 of 7,641, top 12% |
| 2025/26 | 156 of 8,365, top 1.9% | 80 of 8,365, top 1.0% |

## Build order

All eight chunks are done.

1. Foundation: structure, tokens, header and footer, page shells
2. Mission log: `data/log.json`, card grid, filters, entry pages
3. Intake pipeline: `add-log.html`, see `GOOGLE-FORM.md`
4. Landing page
5. Sponsors
6. Partners
7. Resources: `data/resources.json`, including the three robot GLB files
8. About, 404, sitemap, robots.txt

## Deploying

Static files, no build step. Point Cloudflare Pages (or Netlify, or GitHub Pages)
at the repo with **no build command** and the root as the output directory, then
attach `fractalfusion.team`.

Two things to set on the host:

* the 404 page is `404.html`
* the largest file is `files/CAD/26Worlds.glb` at about 10.5 MB, comfortably under
  Cloudflare Pages' 25 MB per file limit

**The site assumes it is served from the root of a domain.** `header.html`,
`footer.html` and their links are root relative, so the 404 page still works when
it is served in place of a deep path. Hosting the site in a subfolder would
require making those relative again.
