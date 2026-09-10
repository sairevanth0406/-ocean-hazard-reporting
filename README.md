# 🌊 PRAVAAH

## Integrated Platform for Crowdsourced Ocean Hazard Reporting and Social Media Analytics

![PRAVAAH Banner](https://img.shields.io/badge/PRAVAAH-Ocean%20Hazard%20Intelligence-blue?style=for-the-badge)

> **Flowing Intelligence. Safer Coasts.**

PRAVAAH is an AI-powered disaster management platform designed to improve coastal safety and ocean hazard response through **crowdsourced reporting**, **real-time geospatial intelligence**, and **social media analytics**.

The platform enables citizens to report ocean hazards directly from mobile devices while government officials and analysts monitor live hazard maps, social media trends, hotspot regions, and automated alerts through a centralized dashboard.

---

# 📌 Problem Statement

India’s coastline is highly vulnerable to ocean hazards such as:

* 🌊 High Waves
* 🌪 Storm Surges
* 🌧 Coastal Flooding
* 🌊 Tsunami Events
* 🌊 Swell Surges

Existing systems mainly depend on satellite data, buoy networks, and predictive models, but lack:

* Real-time ground-level validation
* Citizen-generated reports
* Social media intelligence integration
* Unified disaster coordination tools

PRAVAAH bridges this gap using a unified AI-driven crowdsourcing platform.

---

# 🚀 Key Features

## 📱 Crowdsourced Hazard Reporting

* Geotagged hazard reporting
* Image & video upload support
* Offline report submission
* Automatic synchronization

## 🗺 Real-Time Geospatial Visualization

* Interactive hazard maps
* Live hotspot generation
* Severity-based overlays
* Location-based filtering

## 🤖 AI & NLP Analytics

* Sentiment analysis
* Hazard classification
* Keyword extraction
* Trend visualization

## 🚨 Alert & Notification System

* Automated multi-level alerts
* Real-time notifications
* Threshold-based escalation
* Dashboard alert monitoring

## 👥 Role-Based Access Control

* Citizens
* Government Officials
* Analysts
* Administrators

---

# 🏗 System Architecture

The platform is organized into multiple scalable layers:

```text
┌─────────────────────────────┐
│        Client Layer         │
│   React Dashboard           │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│        FastAPI Backend       │
│ Auth • Reports • Alerts      │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│     AI & NLP Processing      │
│ Sentiment • Classification   │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ PostgreSQL + PostGIS         │
│ SQLite Offline Storage       │
└─────────────────────────────┘
```

---

# 🛠 Technology Stack

| Category             | Technology               |
| -------------------- | ------------------------ |
| Web Dashboard        | React.js                 |
| Backend Framework    | FastAPI                  |
| Database             | PostgreSQL + PostGIS     |
| Offline Storage      | SQLite                   |
| Message Queue        | RabbitMQ                 |
| NLP Framework        | HuggingFace Transformers |
| Programming Language | Python                   |
| APIs                 | Twitter API, YouTube API |
| Deployment           | Docker                   |

---

# 📊 Functional Modules

## 1️⃣ User Authentication Module

Secure JWT-based authentication with role-based access control.

## 2️⃣ Hazard Reporting Module

Citizens submit hazard reports with:

* GPS location
* Images/videos
* Hazard type
* Severity level

## 3️⃣ Geospatial Analytics Module

Interactive maps powered by PostGIS for:

* Live report tracking
* Hotspot detection
* Cluster analysis

## 4️⃣ Social Media Intelligence Module

AI-driven NLP processing for:

* Sentiment analysis
* Hazard trend detection
* Keyword extraction
* Classification of disaster-related content

## 5️⃣ Alert Engine

Threshold-based real-time alert generation and notifications.

## 6️⃣ Offline Synchronization Module

Stores reports locally using SQLite and syncs automatically after internet restoration.

---

# 🧠 AI & NLP Features

PRAVAAH uses transformer-based NLP models for:

* Disaster text classification
* Sentiment analysis
* Trend detection
* Hazard signal extraction
* Social media intelligence

### Supported Hazard Categories

* High Waves
* Coastal Flooding
* Storm Surge
* Tsunami
* Abnormal Sea Conditions

---

# 📸 System Screenshots

## 🏠 Landing Page

* Modern coastal safety dashboard
* Real-time reporting access

## 📍 Hazard Reporting Interface

* GPS-enabled report submission
* Media upload support

## 📊 Analytics Dashboard

* Sentiment graphs
* Hazard trends
* Keyword analysis

## 🗺 Hotspot Visualization

* Dynamic heatmaps
* Severity overlays
* Geospatial monitoring

---

# 🔄 Offline Synchronization Workflow

```text
Citizen → Mobile App → SQLite Storage
                ↓
       Internet Restored
                ↓
        Sync Service → Backend
                ↓
     PostgreSQL + Dashboard
```

---

# 📈 Performance Metrics

| Metric                         | Result      |
| ------------------------------ | ----------- |
| Hazard Classification Accuracy | 93.7%       |
| Sentiment Analysis Accuracy    | 91.2%       |
| Average API Response Time      | 1.8 seconds |
| Alert Generation Time          | 4.1 seconds |
| Concurrent Users Supported     | 750+        |
| System Uptime                  | 99.4%       |

---

# 🔐 Security Features

* JWT Authentication
* HTTPS Encryption
* Role-Based Authorization
* Secure API Communication
* Data Validation & Sanitization

---

# 🌐 External Integrations

* Weather API
* RabbitMQ Messaging Queue

---

# 📂 Project Structure

```text
PRAVAAH/
│
├── frontend/
│   ├── React Dashboard
│   └── UI Components
│
├── backend/
│   ├── FastAPI Services
│   ├── NLP Engine
│   ├── Alert System
│   └── APIs
│
├── database/
│   ├── PostgreSQL
│   └── PostGIS
│
├── analytics/
│   ├── Sentiment Analysis
│   ├── Keyword Extraction
│   └── Classification Models
│
└── docker/
    └── Deployment Files
```

---

# ⚙️ Installation & Setup

## Clone Repository

```bash
git clone <your-repository-link>
cd PRAVAAH
```

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```


---

# 📚 Research Foundations

The project is inspired by research in:

* Crowdsourced disaster management
* Volunteered Geographic Information (VGI)
* NLP-based disaster intelligence
* Geospatial analytics systems
* Social media disaster monitoring

---

# 🔮 Future Enhancements

* INCOIS API Integration
* Multilingual NLP Support
* IoT & Satellite Data Fusion
* Predictive Hazard Forecasting
* Federated Machine Learning
* AR-Based Hazard Reporting
* Gamification for Citizen Engagement

---

# 👨‍💻 Team Members

| Name           | Role      |
| -------------- | --------- |
| B. Poornima    | Frontend Developer |
| K. Sai Revanth | Backend Developer  |
| Vaibhav Shahi  | AI & NLP Developer |

### Guided By

**Dr. Burugula Kezia Rani**
Associate Professor
Department of Information Technology
Vasavi College of Engineering

---

# 🏫 Institution

**Vasavi College of Engineering (Autonomous)**
Hyderabad, Telangana, India

---

# 📜 License

This project is developed for academic and research purposes under Theme Based Project (TBP).

---

# ⭐ PRAVAAH

> *Real-time Reporting • Social Intelligence • Faster Response • Safer Coasts*
