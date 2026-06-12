import { NextResponse } from "next/server";
import fs from "fs";
import { sendEmail } from "@/lib/mail";
import { getDataFilePath } from "@/lib/db";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

const DATA_FILE = getDataFilePath("contact_messages.json");

function getMessages(): ContactMessage[] {
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

function saveMessages(messages: ContactMessage[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

// GET — list all messages (for admin dashboard)
export async function GET() {
  const messages = getMessages();
  const sorted = [...messages].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return NextResponse.json(sorted);
}

// POST — submit a new contact message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const messages = getMessages();
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      date: new Date().toISOString(),
      read: false,
    };

    messages.push(newMessage);
    saveMessages(messages);

    // Try sending email notification
    try {
      const emailTo = process.env.EMAIL_TO || "hiiinishant@gmail.com";
      await sendEmail({
        to: emailTo,
        subject: `New Portfolio Message: ${subject.trim()}`,
        text: `You have received a new contact form submission on your portfolio website.

Details:
- Name: ${name.trim()}
- Email: ${email.trim()}
- Subject: ${subject.trim()}
- Date: ${newMessage.date}

Message:
${message.trim()}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
            <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-top: 0;">New Contact Form Submission</h2>
            <p style="font-size: 16px;">You have received a new message from your portfolio contact form.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 100px; border-bottom: 1px solid #f0f0f0;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${name.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email.trim()}">${email.trim()}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Subject:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${subject.trim()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">${new Date(newMessage.date).toLocaleString()}</td>
              </tr>
            </table>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; border-left: 4px solid #6366f1; margin-top: 15px;">
              <h4 style="margin: 0 0 10px 0; color: #555;">Message:</h4>
              <p style="margin: 0; white-space: pre-wrap; color: #444;">${message.trim()}</p>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
              Sent from your portfolio website.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send contact notification email:", emailErr);
    }

    return NextResponse.json(
      { success: true, message: "Message received! I'll get back to you soon." },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send message." },
      { status: 500 }
    );
  }
}

// PATCH — mark a message as read
export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

    const messages = getMessages();
    const updated = messages.map((m) =>
      m.id === id ? { ...m, read: true } : m
    );
    saveMessages(updated);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove a message
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

    const messages = getMessages();
    const filtered = messages.filter((m) => m.id !== id);
    saveMessages(filtered);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
