import nodemailer from "nodemailer";

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== "false"; // Default to true (SSL) for safety, disable if explicitly 'false'
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || user;
  const fromName = process.env.EMAIL_FROM_NAME || "Portfolio Website";

  // Check if SMTP is configured. If not, log a warning and proceed gracefully.
  if (!user || !pass) {
    console.warn(
      "⚠️ SMTP credentials (SMTP_USER/SMTP_PASS) are not configured. Email notification skipped."
    );
    return { success: false, reason: "SMTP credentials not configured" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`📨 Email sent successfully! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    // We throw the error so that the calling API route can log it, but the API handler
    // can decide whether to fail the response or handle it gracefully.
    throw error;
  }
}
