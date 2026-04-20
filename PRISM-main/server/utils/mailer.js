const nodemailer = require('nodemailer');

function getBaseUrl() {
  return (process.env.SURVEY_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the survey form HTML (email + standalone page).
 * @param {string} surveyId
 * @param {string} productName
 * @param {Array<{question:string,type:string}>} questions
 */
function buildSurveyFormHtml(surveyId, productName, questions) {
  const base = getBaseUrl();
  const action = `${base}/api/survey/respond/${surveyId}`;
  const q = questions.slice(0, 4);
  while (q.length < 4) {
    q.push({ question: 'Additional feedback', type: 'text' });
  }

  const blocks = [0, 1, 2, 3].map((i) => {
    const item = q[i];
    const label = escapeHtml(item.question);
    let inputs = '';
    if (item.type === 'rating') {
      inputs = [1, 2, 3, 4, 5]
        .map(
          (n, ri) =>
            `<label style="margin-right:10px;display:inline-block"><input type="radio" name="q${i}" value="${n}" ${ri === 0 ? 'required' : ''}> ${n}</label>`
        )
        .join('');
    } else if (item.type === 'yesno') {
      inputs =
        `<label style="margin-right:14px;display:inline-block"><input type="radio" name="q${i}" value="Yes" required> Yes</label>` +
        `<label style="display:inline-block"><input type="radio" name="q${i}" value="No"> No</label>`;
    } else {
      inputs = `<input type="text" name="q${i}" required style="width:100%;max-width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box" />`;
    }
    return `<div style="margin-bottom:22px">
  <div style="font-weight:600;margin-bottom:8px;font-size:15px">${label}</div>
  <div>${inputs}</div>
</div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Feedback — ${escapeHtml(productName)}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#fff;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <h1 style="font-size:18px;font-weight:600;margin:0 0 20px">Quick follow-up</h1>
    <p style="font-size:14px;line-height:1.5;color:#333;margin:0 0 24px">We would love a bit more detail about your experience with <strong>${escapeHtml(productName)}</strong>.</p>
    <form method="post" action="${escapeHtml(action)}" enctype="application/x-www-form-urlencoded">
${blocks}
      <button type="submit" style="margin-top:8px;padding:12px 24px;font-size:15px;font-weight:600;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer">Submit feedback</button>
    </form>
  </div>
</body>
</html>`;
}

let transporter;

/** Gmail App Passwords are 16 chars; users often paste with spaces — strip all whitespace. */
function smtpAuth() {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  return { user, pass };
}

function getTransporter() {
  if (!transporter) {
    const { user, pass } = smtpAuth();
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return transporter;
}

/** Call after .env reload if you change SMTP without restarting (tests). */
function resetTransporter() {
  transporter = null;
}

async function sendSurveyEmail(to, surveyId, productName, questions) {
  const html = buildSurveyFormHtml(surveyId, productName, questions);
  const { user } = smtpAuth();
  if (!user) {
    throw new Error('SMTP_USER is not set');
  }
  const transport = getTransporter();
  const subject = `Quick follow-up on your review of ${productName} — 45 seconds`;
  await transport.sendMail({
    from: `"PRISM" <${user}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendSurveyEmail, buildSurveyFormHtml, getBaseUrl, resetTransporter, smtpAuth };
