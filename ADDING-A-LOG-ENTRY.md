# Adding a log entry

Everything lives in one file: `data/log.json`. Add one object to it and the card,
the filter count and the entry page all appear on their own. No HTML is edited,
ever.

---

## The short version

1. Open `data/log.json`.
2. Copy the last entry, paste it at the **end** of the list, edit the values.
3. If there are photos, make a folder `files/log/<id>/` and drop them in.
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
  "body": [
    "First paragraph.",
    "Second paragraph."
  ],
  "images": [
    { "src": "files/log/2026-09-14-intake-v3/01.jpg", "caption": "" }
  ]
}
```

| Field | Rules |
|---|---|
| `id` | Date first, then a couple of words, all lowercase, hyphens between. Must be unique, because it is the web address of the entry. |
| `date` | `YYYY-MM-DD`. Nothing else. |
| `topic` | Exactly one of: `CAD`, `Mechanical`, `Misc`, `Outreach`, `Software`, `Strategy`. Spelling and capitals must match, or the entry will not appear under any filter. |
| `title` | Short. It sits on a card, so aim for under about 60 characters. |
| `summary` | One sentence. Shown on the card, and under the heading on the entry page. |
| `body` | A **list of paragraphs**, each one in quotes with a comma after it. One paragraph per item. |
| `images` | A list, possibly empty (`[]`). Each item has a `src` and a `caption`. Caption can be `""`. |

### Why body is a list

JSON strings cannot contain line breaks. If body were one long string you would
have to type `\n\n` between paragraphs and get it right every time. A list means
you paste one paragraph per line and the page handles the spacing.

---

## Photos

1. Make a folder named exactly like the entry's `id`, inside `files/log/`.
2. Name the files `01.jpg`, `02.jpg`, and so on.
3. Reference them as `files/log/<id>/01.jpg`.

Resize anything over about 2000px wide before committing. A phone photo is often
4MB, and a page with six of them is slow on the venue wifi.

The first image also becomes the card thumbnail on the log page.

---

## From the Google Form

Responses land in the linked Sheet, photos in the linked Drive folder.

1. Open the newest row.
2. Copy `Date`, `Title`, `Topic` and `Summary` straight across.
3. Split the long answer into paragraphs, one per item in `body`.
4. Download the photos, rename them `01`, `02`, and put them in the entry folder.
5. Save, check the page locally, commit.

---

## If the page breaks

The log shows **"The log could not be loaded"** when `data/log.json` is not valid
JSON. Nine times out of ten it is a comma:

* every entry except the last needs a comma after its closing `}`
* the last entry must **not** have one
* same rule inside `body` and `images`

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

---

## One more thing

The six entries currently in the file are **invented samples** used to build the
page. They carry a yellow `SAMPLE ENTRY` flag so nobody mistakes them for real
history. Delete all six before the site goes public, or remove the
`"placeholder": true` line from any that you replace with genuine content.
