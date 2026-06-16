import nodemailer from "nodemailer";

// Builds a transporter only when SMTP is configured. If it isn't, the rest of
// the app keeps working and emails are logged to the console instead of sent —
// so admin approval never fails just because mail isn't set up yet.
let cachedTransporter;

const getTransporter = () => {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return cachedTransporter;
};

const sendEmail = async ({ to, subject, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      `[email] SMTP not configured — would send to ${to}: "${subject}"\n${text}`,
    );
    return { sent: false, reason: "smtp_not_configured" };
  }

  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    "no-reply@schoolthrift.local";

  try {
    await transporter.sendMail({ from, to, subject, text });
    console.log(`[email] sent to ${to}: "${subject}"`);
    return { sent: true };
  } catch (error) {
    // Never let a mail failure break the approval action.
    console.error(`[email] failed to send to ${to}: ${error.message}`);
    return { sent: false, reason: error.message };
  }
};

const appName = () => process.env.APP_NAME || "School Thrift";

const sendApprovalEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: `Your ${appName()} account has been approved`,
    text: `Hi ${user.full_name || "there"},

Good news — your ${appName()} registration has been approved. You can now log in and start using the app.

See you there,
The ${appName()} team`,
  });

const sendRejectionEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: `Update on your ${appName()} registration`,
    text: `Hi ${user.full_name || "there"},

Thank you for registering with ${appName()}. Unfortunately your registration was not approved at this time. If you believe this is a mistake, please contact your school.

The ${appName()} team`,
  });

// Sent to the buyer once payment is confirmed: their order is paid and they can
// present the reference(s) at the school to collect.
const sendCollectionReadyEmail = (order) => {
  const itemLines = (order.items || [])
    .map(
      (item) => `  • ${item.product_name} — ${item.product_reference_number}`,
    )
    .join("\n");

  return sendEmail({
    to: order.user_email,
    subject: `Your ${appName()} order ${order.order_reference} is ready to collect`,
    text: `Hi ${order.user_full_name || "there"},

Your payment for order ${order.order_reference} has been received.

Bring this order reference to ${order.institution_name} to collect your item(s):
${itemLines}

Order reference: ${order.order_reference}

Thanks,
The ${appName()} team`,
  });
};

export {
  sendApprovalEmail,
  sendCollectionReadyEmail,
  sendEmail,
  sendRejectionEmail,
};
