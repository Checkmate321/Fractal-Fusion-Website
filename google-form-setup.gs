/**
 * FRACTAL FUSION, FTC 27188
 * One run of createLogForm() builds the whole build log intake form.
 *
 * HOW TO USE
 *   1. Sign in to the Google account that should OWN the form.
 *   2. Go to https://script.google.com and click New project.
 *   3. Delete whatever is in the editor and paste this entire file in.
 *   4. Save, choose createLogForm from the function dropdown, click Run.
 *   5. Approve the permissions prompt. It will warn that the app is not
 *      verified, because it is your own script. Advanced, then Go to project.
 *   6. The Execution log prints the form link, the edit link and the
 *      responses spreadsheet link. Put the form link in the team group chat.
 *
 * Running it a second time creates a second form, so only run it once.
 */

var NOTIFY = 'nathan.lamchamkee@gmail.com';

var TOPICS = ['CAD', 'Mechanical', 'Misc', 'Outreach', 'Software', 'Strategy'];


function createLogForm() {
  var form = FormApp.create('Fractal Fusion, build log entry');

  form.setDescription(
    'One entry per thing you worked on. Three sentences is a perfectly good entry. ' +
    'A short entry written tonight beats a detailed one reconstructed in February.');

  try { form.setCollectEmail(true); } catch (e) { Logger.log('Could not turn on email collection: ' + e); }
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(false);
  form.setConfirmationMessage('Logged. Thank you. It will appear on the site once someone moves it across.');

  // 1. Date
  form.addDateItem()
      .setTitle('Date')
      .setHelpText('The day the work happened, not the day you are filling this in.')
      .setRequired(true);

  // 2. Title
  form.addTextItem()
      .setTitle('Title')
      .setHelpText('Short, it has to fit on a card. Aim for under sixty characters. ' +
                   '"Intake v3, compliant wheels" rather than "We changed the intake again".')
      .setRequired(true);

  // 3. Topic
  form.addListItem()
      .setTitle('Topic')
      .setHelpText('Pick the closest one. Misc exists so you never have to stall on this.')
      .setChoiceValues(TOPICS)
      .setRequired(true);

  // 4. Summary
  form.addTextItem()
      .setTitle('One sentence summary')
      .setHelpText('This is all most people will read, so put the result in it. ' +
                   '"Cycle time down 0.6 seconds and far fewer jams" beats "we worked on the intake".')
      .setRequired(true);

  // 5. Body
  form.addParagraphTextItem()
      .setTitle('What happened')
      .setHelpText('Explain it to a teammate who was away. What you tried, what happened, ' +
                   'what you changed. Leave a blank line between paragraphs. ' +
                   'Numbers beat adjectives every time.')
      .setRequired(true);

  // 6. Photos. Only available on some account types, so never let it stop the run.
  try {
    form.addFileUploadItem()
        .setTitle('Photos')
        .setHelpText('Optional. Up to five.')
        .setRequired(false);
  } catch (e) {
    form.addParagraphTextItem()
        .setTitle('Photo links')
        .setHelpText('Optional. This account cannot use file upload questions, so upload ' +
                     'photos to the team Drive folder and paste the links here, one per line.')
        .setRequired(false);
    Logger.log('File upload not available on this account, added a links question instead.');
  }

  // 7. Name
  form.addTextItem()
      .setTitle('Your name')
      .setHelpText('So we know who to ask if something is unclear.')
      .setRequired(true);

  // Responses spreadsheet
  var ss = SpreadsheetApp.create('Fractal Fusion, build log responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Email on every submission, with the JSON already assembled
  ScriptApp.newTrigger('onLogSubmit').forForm(form).onFormSubmit().create();

  Logger.log('');
  Logger.log('DONE. Save these three links.');
  Logger.log('  Fill in       : ' + form.getPublishedUrl());
  Logger.log('  Edit the form : ' + form.getEditUrl());
  Logger.log('  Responses     : ' + ss.getUrl());
  Logger.log('  Notifications : ' + NOTIFY);
  Logger.log('');
}


/**
 * Runs on every submission. Emails NOTIFY with the entry already shaped as the
 * object that goes into data/log.json, so transcribing is copy and paste.
 */
function onLogSubmit(e) {
  var answers = {};
  var files = [];

  var items = e.response.getItemResponses();
  for (var i = 0; i < items.length; i++) {
    var title = items[i].getItem().getTitle();
    var value = items[i].getResponse();

    if (title === 'Photos' && value && value.length) {
      for (var j = 0; j < value.length; j++) {
        try {
          var f = DriveApp.getFileById(value[j]);
          files.push(f.getName() + '  ' + f.getUrl());
        } catch (err) {
          files.push(String(value[j]));
        }
      }
    } else {
      answers[title] = value;
    }
  }

  var date  = toIsoDate(answers['Date']);
  var title = answers['Title'] || 'Untitled';
  var id    = date + '-' + slug(title);

  var entry = {
    id: id,
    date: date,
    topic: answers['Topic'] || 'Misc',
    title: title,
    summary: answers['One sentence summary'] || '',
    author: answers['Your name'] || '',
    body: paragraphs(answers['What happened'] || '')
  };

  var body = [
    'New build log entry from ' + (answers['Your name'] || 'someone') + '.',
    '',
    'Paste this into data/log.json, at the END of the list.',
    'Remember the comma after the entry above it.',
    '',
    JSON.stringify(entry, null, 2),
    ''
  ];

  if (files.length) {
    body.push('Photos to download, rename 01, 02, and put in files/img/log/' + id + '/');
    body.push('');
    body.push('Then put each one into body, at the point in the text it belongs to:');
    body.push('');
    body.push('  { "figure": "files/img/log/' + id + '/01.jpg",');
    body.push('    "alt": "what the picture shows",');
    body.push('    "caption": "what it does not show" }');
    body.push('');
    body.push('and add "thumb": { "src": "files/img/log/' + id + '/01.jpg" } for the card,');
    body.push('using whichever picture is most recognisable at card size.');
    body.push('');
    body.push(files.join('\n'));
  } else if (answers['Photo links']) {
    body.push('Photo links given:');
    body.push(answers['Photo links']);
  } else {
    body.push('No photos on this one, so the entry goes in exactly as above.');
  }

  MailApp.sendEmail({
    to: NOTIFY,
    subject: 'Build log: ' + title,
    body: body.join('\n')
  });
}


/* ---------- helpers ---------- */

/** Google hands back a Date or a locale string. The site needs YYYY-MM-DD. */
function toIsoDate(value) {
  var d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/** First few words of the title, lowercase, hyphen separated. */
function slug(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-') || 'entry';
}

/** Blank line separated text becomes one array item per paragraph. */
function paragraphs(text) {
  var parts = String(text).split(/\n\s*\n/);
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].replace(/\s+/g, ' ').trim();
    if (p) out.push(p);
  }
  return out.length ? out : [''];
}
