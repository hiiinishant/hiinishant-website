import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sendEmail } from "@/lib/mail";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  date: string;
}

const DATA_FILE = path.join(process.cwd(), "src/data/newsletter_subscribers.json");

function getSubscribers(): NewsletterSubscriber[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSubscribers(subscribers: NewsletterSubscriber[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(subscribers, null, 2), "utf-8");
}

// GET — list subscribers (admin only)
export async function GET() {
  const subscribers = getSubscribers();
  return NextResponse.json({ count: subscribers.length, subscribers });
}

// POST — subscribe a new email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const subscribers = getSubscribers();
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    if (subscribers.some((s) => s.email === normalizedEmail)) {
      return NextResponse.json(
        { success: true, message: "You're already subscribed! 🎉" },
        { status: 200 }
      );
    }

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: normalizedEmail,
      date: new Date().toISOString(),
    };

    subscribers.push(newSub);
    saveSubscribers(subscribers);

    // Try sending email notification to the site owner
    try {
      const emailTo = process.env.EMAIL_TO || "hiiinishant@gmail.com";
      await sendEmail({
        to: emailTo,
        subject: `New Newsletter Subscriber! 🎉`,
        text: `Great news! A new subscriber has joined your newsletter.

Details:
- Email: ${normalizedEmail}
- Date: ${newSub.date}

Total Subscribers: ${subscribers.length}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-top: 0;">New Newsletter Subscriber! 🎉</h2>
            <p style="font-size: 16px;">Someone has subscribed to updates on your portfolio website.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 150px; border-bottom: 1px solid #f0f0f0;">Subscriber Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${normalizedEmail}">${normalizedEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${new Date(newSub.date).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Total Subscribers:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><strong>${subscribers.length}</strong></td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
              Sent from your portfolio website.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send subscriber notification email:", emailErr);
    }

    return NextResponse.json(
      { success: true, message: "You're in! Welcome to the journey. 🚀" },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
