import nodemailer from "nodemailer";

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailParams) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromName = process.env.EMAIL_FROM_NAME || "Portfolio Website";

  // 1. Try Resend API if API Key is configured
  if (resendApiKey) {
    console.log("🚀 Sending email using Resend API...");
    // If using Resend sandbox/onboarding, default from is onboarding@resend.dev unless EMAIL_FROM is custom-set
    const defaultFrom = "onboarding@resend.dev";
    const from = process.env.EMAIL_FROM || defaultFrom;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `"${fromName}" <${from}>`,
          to: [to],
          subject,
          html,
          text,
          reply_to: replyTo,
        }),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(data?.message || `Resend API returned status ${response.status}`);
      }

      console.log(`📨 Email sent successfully via Resend! MessageId: ${data.id}`);
      return { success: true, messageId: data.id };
    } catch (error: any) {
      console.error("❌ Error sending email via Resend:", error);
      throw error;
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    console.warn(
      "⚠️ Neither Resend API Key nor SMTP credentials (SMTP_USER/SMTP_PASS) are configured. Email notification skipped."
    );
    return { success: false, reason: "No email service credentials configured" };
  }

  console.log("🔌 Sending email using Nodemailer SMTP...");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
      replyTo,
    });
    console.log(`📨 Email sent successfully via SMTP! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Error sending email via SMTP:", error);
    throw error;
  }
}

