# 🏗️ Scholarship Aggregator - System Architecture

## 📌 Overview
This document defines the system architecture for the Scholarship Aggregator Web App, optimized for:
- Zero cost (free-tier infrastructure)
- Scalability
- Maintainability
- Simplicity (lean MVP first)

## 🧱 High-Level Architecture
[ User Browser ]
        ↓
[ Next.js Frontend (Vercel) ]
        ↓
[ API Routes (Serverless Functions) ]
        ↓
[ Database (Supabase / Firebase) ]
        ↓
[ External Data Sources ]
        ↓
[ GitHub Actions (Cron Jobs) ]
        ↓
[ Email Service (Resend / SendGrid) ]

## ⚙️ Core Components
### Frontend Layer
- Next.js (React)
- Hosted on Vercel

### Backend Layer
- Next.js API Routes (serverless)

### Database Layer
- Supabase (PostgreSQL preferred)

### Authentication
- Supabase Auth / Firebase Auth

### Data Ingestion
- Manual (Admin)
- Automated via GitHub Actions

### Notification System
- Cron-triggered email alerts

## 🔄 Data Flow
Scholarships → DB → User → Notifications

## 🧠 Design Philosophy
- Keep it simple
- Stay free-first
- Scale later
