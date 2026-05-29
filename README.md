# 🌿 AromeTrack — Enterprise SCADA & IoT Dashboard

> **Cyberhack 2026** | PT. Sima Arome — Industrial IoT Platform for Essential Oil Manufacturing

[![AWS Amplify](https://img.shields.io/badge/Frontend-AWS%20Amplify-orange)](https://main.d2q768qid1m52n.amplifyapp.com)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20v24-green)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-blue)](https://supabase.com)
[![MQTT](https://img.shields.io/badge/Protocol-MQTT%20(Aedes)-purple)](https://github.com/moscajs/aedes)

---

## 📋 Overview

AromeTrack is a real-time Industrial IoT monitoring and SCADA (Supervisory Control and Data Acquisition) dashboard for essential oil/extract manufacturing. It provides:

- **Real-time Cold-Chain Monitoring** — Temperature telemetry from warehouse sensors (3s intervals)
- **AI-Powered Quality Control** — Automated visual inspection with probabilistic confidence scoring
- **Smart Warehouse Mapping** — 2D top-down floor plan with dynamic slot classification
- **Role-Based Access Control** — Plant Manager vs QC Inspector role separation
- **Live Analytics** — Chart.js temperature trend visualization with anomaly detection
- **Alert System** — Toast notifications for critical threshold breaches

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY (Frontend SPA)                     │
│  Vanilla JS + Tailwind CSS + Chart.js                            │
│  Login → Dashboard → Warehouse Map → QC Log → Analytics          │
└──────────────────────────────┬───────────────────────────────────┘
                               │ REST API (polling 3s)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NODE.JS BACKEND (Express.js)                    │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Auth     │  │ Data         │  │ MQTT Broker (Aedes)      │   │
│  │ (JWT)    │  │ Controller   │  │ Port 1883                │   │
│  └──────────┘  └──────────────┘  └─────────────────────────┘   │
│                        │                      │                   │
│                        ▼                      ▼                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │         AI Inference Engine (Probabilistic QC)           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                        │                                         │
│                        ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Supabase Client (@supabase/supabase-js)      │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                          │
│  telemetry_coldchain │ qc_inspections │ users                    │
└─────────────────────────────────────────────────────────────────┘
                               ▲
┌──────────────────────────────┴───────────────────────────────────┐
│                   ESP32 SIMULATOR (Node.js)                       │
│  coldChainSim.js (3s) │ qcLotSim.js (15s)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v24+ 
- npm or pnpm

### 1. Clone & Install
```bash
git clone <repo-url>
cd cyberhack

# Install backend dependencies
cd backend && npm install

# Install simulator dependencies  
cd ../simulator && npm install
```

### 2. Setup Database
```bash
cd backend
node scripts/setup-database.js   # Creates tables in Supabase
node scripts/seed-users.js       # Seeds demo users
```

### 3. Run the System
```bash
# Terminal 1: Start Backend (Express + MQTT Broker)
cd backend && npm start

# Terminal 2: Start Simulator (ESP32 Virtual Sensors)
cd simulator && node start-sim.js

# Terminal 3: Open Frontend
# Open frontend/index.html with Live Server or browse to localhost:5500
```

### 4. Login Credentials
| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin123` | Plant Manager | Full access (all tabs) |
| `inspector` | `inspector123` | QC Inspector | QC tab only |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user info |
| GET | `/api/data` | Public | Live sensor data (backward compat) |
| GET | `/api/telemetry/history?limit=50` | JWT | Historical temperature |
| GET | `/api/qc/history?limit=50` | JWT | Historical QC results |
| GET | `/api/stats` | JWT | Aggregated KPIs |
| GET | `/health` | Public | Health check |

---

## 🛡️ Security Features

- **JWT Authentication** — 24h token expiry, bcrypt password hashing
- **RBAC** — Role-based menu visibility and endpoint protection
- **CORS Whitelist** — Only allowed origins can access the API
- **RLS Policies** — Supabase Row-Level Security enabled on all tables

---

## 📊 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vanilla JS, Tailwind CSS, Chart.js | SPA Dashboard |
| Backend | Node.js, Express.js v5 | REST API Server |
| IoT Protocol | MQTT (Aedes v0.49) | Sensor Communication |
| Database | Supabase (PostgreSQL 14) | Persistent Storage |
| Auth | JWT + bcrypt | Authentication & RBAC |
| Hosting | AWS Amplify | Frontend CI/CD |
| AI Engine | Custom Probabilistic Model | QC Inspection |

---

## 🗺️ Enterprise Roadmap (Post-Hackathon)

### Phase 1: Hardware Integration
- ESP32 C++/Arduino firmware with DHT22/DS18B20 sensors
- MQTTS (TLS 1.2) with X.509 certificate authentication
- OTA firmware updates, deep sleep optimization

### Phase 2: Full IAM & Multi-Tenancy
- Supabase Auth with MFA
- Row-Level Security per plant/tenant
- Admin dashboard for user management

### Phase 3: Alerting & Notifications
- AWS SNS for email/SMS alerts
- Twilio WhatsApp integration
- Alert escalation rules (warn → critical → emergency)

### Phase 4: Cloud-Native Deployment
- Docker containerization of backend
- AWS ECS Fargate with auto-scaling
- CloudWatch monitoring + Grafana dashboards
- Blue/green deployment strategy

---

## 👥 Team

**Cyberhack 2026** — PT. Sima Arome Industrial IoT Division

---

## 📄 License

Proprietary — Cyberhack 2026 Competition Entry
