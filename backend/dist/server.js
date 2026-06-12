"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const mail_1 = require("./mail");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS and body parsing
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ─── Token Auth Helpers ──────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || "default-secret-key-12345";
function generateToken() {
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const payload = expiry.toString();
    const signature = crypto_1.default.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
    return Buffer.from(payload).toString("base64") + "." + signature;
}
function verifyToken(token) {
    try {
        const [payloadB64, signature] = token.split(".");
        if (!payloadB64 || !signature)
            return false;
        const payload = Buffer.from(payloadB64, "base64").toString("utf-8");
        const expiry = parseInt(payload, 10);
        if (expiry < Date.now())
            return false;
        const expectedSignature = crypto_1.default.createHmac("sha256", JWT_SECRET).update(payload).digest("hex");
        return signature === expectedSignature;
    }
    catch {
        return false;
    }
}
// Admin Authorization Middleware
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || req.headers["x-admin-token"];
    let token = "";
    if (typeof authHeader === "string") {
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        else {
            token = authHeader;
        }
    }
    if (token && verifyToken(token)) {
        next();
    }
    else {
        res.status(401).json({ error: "Unauthorized. Admin credentials required." });
    }
}
// ─── API endpoints ───────────────────────────────────────────────────────────
// ─── Auth ───
app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: "Password is required." });
    }
    // default to sha256 of "nishant2am" if environment variable ADMIN_PASSWORD is not set
    const expectedHash = process.env.ADMIN_PASSWORD || "c54dfd60e7552554703a55b3b1f5c6b97a22026858e9ad36cc2e9be49df0a5be";
    const computedHash = crypto_1.default.createHash("sha256").update(password).digest("hex");
    if (computedHash === expectedHash) {
        const token = generateToken();
        return res.json({ success: true, token });
    }
    else {
        return res.status(401).json({ error: "Incorrect password." });
    }
});
app.get("/api/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization || req.headers["x-admin-token"];
    let token = "";
    if (typeof authHeader === "string") {
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        else {
            token = authHeader;
        }
    }
    if (token && verifyToken(token)) {
        return res.json({ valid: true });
    }
    else {
        return res.status(401).json({ valid: false });
    }
});
// ─── Contact Messages ───
function getMessages() {
    const file = (0, db_1.getDataFilePath)("contact_messages.json");
    if (!fs_1.default.existsSync(file))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return [];
    }
}
function saveMessages(messages) {
    const file = (0, db_1.getDataFilePath)("contact_messages.json");
    fs_1.default.writeFileSync(file, JSON.stringify(messages, null, 2), "utf-8");
}
app.get("/api/contact", requireAdmin, (req, res) => {
    const messages = getMessages();
    const sorted = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(sorted);
});
app.post("/api/contact", async (req, res) => {
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
        const newMessage = {
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
            await (0, mail_1.sendEmail)({
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
        }
        catch (emailErr) {
            console.error("Failed to send contact notification email:", emailErr);
        }
        res.status(201).json({ success: true, message: "Message received! I'll get back to you soon." });
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to submit message." });
    }
});
app.patch("/api/contact", requireAdmin, (req, res) => {
    const { id } = req.body;
    if (!id)
        return res.status(400).json({ error: "ID required." });
    const messages = getMessages();
    const updated = messages.map((m) => m.id === id ? { ...m, read: true } : m);
    saveMessages(updated);
    res.json({ success: true });
});
app.delete("/api/contact", requireAdmin, (req, res) => {
    const { id } = req.body;
    if (!id)
        return res.status(400).json({ error: "ID required." });
    const messages = getMessages();
    const filtered = messages.filter((m) => m.id !== id);
    saveMessages(filtered);
    res.json({ success: true });
});
// ─── Newsletter ───
function getSubscribers() {
    const file = (0, db_1.getDataFilePath)("newsletter_subscribers.json");
    if (!fs_1.default.existsSync(file))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return [];
    }
}
function saveSubscribers(subs) {
    const file = (0, db_1.getDataFilePath)("newsletter_subscribers.json");
    fs_1.default.writeFileSync(file, JSON.stringify(subs, null, 2), "utf-8");
}
app.get("/api/newsletter", requireAdmin, (req, res) => {
    const subscribers = getSubscribers();
    res.json({ count: subscribers.length, subscribers });
});
app.post("/api/newsletter", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: "Email is required." });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Please enter a valid email address." });
        }
        const subscribers = getSubscribers();
        const normalizedEmail = email.trim().toLowerCase();
        if (subscribers.some((s) => s.email === normalizedEmail)) {
            return res.json({ success: true, message: "You're already subscribed! 🎉" });
        }
        const newSub = {
            id: `sub-${Date.now()}`,
            email: normalizedEmail,
            date: new Date().toISOString(),
        };
        subscribers.push(newSub);
        saveSubscribers(subscribers);
        // Try sending email
        try {
            const emailTo = process.env.EMAIL_TO || "hiiinishant@gmail.com";
            await (0, mail_1.sendEmail)({
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
        }
        catch (emailErr) {
            console.error("Failed to send subscriber notification email:", emailErr);
        }
        res.status(201).json({ success: true, message: "You're in! Welcome to the journey. 🚀" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Feed Updates ───
function getUpdates() {
    const file = (0, db_1.getDataFilePath)("updates.json");
    if (!fs_1.default.existsSync(file))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return [];
    }
}
function saveUpdates(updates) {
    const file = (0, db_1.getDataFilePath)("updates.json");
    fs_1.default.writeFileSync(file, JSON.stringify(updates, null, 2), "utf-8");
}
app.get("/api/updates", (req, res) => {
    const updates = getUpdates();
    const sorted = [...updates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(sorted);
});
app.post("/api/updates", requireAdmin, (req, res) => {
    try {
        const { category, title, description, date, href, badge, meta, isNew } = req.body;
        if (!category || !title || !description || !date) {
            return res.status(400).json({ error: "Category, Title, Description, and Date are required." });
        }
        const updates = getUpdates();
        const newUpdate = {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to add update" });
    }
});
app.delete("/api/updates", requireAdmin, (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return res.status(400).json({ error: "ID is required." });
        const updates = getUpdates();
        const filtered = updates.filter((u) => u.id !== id);
        if (filtered.length === updates.length) {
            return res.status(404).json({ error: "Update not found." });
        }
        saveUpdates(filtered);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to delete update" });
    }
});
// ─── Daily Status ───
function getDailyStatuses() {
    const file = (0, db_1.getDataFilePath)("daily_status.json");
    if (!fs_1.default.existsSync(file))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return [];
    }
}
function saveDailyStatuses(statuses) {
    const file = (0, db_1.getDataFilePath)("daily_status.json");
    fs_1.default.writeFileSync(file, JSON.stringify(statuses, null, 2), "utf-8");
}
app.get("/api/status", (req, res) => {
    const statuses = getDailyStatuses();
    const sorted = [...statuses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(sorted);
});
app.post("/api/status", requireAdmin, (req, res) => {
    try {
        const { date, statusText, tasks } = req.body;
        if (!date || !statusText || !Array.isArray(tasks)) {
            return res.status(400).json({ error: "Date, statusText, and tasks (array) are required." });
        }
        const statuses = getDailyStatuses();
        const existingIndex = statuses.findIndex((s) => s.date === date);
        let updatedStatus;
        if (existingIndex > -1) {
            updatedStatus = {
                ...statuses[existingIndex],
                statusText,
                tasks,
                updatedAt: new Date().toISOString(),
            };
            statuses[existingIndex] = updatedStatus;
        }
        else {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to save status" });
    }
});
app.delete("/api/status", requireAdmin, (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return res.status(400).json({ error: "Status ID is required." });
        const statuses = getDailyStatuses();
        const filtered = statuses.filter((s) => s.id !== id);
        if (filtered.length === statuses.length) {
            return res.status(404).json({ error: "Status entry not found." });
        }
        saveDailyStatuses(filtered);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to delete status entry" });
    }
});
// ─── Future Plans ───
function getPlans() {
    const file = (0, db_1.getDataFilePath)("future_plans.json");
    if (!fs_1.default.existsSync(file))
        return [];
    try {
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return [];
    }
}
function savePlans(plans) {
    const file = (0, db_1.getDataFilePath)("future_plans.json");
    fs_1.default.writeFileSync(file, JSON.stringify(plans, null, 2), "utf-8");
}
app.get("/api/future-plans", (req, res) => {
    res.json(getPlans());
});
app.post("/api/future-plans", requireAdmin, (req, res) => {
    try {
        const { title, description, targetDate, category, status } = req.body;
        if (!title || !description || !targetDate || !category || !status) {
            return res.status(400).json({ error: "All fields are required." });
        }
        const plans = getPlans();
        const newPlan = {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to add plan" });
    }
});
app.patch("/api/future-plans", requireAdmin, (req, res) => {
    try {
        const { id, status } = req.body;
        if (!id || !status)
            return res.status(400).json({ error: "ID and status required." });
        const plans = getPlans();
        const idx = plans.findIndex((p) => p.id === id);
        if (idx === -1)
            return res.status(404).json({ error: "Plan not found." });
        plans[idx].status = status;
        savePlans(plans);
        res.json(plans[idx]);
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to update plan" });
    }
});
app.delete("/api/future-plans", requireAdmin, (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return res.status(400).json({ error: "ID is required." });
        const plans = getPlans();
        const filtered = plans.filter((p) => p.id !== id);
        if (filtered.length === plans.length) {
            return res.status(404).json({ error: "Plan not found." });
        }
        savePlans(filtered);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to delete plan" });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
