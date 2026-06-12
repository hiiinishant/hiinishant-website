import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { getDataFilePath } from "./db";
import { sendEmail } from "./mail";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and body parsing
app.use(cors());
app.use(express.json());

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface UpdateItem {
  id: string;
  category: "video" | "blog" | "achievement" | "announcement";
  title: string;
  description: string;
  date: string;
  href?: string;
  badge?: string;
  meta?: string;
  isNew?: boolean;
}

interface FuturePlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  category: "academic" | "business" | "community" | "general";
  status: "planned" | "in-progress" | "completed";
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

interface DailyStatus {
  id: string;
  date: string;
  statusText: string;
  tasks: string[];
  updatedAt: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  date: string;
}

// ─── Token Auth Helpers ──────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "default-secret-key-12345";

function generateToken(): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = expiry.toString();
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + signature;
}

function verifyToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return false;
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expiry = parseInt(payload, 10);
    if (expiry < Date.now()) return false;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

// Admin Authorization Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  let token = "";
  if (typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }

  if (token && verifyToken(token)) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Admin credentials required." });
  }
}

// ─── API endpoints ───────────────────────────────────────────────────────────

// ─── Auth ───
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Password is required." });
  }

  // default to sha256 of "nishant2am" if environment variable ADMIN_PASSWORD is not set
  const expectedHash = process.env.ADMIN_PASSWORD || "c54dfd60e7552554703a55b3b1f5c6b97a22026858e9ad36cc2e9be49df0a5be";
  const computedHash = crypto.createHash("sha256").update(password).digest("hex");

  if (computedHash === expectedHash) {
    const token = generateToken();
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ error: "Incorrect password." });
  }
});

app.get("/api/auth/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  let token = "";
  if (typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }

  if (token && verifyToken(token)) {
    return res.json({ valid: true });
  } else {
    return res.status(401).json({ valid: false });
  }
});

// ─── Contact Messages ───
function getMessages(): ContactMessage[] {
  const file = getDataFilePath("contact_messages.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveMessages(messages: ContactMessage[]) {
  const file = getDataFilePath("contact_messages.json");
  fs.writeFileSync(file, JSON.stringify(messages, null, 2), "utf-8");
}

app.get("/api/contact", requireAdmin, (req: Request, res: Response) => {
  const messages = getMessages();
  const sorted = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sorted);
});

