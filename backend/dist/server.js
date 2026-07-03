"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./lib/db");
const seed_1 = require("./lib/seed");
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const blog_1 = __importDefault(require("./routes/blog"));
const contact_1 = __importDefault(require("./routes/contact"));
const futurePlans_1 = __importDefault(require("./routes/futurePlans"));
const status_1 = __importDefault(require("./routes/status"));
const updates_1 = __importDefault(require("./routes/updates"));
const music_1 = __importDefault(require("./routes/music"));
const newsletter_1 = __importDefault(require("./routes/newsletter"));
const gallery_1 = __importDefault(require("./routes/gallery"));
const upload_1 = __importDefault(require("./routes/upload"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Mount routes
app.use('/api/auth', auth_1.default);
app.use('/api/blog', blog_1.default);
app.use('/api/contact', contact_1.default);
app.use('/api/future-plans', futurePlans_1.default);
app.use('/api/status', status_1.default);
app.use('/api/updates', updates_1.default);
app.use('/api/music', music_1.default);
app.use('/api/newsletter', newsletter_1.default);
app.use('/api/gallery', gallery_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/users', users_1.default);
// Start server
const start = async () => {
    await (0, db_1.connectDB)();
    await (0, seed_1.seedDatabase)();
    app.listen(port, () => {
        console.log("Backend server running on port " + port);
    });
};
start();
