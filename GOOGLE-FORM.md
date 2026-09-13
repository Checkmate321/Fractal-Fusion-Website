# The log intake pipeline

Anyone on the team fills in a form. One person moves it into the repo. That is
the whole system, and nobody except the transcriber ever touches JSON.

There are two ways to run the form. **Use the first one.**

---

## Option A, the page on our own site (recommended)

<https://fractalfusion.team/add-log.html>

No Google account, no sign in, no permissions prompt, nothing to install. It is
not linked from the nav, it is marked `noindex, nofollow`, it is excluded from
the sitemap and disallowed in `robots.txt`. Share the link in the team chat.

Submitting emails the team inbox with the entry **already written as the object
that goes into `data/log.json`**, and shows the same JSON on the page with a
Copy button, so whoever fills it in can hand it over directly.

```json
{
  "id": "2026-09-14-intake-v3-compliant-wheels",
  "date": "2026-09-14",
  "topic": "Mechanical",
  "title": "Intake v3, compliant wheels",
  "summary": "Cycle time down 0.6 seconds.",
  "author": "Nathan L",
  "body": [
    "Tubing lost grip.",
    "Compliant wheels held it."
  ]
}
```

The date comes through as `YYYY-MM-DD` from the date picker, the id is built
from the date and title, and the long answer is split into one array item per
paragraph.

**It cannot take image uploads**, because that needs a paid Web3Forms plan.
Photos go in the shared Drive folder instead, which the page links to directly:

<https://drive.google.com/drive/folders/1v2ECKY4P1JFVl_UeO-TdGDt81It-BCnY>

Start the filename with the date, like `2026-09-14-intake`, so photos can be
matched to the right entry later. Every submission email carries the folder link
alongside the `files/img/log/<id>/` path they need to end up in, so no separate
description is needed.

To change the folder, edit the `href` on the `#photo-folder` button in
`add-log.html`. The email reads the link back out of that markup, so there is
only one copy of it.

**Unlisted is not private.** Anyone with the link can submit. It only sends
email, so the worst case is junk in the inbox, and there is a honeypot field to
catch bots. Do not treat the URL as a secret.

To change where it sends, replace the `access_key` in `add-log.html` with a
different Web3Forms key.

---

## Option B, a real Google Form

Use this only if you specifically want Google's file upload question, so photos
arrive attached rather than described. The cost is that whoever runs the setup
script has to click through an unverified app permissions prompt, which is what
Option A avoids.

`google-form-setup.gs` builds the whole form in one run.

1. Sign in to the Google account that should **own** the form.
2. Go to <https://script.google.com> and click **New project**.
3. Delete whatever is in the editor and paste in all of `google-form-setup.gs`.
4. Save. Choose `createLogForm` from the function dropdown. Click **Run**.
5. Approve the permissions prompt. It warns the app is not verified because it
   is your own script. **Advanced**, then **Go to project**.
6. The **Execution log** prints the form link, the editor link and the responses
   spreadsheet link.

Run it once. Running it again makes a second form.

It installs the same kind of submit trigger, emailing the composed JSON to the
address in `NOTIFY` at the top of the script.

If the account cannot use file upload questions, the script does not fail. It
adds a "Photo links" paragraph question instead and says so in the log, which
makes it equivalent to Option A but with extra steps.

---

## The questions

Option A asks six things: date, title, topic, summary, what happened, and your
name. Photos are handled by the shared Drive folder rather than a field.

Option B asks the same six plus a photo upload question, since Google can take
the files directly. The full reference for both follows.

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
   * `author` is the **Your name** answer, shortened to a first name and last
     initial.
5. If there are photos:
   * Make a folder `files/img/log/<id>/`
   * Download them from the Drive folder, rename `01.jpg`, `02.jpg`
   * Resize anything wider than about 2000px
   * Add each one to `body`, at the point in the text it belongs to, as
     `{ "figure": "...", "alt": "...", "caption": "..." }`
   * Add a `"thumb"` for the card
   * See [ADDING-A-LOG-ENTRY.md](ADDING-A-LOG-ENTRY.md) for placement and wide images
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