app.post("/api/contact", async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
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

    // Try sending email
    try {
      const emailTo = process.env.EMAIL_TO || "hiiinishant@gmail.com";
      await sendEmail({
        to: emailTo,
        subject: `New Portfolio Message: ${subject.trim()}`,
        text: `You have received a new contact form submission on your portfolio website.\n\nDetails:\n- Name: ${name.trim()}\n- Email: ${email.trim()}\n- Subject: ${subject.trim()}\n- Date: ${newMessage.date}\n\nMessage:\n${message.trim()}`,
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
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send contact notification email:", emailErr);
    }

    res.status(201).json({ success: true, message: "Message received! I'll get back to you soon." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to submit message." });
  }
});

app.patch("/api/contact", requireAdmin, (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID required." });

  const messages = getMessages();
  const updated = messages.map((m) => m.id === id ? { ...m, read: true } : m);
  saveMessages(updated);
  res.json({ success: true });
});

app.delete("/api/contact", requireAdmin, (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID required." });

  const messages = getMessages();
  const filtered = messages.filter((m) => m.id !== id);
  saveMessages(filtered);
  res.json({ success: true });
});

// ─── Newsletter ───
function getSubscribers(): NewsletterSubscriber[] {
  const file = getDataFilePath("newsletter_subscribers.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveSubscribers(subs: NewsletterSubscriber[]) {
  const file = getDataFilePath("newsletter_subscribers.json");
  fs.writeFileSync(file, JSON.stringify(subs, null, 2), "utf-8");
}

app.get("/api/newsletter", requireAdmin, (req: Request, res: Response) => {
  const subscribers = getSubscribers();
  res.json({ count: subscribers.length, subscribers });
});

app.post("/api/newsletter", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const subscribers = getSubscribers();
    const normalizedEmail = email.trim().toLowerCase();

    if (subscribers.some((s) => s.email === normalizedEmail)) {
      return res.json({ success: true, message: "You're already subscribed! 🎉" });
    }

    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: normalizedEmail,
      date: new Date().toISOString(),
    };

    subscribers.push(newSub);
    saveSubscribers(subscribers);

    // Try sending email
    try {
      const emailTo = process.env.EMAIL_TO || "hiiinishant@gmail.com";
      await sendEmail({
        to: emailTo,
        subject: `New Newsletter Subscriber! 🎉`,
        text: `Great news! A new subscriber has joined your newsletter.\n\nDetails:\n- Email: ${normalizedEmail}\n- Date: ${newSub.date}\n\nTotal Subscribers: ${subscribers.length}`,
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
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send subscriber notification email:", emailErr);
    }

    res.status(201).json({ success: true, message: "You're in! Welcome to the journey. 🚀" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Feed Updates ───
function getUpdates(): UpdateItem[] {
  const file = getDataFilePath("updates.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveUpdates(updates: UpdateItem[]) {
  const file = getDataFilePath("updates.json");
  fs.writeFileSync(file, JSON.stringify(updates, null, 2), "utf-8");
}

app.get("/api/updates", (req: Request, res: Response) => {
  const updates = getUpdates();
  const sorted = [...updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sorted);
});

app.post("/api/updates", requireAdmin, (req: Request, res: Response) => {
  try {
    const { category, title, description, date, href, badge, meta, isNew } = req.body;
    if (!category || !title || !description || !date) {
      return res.status(400).json({ error: "Category, Title, Description, and Date are required." });
    }

    const updates = getUpdates();
    const newUpdate: UpdateItem = {
      id: `${category}-${Date.now()}`,
      category,
      title,
      description,
      date,
      href: href || undefined,
      badge: badge || undefined,
      meta: meta || undefined,
      isNew: isNew ?? true,
    };

    updates.push(newUpdate);
    saveUpdates(updates);
    res.status(201).json(newUpdate);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add update" });
  }
});

app.delete("/api/updates", requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required." });

    const updates = getUpdates();
    const filtered = updates.filter((u) => u.id !== id);

    if (filtered.length === updates.length) {
      return res.status(404).json({ error: "Update not found." });
    }

    saveUpdates(filtered);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete update" });
  }
});

// ─── Daily Status ───
function getDailyStatuses(): DailyStatus[] {
  const file = getDataFilePath("daily_status.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveDailyStatuses(statuses: DailyStatus[]) {
  const file = getDataFilePath("daily_status.json");
  fs.writeFileSync(file, JSON.stringify(statuses, null, 2), "utf-8");
}

app.get("/api/status", (req: Request, res: Response) => {
  const statuses = getDailyStatuses();
  const sorted = [...statuses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sorted);
});

app.post("/api/status", requireAdmin, (req: Request, res: Response) => {
  try {
    const { date, statusText, tasks } = req.body;
    if (!date || !statusText || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Date, statusText, and tasks (array) are required." });
    }

    const statuses = getDailyStatuses();
    const existingIndex = statuses.findIndex((s) => s.date === date);
    let updatedStatus: DailyStatus;

    if (existingIndex > -1) {
      updatedStatus = {
        ...statuses[existingIndex],
        statusText,
        tasks,
        updatedAt: new Date().toISOString(),
      };
      statuses[existingIndex] = updatedStatus;
    } else {
      updatedStatus = {
        id: `status-${Date.now()}`,
        date,
        statusText,
        tasks,
        updatedAt: new Date().toISOString(),
      };
      statuses.push(updatedStatus);
    }

    saveDailyStatuses(statuses);
    res.json(updatedStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save status" });
  }
});

app.delete("/api/status", requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Status ID is required." });

    const statuses = getDailyStatuses();
    const filtered = statuses.filter((s) => s.id !== id);

    if (filtered.length === statuses.length) {
      return res.status(404).json({ error: "Status entry not found." });
    }

    saveDailyStatuses(filtered);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete status entry" });
  }
});

// ─── Future Plans ───
function getPlans(): FuturePlan[] {
  const file = getDataFilePath("future_plans.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function savePlans(plans: FuturePlan[]) {
  const file = getDataFilePath("future_plans.json");
  fs.writeFileSync(file, JSON.stringify(plans, null, 2), "utf-8");
}

app.get("/api/future-plans", (req: Request, res: Response) => {
  res.json(getPlans());
});

app.post("/api/future-plans", requireAdmin, (req: Request, res: Response) => {
  try {
    const { title, description, targetDate, category, status } = req.body;
    if (!title || !description || !targetDate || !category || !status) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const plans = getPlans();
    const newPlan: FuturePlan = {
      id: `plan-${Date.now()}`,
      title,
      description,
      targetDate,
      category,
      status,
    };

    plans.push(newPlan);
    savePlans(plans);
    res.status(201).json(newPlan);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to add plan" });
  }
});

app.patch("/api/future-plans", requireAdmin, (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: "ID and status required." });

    const plans = getPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Plan not found." });

    plans[idx].status = status;
    savePlans(plans);
    res.json(plans[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update plan" });
  }
});

app.delete("/api/future-plans", requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required." });

    const plans = getPlans();
    const filtered = plans.filter((p) => p.id !== id);

    if (filtered.length === plans.length) {
      return res.status(404).json({ error: "Plan not found." });
    }

    savePlans(filtered);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete plan" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
