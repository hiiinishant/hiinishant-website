import nodemailer from "nodemailer";

export type EmailErrorKind = "configuration" | "authentication" | "connection" | "sending" | "unexpected";

export class EmailDeliveryError extends Error {
  readonly kind: EmailErrorKind;
  readonly code?: string;

  constructor(kind: EmailErrorKind, message: string, code?: string) {
    super(message);
    this.name = "EmailDeliveryError";
    this.kind = kind;
    this.code = code;
  }
}

function getSafeProviderError(error: any) {
  return {
    code: typeof error?.code === "string" ? error.code : "UNKNOWN",
    responseCode: typeof error?.responseCode === "number" ? error.responseCode : undefined,
    command: typeof error?.command === "string" ? error.command : undefined,
  };
}

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
    console.log("[Mail] Resend provider selected");
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

      console.log("[Mail] Resend request succeeded");
      return { success: true, messageId: data.id };
    } catch (error: any) {
      const providerError = getSafeProviderError(error);
      console.error("[Mail] Resend request failed:", providerError);
      throw new EmailDeliveryError("sending", "Resend email delivery failed", providerError.code);
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
    throw new EmailDeliveryError(
      "configuration",
      "SMTP_USER and SMTP_PASS must be configured for SMTP email delivery"
    );
  }

  console.log("[Mail] SMTP provider selected");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log("[Mail] SMTP transporter verification succeeded");
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
      replyTo,
    });
    console.log("[Mail] SMTP sendMail succeeded");
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    const providerError = getSafeProviderError(error);
    const code = providerError.code === "UNKNOWN" ? undefined : providerError.code;
    const kind: EmailErrorKind = code === "EAUTH"
      ? "authentication"
      : ["ECONNECTION", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH", "ECONNREFUSED"].includes(code || "")
        ? "connection"
        : "sending";
    console.error("[Mail] SMTP transporter/sendMail failed:", { kind, ...providerError });
    throw new EmailDeliveryError(kind, "SMTP email delivery failed", code);
  }
}

