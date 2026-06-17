// Verifies the SMTP connection and sends one test email, so you can confirm the
// mail setup end-to-end after filling in SMTP_* in .env.
//
//   node scripts/send-test-email.js [recipient]
//
// Recipient defaults to SMTP_USER (sends to yourself).

import "dotenv/config";
import { sendEmail, verifyEmailTransport } from "../services/emailService.js";

const recipient = process.argv[2] || process.env.SMTP_USER;

const run = async () => {
  if (!recipient) {
    console.error("No recipient and SMTP_USER is unset. Pass an address.");
    process.exit(1);
  }

  const status = await verifyEmailTransport();

  if (status.configured === false) {
    console.error(
      "SMTP is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASS in backend/.env.",
    );
    process.exit(1);
  }

  if (!status.ok) {
    console.error(`SMTP connection failed: ${status.error}`);
    console.error(
      "For Gmail: enable 2-Step Verification and use a 16-char App Password (no spaces) as SMTP_PASS.",
    );
    process.exit(1);
  }

  console.log("SMTP connection OK. Sending test email...");

  const result = await sendEmail({
    to: recipient,
    subject: `${process.env.APP_NAME || "School Thrift"} — SMTP test`,
    text: "This is a test email confirming your SMTP setup works. If you can read this, real emails will send.",
  });

  if (result.sent) {
    console.log(`✓ Sent to ${recipient}. Check the inbox (and spam).`);
    process.exit(0);
  }

  console.error(`Send failed: ${result.reason}`);
  process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
