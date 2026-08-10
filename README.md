<p align="center">
  <h1 align="center">🤖 Auto HR Hiring Software</h1>
  <p align="center">
    <strong>AI-Powered HR Hiring Platform — Automate Resume Screening, Job Management & Candidate Communication</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
    <img src="https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" alt="Elasticsearch" />
    <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
    <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  </p>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Data Retention Policy](#-data-retention-policy)
- [Docker (Elasticsearch)](#-docker-elasticsearch)
- [License](#-license)

---

## 🧠 Overview

**Auto HR Hiring Software** (codename: *Friday HR*) is a full-stack, AI-powered hiring platform that automates the end-to-end recruitment workflow — from posting jobs and parsing resumes to AI-driven candidate screening and automated email notifications.

Built with a **FastAPI** backend and a **React + TypeScript** frontend, it integrates cutting-edge AI services like **Google Gemini** for intelligent screening, **BGE-M3 embeddings** for semantic resume search, and **Elasticsearch** for blazing-fast full-text retrieval.

---

## ✨ Features

| Category | Feature |
|---|---|
| **Job Management** | Create, edit, close, and manage job postings with required skills and descriptions |
| **Resume Parsing** | Automated resume parsing via Affinda/RChilli — extracts skills, experience, education |
| **AI Screening** | Google Gemini-powered candidate scoring and fit analysis against job requirements |
| **Semantic Search** | BGE-M3 embeddings + Elasticsearch for intelligent resume matching and search |
| **Application Tracking** | Full application lifecycle — apply, review, shortlist, reject, hire |
| **HR Chatbot** | AI chatbot (Grok/xAI) for HR queries and candidate Q&A |
| **Email Notifications** | Automated emails via SMTP/SendGrid for application status updates |
| **Dashboard & Analytics** | HR dashboard with key metrics — applications, jobs, pipeline overview |
| **Auto Data Cleanup** | 7-day retention policy with scheduled background cleanup (APScheduler) |
| **Auth & Security** | JWT-based authentication with role-based access (HR / Candidate) |
| **File Management** | Secure resume upload, storage, download, and cleanup |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async Python web framework |
| **SQLAlchemy 2.0** | Async ORM with SQLite/PostgreSQL |
| **Pydantic v2** | Data validation & settings management |
| **Uvicorn** | ASGI server |
| **APScheduler** | Background job scheduling |
| **Elasticsearch 8.x** | Full-text search engine |
| **Sentence-Transformers** | BGE-M3 embeddings for semantic search |
| **Google Gemini** | AI-powered candidate screening |
| **Affinda** | Resume parsing API |
| **SendGrid / SMTP** | Email delivery |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library |
| **TypeScript** | Type-safe JavaScript |
| **Vite 8** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Lucide React** | Icon library |
| **React Router v7** | Client-side routing |

---

## 📁 Project Structure

```
Auto-HR-Hiring-Software/
├── 📄 .env.example              # Environment variables template
├── 📄 .gitignore                # Git ignore rules
├── 📄 docker-compose.yml        # Elasticsearch container setup
├── 📄 run.bat                   # One-click project launcher (Windows)
├── 📄 README.md                 # This file
│
├── 🔧 backend/                  # FastAPI Backend
│   ├── main.py                  # App entry point & lifespan events
│   ├── config.py                # Pydantic settings (loads .env)
│   ├── database.py              # Async SQLAlchemy engine & sessions
│   ├── requirements.txt         # Python dependencies
│   ├── test_email.py            # Email service test script
│   │
│   ├── models/                  # SQLAlchemy ORM Models
│   │   ├── __init__.py          # Model registry
│   │   ├── user.py              # User model (HR / Candidate roles)
│   │   ├── job.py               # Job posting model
│   │   ├── application.py       # Application model (links user → job)
│   │   └── resume.py            # Resume model (file metadata + parsed data)
│   │
│   ├── schemas/                 # Pydantic Request/Response Schemas
│   │   ├── __init__.py
│   │   ├── auth.py              # Login/Register schemas
│   │   ├── job.py               # Job CRUD schemas
│   │   ├── application.py       # Application schemas
│   │   ├── resume.py            # Resume schemas
│   │   └── chatbot.py           # Chatbot message schemas
│   │
│   ├── routers/                 # API Route Handlers
│   │   ├── __init__.py
│   │   ├── auth.py              # POST /auth/register, /auth/login
│   │   ├── jobs.py              # CRUD /jobs endpoints
│   │   ├── applications.py      # CRUD /applications endpoints
│   │   ├── resumes.py           # Upload/parse/download /resumes
│   │   ├── screening.py         # AI screening /screening endpoints
│   │   ├── chatbot.py           # HR chatbot /chatbot endpoints
│   │   └── dashboard.py         # Dashboard metrics /dashboard
│   │
│   ├── services/                # Business Logic Layer
│   │   ├── __init__.py
│   │   ├── auth_service.py      # JWT token creation & password hashing
│   │   ├── resume_parser.py     # Affinda/RChilli resume parsing
│   │   ├── screening_service.py # Google Gemini AI screening
│   │   ├── search_service.py    # Elasticsearch indexing & semantic search
│   │   ├── embedding_service.py # BGE-M3 embedding generation
│   │   ├── chatbot_service.py   # Grok/xAI chatbot integration
│   │   ├── email_service.py     # SMTP & SendGrid email delivery
│   │   └── retention_service.py # 7-day auto-cleanup background job
│   │
│   ├── middleware/              # Middleware
│   │   ├── __init__.py
│   │   └── auth.py              # JWT authentication middleware
│   │
│   ├── utils/                   # Utility Functions
│   │   ├── __init__.py
│   │   └── file_storage.py      # File upload/download/delete helpers
│   │
│   └── uploads/                 # Resume file storage (gitignored)
│
├── 🎨 frontend/                 # React + TypeScript Frontend
│   ├── index.html               # HTML entry point
│   ├── package.json             # Node.js dependencies
│   ├── package-lock.json        # Dependency lock file
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vite.config.ts           # Vite build configuration
│   │
│   ├── public/                  # Static assets
│   │
│   └── src/                     # Source code
│       ├── main.tsx             # React app bootstrap
│       ├── App.tsx              # Main application component
│       ├── style.css            # Global styles
│       ├── assets/              # Images & static assets
│       └── components/          # Reusable React components
│
└── 📂 scratch/                  # Temporary/dev files (gitignored)
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Docker** (optional — for Elasticsearch)

### 1. Clone the Repository

```bash
git clone https://github.com/mdaheer123-design/Auto-HR-Hiring-Software.git
cd Auto-HR-Hiring-Software
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your API keys and credentials
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start Elasticsearch (Optional)

```bash
docker-compose up -d
```

### 6. Run the Application

**Option A — One-Click Launcher (Windows):**
```bash
run.bat
```

**Option B — Manual Start:**

```bash
# Terminal 1: Backend
cd backend
python main.py
# → API running at http://127.0.0.1:56060

# Terminal 2: Frontend
cd frontend
npm run dev
# → App running at http://localhost:5173
```

### 7. Open the App

| Service | URL |
|---|---|
| **Frontend App** | [http://localhost:5173](http://localhost:5173) |
| **Backend API** | [http://127.0.0.1:56060](http://127.0.0.1:56060) |
| **Swagger Docs** | [http://127.0.0.1:56060/docs](http://127.0.0.1:56060/docs) |

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET_KEY` | Secret key for JWT token signing | ✅ |
| `DATABASE_URL` | Database connection string | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key (AI screening) | ✅ |
| `GROK_API_KEY` | xAI/Grok API key (chatbot) | ⬜ |
| `AFFINDA_API_KEY` | Affinda resume parser API key | ⬜ |
| `ELASTICSEARCH_URL` | Elasticsearch server URL | ⬜ |
| `SMTP_USER` / `SMTP_PASSWORD` | SMTP email credentials | ⬜ |
| `SENDGRID_API_KEY` | SendGrid email API key | ⬜ |
| `AUTO_CLEANUP_ENABLED` | Enable/disable 7-day auto cleanup | ⬜ |
| `AUTO_CLEANUP_DAYS` | Days before records are purged (default: 7) | ⬜ |

---

## 📡 API Documentation

Once the backend is running, explore the interactive API docs:

- **Swagger UI**: [http://127.0.0.1:56060/docs](http://127.0.0.1:56060/docs)
- **ReDoc**: [http://127.0.0.1:56060/redoc](http://127.0.0.1:56060/redoc)

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user (HR/Candidate) |
| `POST` | `/auth/login` | Login & receive JWT token |
| `GET` | `/jobs` | List all job postings |
| `POST` | `/jobs` | Create a job posting (HR only) |
| `POST` | `/applications` | Apply to a job |
| `PATCH` | `/applications/{id}/status` | Update application status (HR) |
| `POST` | `/resumes/upload` | Upload & parse a resume |
| `POST` | `/screening/score` | AI-score a candidate for a job |
| `POST` | `/chatbot/message` | Chat with HR AI assistant |
| `GET` | `/dashboard/stats` | Get dashboard metrics |

---

## 🗑 Data Retention Policy

The platform includes an **automated data retention system** powered by APScheduler:

- **Frequency**: Runs every **1 hour**
- **Retention Window**: **7 days** (configurable via `AUTO_CLEANUP_DAYS`)
- **What gets cleaned**:
  - ✅ Applications older than 7 days
  - ✅ Job postings older than 7 days (cascade-deletes linked applications)
  - ✅ Orphaned resumes — DB records, physical files, and Elasticsearch index entries

> ⚠️ **Note**: Set `AUTO_CLEANUP_ENABLED=false` in `.env` to disable automatic cleanup.

---

## 🐳 Docker (Elasticsearch)

The project includes a `docker-compose.yml` for running Elasticsearch locally:

```bash
# Start Elasticsearch
docker-compose up -d

# Check health
curl http://localhost:9200/_cluster/health

# Stop
docker-compose down
```

Elasticsearch enables **semantic resume search** using BGE-M3 embeddings. The platform works without it but with reduced search capabilities.

---

## 👤 Author

**Md Aheer** — [@mdaheer123-design](https://github.com/mdaheer123-design)

---

## 📄 License

This project is for educational and personal use.

---

<p align="center">
  Built with ❤️ using FastAPI, React, and AI
</p>
