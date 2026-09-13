# Adding a log entry

Everything lives in one file: `data/log.json`. Add one object to it and the card,
the filter count and the entry page all appear on their own. No HTML is edited,
ever.

---

## The short version

1. Open `data/log.json`.
2. Copy the last entry, paste it at the **end** of the list, edit the values.
3. If there are photos, make a folder `files/img/log/<id>/` and drop them in.
4. Save, commit, push.

Order does not matter. The page sorts by date, newest first, so always append to
the end and never think about where an entry belongs.

---

## The fields

```json
{
  "id": "2026-09-14-intake-v3",
  "date": "2026-09-14",
  "topic": "Mechanical",
  "title": "Intake v3, compliant wheels",
  "summary": "One sentence. This is what people read on the card.",
  "author": "Nathan L",
  "body": [
    "First paragraph.",
    { "figure": "files/img/log/2026-09-14-intake-v3/01.jpg",
      "alt": "What the picture shows",
      "caption": "What the picture does not show" },
    "Second paragraph."
  ],
  "thumb": { "src": "files/img/log/2026-09-14-intake-v3/01.jpg" }
}
```

| Field | Rules |
|---|---|
| `id` | Date first, then a couple of words, all lowercase, hyphens between. Must be unique, because it is the web address of the entry. |
| `date` | `YYYY-MM-DD`. Nothing else. |
| `topic` | Exactly one of: `CAD`, `Mechanical`, `Misc`, `Outreach`, `Software`, `Strategy`. Spelling and capitals must match, or the entry will not appear under any filter. |
| `title` | Short. It sits on a card, so aim for under about 60 characters. |
| `summary` | One sentence. Shown on the card, and under the heading on the entry page. |
| `author` | Optional. Who wrote the entry, shown after the date at the top of the entry page. First name and last initial, like `Nathan L`. Comes across from the **Your name** field on the add-log form. Leave it out and the date simply ends the line. |
| `body` | A **list**, one item per paragraph. An item in quotes is a paragraph; an item in braces is a picture, placed at exactly that point in the text. See [Photos](#photos). |
| `thumb` | Optional. The picture used on the card. `{ "src": "..." }`. Leave it out and the first picture in `body` is used instead. |

### Why body is a list

JSON strings cannot contain line breaks. If body were one long string you would
have to type `\n\n` between paragraphs and get it right every time. A list means
you paste one paragraph per line and the page handles the spacing.

### Linking to something mid sentence

A paragraph is plain text. HTML typed into one comes out as the characters you
typed, on purpose, so an entry can say `<script>` without anything happening.
The one exception is a link, written the way it is written in Markdown:

```
"[Here](biobuzz-calculator.html) is a calculator for the chances of each scenario."
```

The words in the square brackets become the link, the address in the round
brackets is where it goes. Use a relative path for our own pages
(`biobuzz-calculator.html`, not a full address), which is how every other link
on the site is written. Outside links get a new tab on their own.

Two things it will not do:

- **Addresses containing brackets do not work.** Some Wikipedia URLs are like
  this. Put the address in as a picture caption or leave it as plain text.
- **Only `http`, `https` and `mailto` addresses link.** Anything else keeps its
  words and quietly loses its link, because the body is a box a stranger can
  type into through the form.

Links only work in body paragraphs, not in the summary or a caption.

---

## Photos

1. Make a folder named exactly like the entry's `id`, inside `files/img/log/`.
2. Name the files `01.jpg`, `02.jpg`, and so on.
3. Reference them as `files/img/log/<id>/01.jpg`.

Resize anything over about 1600px on the long edge before committing. A phone
photo is often 4MB, and a page with six of them is slow on the venue wifi.

### Where a picture goes

Pictures go **inside `body`**, at the point in the writing they belong to. A
photo of a broken part means something next to the sentence about it breaking,
and very little at the bottom of the page.

Wherever you put the block is where the picture appears. Put one in the middle
of the list and it sits between those two paragraphs; put one at the end of the
list and it sits at the end of the entry. Mix them however the writing needs.
Pictures stack one after another, in the order written.

```json
"body": [
  "The v2 plate bent after about forty cycles.",
  { "figure": "files/img/log/<id>/01.jpg",
    "alt": "The bent plate, seen from the side",
    "caption": "Forty cycles. The bend is the failure, not the wear." },
  "So v3 moved the wheels forward 8mm.",
  "It has held up across two events since.",
  { "figure": "files/img/log/<id>/02.jpg",
    "alt": "The finished v3 intake on the robot",
    "caption": "Where it ended up." }
]
```

That entry has one picture in the middle and one at the end. There is no limit
on how many, or on where.

### alt and caption are different things

`alt` describes the picture for somebody who cannot see it. The `caption` is
printed under the picture and adds what the picture itself does not show, like
how many cycles it took or which version it is. Do not put the same sentence in
both. `caption` can be left out; `alt` should not be.

### Two side by side

Two pictures written as separate blocks stack, one above the other. Put them in
one `figures` block instead and they sit in a row:

```json
{ "figures": [
    { "src": "files/img/log/<id>/01.jpg", "caption": "v2" },
    { "src": "files/img/log/<id>/02.jpg", "caption": "v3" }
  ] }
```

Both come out the same height whatever their shapes, so the row reads as a row.
Use it when the two pictures are views of one thing, a before and an after most
often. Two unrelated photos are better stacked, where each gets its own space.

More than two works the same way. On a narrow window the row wraps and they
stack, rather than shrinking to stamps.

### How big a picture comes out

Pictures are sized by **height**, not width. The photos come off phones, so
they are portrait, and a portrait photo at the full width of the text would
stand taller than the window it is being read in: you would never see one whole
picture, or its caption underneath it, at the same time.

So a lone picture is capped at about three quarters of the window height, and
each picture in a row a little under two thirds. Width follows from the shape
of the photo, which is why a tall one comes out narrower than a wide one. There
is nothing to set in the JSON for any of this.

### The wide layout

`"layout": "wide"` lets one picture run the full width of the page instead of
the width of the text. Use it for CAD and screenshots, which are unreadable at
text width, and use it **once per entry at most**. It works by breaking the
rhythm of the page, so it stops working when everything does it.

```json
{ "figure": "files/img/log/<id>/01.png", "layout": "wide", "alt": "..." }
```

### The card thumbnail

`thumb` decides which picture represents the entry on the log page. Pick the one
that is most recognisable at card size, which is usually **not** the first
picture in the entry: opening shots are often close-ups that turn to mush when
shrunk. Leave `thumb` out and the first picture in `body` is used.

Give every entry a `thumb` if it has any photo at all. A card with no picture
sitting in a grid of cards with pictures reads as a page that failed to load.

---

## From the Google Form

Responses land in the linked Sheet, photos in the linked Drive folder.

1. Open the newest row.
2. Copy `Date`, `Title`, `Topic` and `Summary` straight across.
3. Copy `Your name` into `author`, shortened to a first name and last initial.
4. Split the long answer into paragraphs, one per item in `body`.
5. Download the photos, rename them `01`, `02`, put them in the entry folder, and
   add each one to `body` at the point it belongs, plus a `thumb`.
6. Save, check the page locally, commit.

---

## If the page breaks

The log shows **"The log could not be loaded"** when `data/log.json` is not valid
JSON. Nine times out of ten it is a comma:

* every entry except the last needs a comma after its closing `}`
* the last entry must **not** have one
* same rule inside `body`, and inside a `figures` list

Paste the whole file into <https://jsonlint.com> and it will point at the line.

Anything else, open the browser console. The exact error is there.

---

## Checking your work

```
python3 -m http.server 8000
```

Then <http://localhost:8000/log.html>. Opening the file by double clicking will
not work, because the header and footer are fetched and browsers block that on
`file://`.

