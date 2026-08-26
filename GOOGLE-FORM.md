# Chunk 3: the log intake pipeline

Anyone on the team fills in a form. One person moves it into the repo. That is
the whole system.

The point is that nobody except the transcriber ever has to touch JSON, and the
transcriber never has to invent anything, because the form asks for exactly the
fields the file needs and in the same order.

---

## Part 0. Build the form automatically

`google-form-setup.gs` in this repo creates the entire form in one run. Use this
rather than building it by hand.

1. Sign in to the Google account that should **own** the form.
2. Go to <https://script.google.com> and click **New project**.
3. Delete whatever is in the editor and paste in all of `google-form-setup.gs`.
4. Save. Choose `createLogForm` from the function dropdown. Click **Run**.
5. Approve the permissions prompt. It will warn that the app is not verified,
   because it is your own script. Click **Advanced**, then **Go to project**.
6. The **Execution log** prints three links. Keep all three:
   * the form to fill in, which goes in the team group chat, pinned
   * the form editor, for changing questions later
   * the responses spreadsheet

Run it once. Running it again makes a second form.

### What you also get

The script installs a trigger, so **every submission emails
`nathan.lamchamkee@gmail.com` with the entry already written as the object that
goes into `data/log.json`.** Transcribing becomes copy and paste:

```json
{
  "id": "2026-09-14-intake-v3-compliant-wheels",
  "date": "2026-09-14",
  "topic": "Mechanical",
  "title": "Intake v3, compliant wheels",
  "summary": "Cycle time down 0.6 seconds.",
  "body": [
    "Tubing lost grip.",
    "Compliant wheels held it."
  ],
  "images": []
}
```

The date is converted to `YYYY-MM-DD`, the id is generated from the date and
title, and the long answer is split into one array item per paragraph. If photos
were attached, the email lists their Drive links and the folder to put them in.

To send notifications somewhere else, change `NOTIFY` at the top of the script.

**One caveat.** File upload questions are not available on every kind of Google
account. If yours cannot use them the script does not fail: it adds a "Photo
links" paragraph question instead and notes it in the execution log. In that
case, photos go in the team Drive folder and people paste the links.

---

## Part 1. What the form contains

Built automatically by the script above. This section is the reference, and what
to rebuild by hand if you ever need to.

The form is called **Fractal Fusion, build log entry**. Email collection is on,
and one response per user is off.

The questions, in this order. The field name in brackets is the key it
maps to in `data/log.json`.

### 1. Date [date]
* Type: **Date**
* Required
* Description: *The day the work happened, not the day you are filling this in.*

### 2. Title [title]
* Type: **Short answer**
* Required
* Description: *Short. It has to fit on a card, so aim for under about sixty characters. "Intake v3, compliant wheels" rather than "We changed the intake again".*

### 3. Topic [topic]
* Type: **Dropdown**
* Required
* Options, exactly these six and nothing else:
  * CAD
  * Mechanical
  * Misc
  * Outreach
  * Software
  * Strategy

### 4. One sentence summary [summary]
* Type: **Short answer**
* Required
* Description: *One sentence. This is all most people will read, so put the result in it. "Cycle time down 0.6 seconds and far fewer jams" beats "we worked on the intake".*

### 5. What happened [body]
* Type: **Paragraph**
* Required
* Description: *Write it like you are explaining it to a teammate who was away. What you tried, what happened, what you changed. Leave a blank line between paragraphs. Numbers are always better than adjectives.*

### 6. Photos [images]
* Type: **File upload**
* Not required
* Allow multiple files, up to 5
* Allow only: **Image**
* Max file size: 10 MB

### 7. Your name
* Type: **Short answer**
* Required
* Description: *So we know who to ask if something is unclear.*

Then link the form to a spreadsheet: **Responses**, then the Sheets icon.

---

## Part 2. The transcriber checklist

Once a week, or after any big build night. Budget about five minutes per entry.

If you are working from the **notification emails**, most of this is done for
you: copy the JSON block out of the email, paste it at the end of the list in
`data/log.json`, add a comma after the entry above it, and skip to step 5.

Working from the spreadsheet instead:

1. Open the responses sheet. Work top to bottom through anything new.
2. Open `data/log.json` in your editor.
3. Copy the **last** entry in the file, paste it at the **end** of the list, and
   put a comma after the entry above it.
4. Fill in the fields from the row:
   * `date` becomes `YYYY-MM-DD`. The sheet may show it as `2/14/2026`. Rewrite
     it as `2026-02-14`.
   * `title`, `topic`, `summary` copy straight across.
   * `id` is the date, then two or three words from the title, lowercase with
     hyphens. `2026-02-14-intake-v3`.
   * `body` is the long answer, **split into one quoted string per paragraph**.
   * Delete the `"placeholder": true` line. That flag is only for the sample
     entries that shipped with the site.
5. If there are photos:
   * Make a folder `files/log/<id>/`
   * Download them from the Drive folder, rename `01.jpg`, `02.jpg`
   * Resize anything wider than about 2000px
   * Add one `{ "src": ..., "caption": "" }` per photo to `images`
   * No photos means `"images": []`
6. Check it: `python3 -m http.server 8000` then open
   <http://localhost:8000/log.html>. The new entry should be at the top.
7. Commit and push.

If the log page says **"The log could not be loaded"**, the JSON is broken.
Nine times out of ten it is a comma. Paste the file into <https://jsonlint.com>
and it will point at the line.

---

## Part 3. Keeping it alive

The system dies from lack of entries, never from bad ones. Two habits that help
more than anything technical:

* **Put the form link in the team group chat, pinned.** Nobody will hunt for it.
* **Ask for an entry at the end of a build session, while people are still in
  the room.** An entry written that evening takes four minutes. The same entry
  reconstructed in February takes half an hour and is worse.

A three line entry is worth far more than a perfect entry that never gets
written. `Misc` exists precisely so nobody stalls on picking a topic.
