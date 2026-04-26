# ⚙️ Scholarship Aggregator - Technical Specification

## 📌 Overview
Defines database schema, APIs, and logic.

## 🗂️ Database Schema

### Users
- id (UUID)
- email
- created_at

### Preferences
- user_id
- countries[]
- fields[]
- degree_levels[]

### Scholarships
- id
- title
- country
- field
- degree_level
- deadline
- link

## 🔌 API Endpoints

GET /api/scholarships  
POST /api/scholarships  
GET /api/preferences  
POST /api/preferences  

## 🧠 Matching Logic
Match scholarships with user preferences.

## ⏰ Cron Jobs
Daily via GitHub Actions.

## 📧 Email System
Batch notifications per user.

## 🧰 Folder Structure
/app
/api
/lib
/scripts
