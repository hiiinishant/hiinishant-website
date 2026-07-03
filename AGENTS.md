# AGENTS.md

# Hiii-Nishant

## Project Overview

Hiii-Nishant is a modern personal portfolio and engagement platform built around the digital identity of Nishant Kumar.

The goal is not only to showcase projects and achievements, but also to allow visitors to interact with Nishant through blogs, updates, playlists, contact forms, and a lightweight community platform.

The website should feel clean, premium, fast, responsive, and highly maintainable.

---

# Project Structure

```
frontend/
    Next.js

backend/
    Express.js
```

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* React Hook Form
* Zod
* Axios

---

## Backend

* Express.js
* TypeScript
* REST API
* Nodemailer
* Multer (if uploads are needed later)

---

## Database

Firebase

Use

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Firebase Admin SDK

---

# Deployment

Frontend

* Vercel

Backend

* Render

Firebase

* Authentication
* Firestore
* Storage

---

# Design Principles

The UI should feel

* Modern
* Premium
* Minimal
* Fast
* Accessible
* Mobile First

Support

* Light Mode
* Dark Mode

Animations should be subtle.

Never sacrifice performance for animations.

---

# Project Personas

## Visitor

Can

* Browse portfolio
* Read blogs
* View gallery
* View playlists
* Send contact form
* Read updates

Cannot

* Access admin
* Edit content

---

## Registered User

Can

* Login
* Create profile
* Comment
* Like
* Chat
* Follow updates

Cannot

* Access admin

---

## Admin

Nishant

Can

* Publish blogs
* Publish updates
* Manage playlists
* View messages
* Manage users
* Moderate community
* Manage gallery
* Manage homepage content

---

# Features

## Homepage

Contains

* Hero Section
* About
* Skills
* Projects
* Experience
* Achievements
* Featured Blog
* Featured Playlist
* Daily Updates
* Contact CTA

---

## About

Biography

Education

Journey

Mission

---

## Gallery

Image categories

* School
* College
* Trips
* Events
* Achievements
* Behind The Scenes

Optimized images

Lazy loading

Responsive

No downloads

---

## Blog

Dynamic blogging system

Markdown support

Categories

Tags

Featured image

Search

Reading time

SEO friendly

Admin publishing

Draft

Publish

Delete

Edit

---

## Daily Updates

Small content updates

Examples

* Today I shipped a feature.
* Working on authentication.
* Preparing a new vlog.

Reverse chronological order.

---

## Playlist Viewer

Embed official YouTube playlists.

Never host copyrighted music.

Support

* Playlist embed
* Featured playlist
* Playlist description

Admin can change playlist URL.

---

## Contact

Contact form

Fields

* Name
* Email
* Subject
* Message

Backend

Express

Nodemailer

Admin receives emails.

Show success confirmation.

---

## Community

Simple MVP

Authentication

Firebase Authentication

Profile

* Display Name
* Username
* Optional Bio
* Default Boy Avatar
* Default Girl Avatar

No custom avatars.

---

Posts

Text only

Maximum 500 characters

Like

Comment

No images

No videos

---

Chat

One-to-one chat

Realtime

Firestore

Messages stored permanently

Old conversations remain available

No

Voice

Video

Files

GIF

Stickers

Groups

---

Search

Search users

By

* Username
* Display Name

---

Notifications

* New message
* New comment
* New like

---

## Admin Dashboard

Dashboard

Statistics

Users

Blogs

Gallery

Playlists

Updates

Community

Contact Messages

---

Admin can

Delete posts

Delete comments

Block users

Manage blogs

Manage playlists

Publish updates

View analytics

---

# API Principles

REST API

JSON

Consistent response format

Proper HTTP status codes

Validation required

Never trust frontend input.

---

# Security

Sanitize all inputs.

Validate every request.

Protect admin routes.

Use Firebase Authentication.

Never expose secrets.

Use environment variables.

Enable rate limiting for public APIs.

---

# Performance

Use lazy loading.

Optimize images.

Code splitting.

Caching where appropriate.

Avoid unnecessary re-renders.

---

# Coding Standards

Use TypeScript everywhere.

Prefer functional components.

Keep components small.

Avoid duplicate logic.

Use reusable UI components.

Prefer composition over inheritance.

Never hardcode API URLs.

Use environment variables.

---

# Deployment

Frontend

Vercel

Backend

Render

Firebase

Production Project

---

# AI Coding Instructions

When modifying this project

* Preserve the existing design language.
* Do not break existing functionality.
* Prefer reusable components.
* Keep the code modular.
* Keep APIs documented.
* Follow accessibility best practices.
* Keep mobile responsiveness intact.
* Maintain consistent folder structure.
* Write clean, maintainable code.
* Do not introduce unnecessary dependencies.
* Explain major architectural changes before implementing them.

The goal is to build a premium personal engagement platform that can grow over time while remaining fast, secure, and easy to maintain.
