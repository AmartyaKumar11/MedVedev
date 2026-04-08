# Medvedev — Setup & Run Guide

> Full-stack: **FastAPI (Python) backend** + **Next.js frontend**  
> Database: **PostgreSQL**

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | ≥ 3.10 | `python --version` |
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |
| PostgreSQL | ≥ 14 | `psql --version` |
| CUDA GPU | required by model_registry | `nvidia-smi` |

---

## 1 — Clone & enter the repo

```powershell
git clone <repo-url>
cd MedVedev
```

---

## 2 — Set up the database

### 2a. Create the database (run once)

Uses **PostgreSQL 17** running on port **5432**.

```powershell
$env:PGPASSWORD = '1234'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -p 5432 -h 127.0.0.1 -c "CREATE DATABASE medvedev;"
```

### 2b. Create backend\.env

Create the file `backend\.env` — or run this one-liner:

```powershell
Set-Content -Path "backend\.env" -Value "DATABASE_URL=postgresql://postgres:1234@127.0.0.1:5432/medvedev"
```

The file should contain:

```dotenv
DATABASE_URL=postgresql://postgres:1234@127.0.0.1:5432/medvedev
```

### 2c. Create required directories (run once)

```powershell
New-Item -ItemType Directory -Path "backend\output"    -Force | Out-Null
New-Item -ItemType Directory -Path "backend\temp_audio" -Force | Out-Null
```

---

## 3 — Backend setup

Run **once** to create the virtual environment and install packages:

```powershell
cd backend

# Create venv (skip if venv\ folder already exists)
python -m venv venv

# Activate venv
.\venv\Scripts\Activate.ps1

# Install all requirements
pip install -r requirements.txt

cd ..
```

---

## 4 — Frontend setup

Run **once** to install Node packages:

```powershell
cd web
npm install
cd ..
```

---

## 5 — Start everything (one command)

From the project root (`MedVedev\`):

```powershell
.\start-medvedev.ps1
```

This opens **two separate terminal windows**:

| Window | Command | URL |
|--------|---------|-----|
| Backend | `uvicorn app.main:app --reload` | http://127.0.0.1:8000 |
| Frontend | `npm run dev` | http://127.0.0.1:3000 |

> **Note:** PostgreSQL must be running before you start. On Windows it usually runs as a service automatically.

---

## 6 — Verify everything is working

```powershell
# Check backend health
Invoke-RestMethod http://127.0.0.1:8000/docs   # opens Swagger UI

# Check frontend
Start-Process "http://localhost:3000"
```

---

## 7 — Stop everything

```powershell
.\stop-medvedev.ps1
```

Or just close the two cmd windows that were opened.

---

## Troubleshooting

### `DATABASE_URL not set`
→ Make sure `backend\.env` exists with a valid `DATABASE_URL`.

### `CUDA required` (RuntimeError from model_registry)
→ The backend's ML models require an NVIDIA GPU with CUDA. Ensure your drivers and CUDA toolkit are installed (`nvidia-smi`).

### Port 5432 not reachable
→ Start the PostgreSQL Windows service:
```powershell
Start-Service -Name "postgresql-x64-17"
```

### `python venv not found`
→ Run step 3 first to create the virtual environment.

### Frontend port 3000 already in use
→ Next.js will automatically try port 3001, 3002, etc. Check the terminal output for the actual URL.

---

## Folder Structure

```
MedVedev/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── core/         # Config, JWT, dependencies
│   │   ├── db/           # SQLAlchemy models & session
│   │   ├── routers/      # doctor, patients, session endpoints
│   │   └── services/     # AI model registry, pipeline, auth
│   ├── requirements.txt
│   └── venv/             # Python virtual environment (gitignored)
├── web/                  # Next.js 16 frontend
│   ├── app/              # App Router pages
│   ├── components/       # UI components
│   └── lib/              # Utilities
├── start-medvedev.ps1    # Start both servers (Windows)
├── stop-medvedev.ps1     # Stop both servers (Windows)
└── SETUP.md              # This file
```
