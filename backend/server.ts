import './lib/env';
import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/db';
import { seedDatabase } from './lib/seed';

// Route imports
import authRoutes from './routes/auth';
import blogRoutes from './routes/blog';
import contactRoutes from './routes/contact';
import futurePlansRoutes from './routes/futurePlans';
import statusRoutes from './routes/status';
import updatesRoutes from './routes/updates';
import musicRoutes from './routes/music';
import newsletterRoutes from './routes/newsletter';
import galleryRoutes from './routes/gallery';
import uploadRoutes from './routes/upload';
import usersRoutes from './routes/users';
import resumeRoutes from './routes/resume';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://hiiinishant.com",
    "https://www.hiiinishant.com",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/future-plans', futurePlansRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/resume', resumeRoutes);

// Start server
const start = async () => {
  await connectDB();
  await seedDatabase();
  app.listen(port, () => {
    console.log("Backend server running on port " + port);
  });
};

start();
