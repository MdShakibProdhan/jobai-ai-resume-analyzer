# JobAI — AI Job Application Assistant

A full-stack AI-powered app that helps you tailor resumes, score job fit, and practice mock interviews.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand + TanStack Query |
| Backend | Node.js, Express, TypeScript |
| AI | OpenAI GPT-4o / GPT-4o-mini |
| Database | PostgreSQL + Prisma (in-memory store for dev) |
| Auth | JWT + bcrypt |
| Validation | Zod (both sides) |

---

## Quick start

### 1. Prerequisites
- Node.js 20+
- npm 10+
- An OpenAI API key (get one at platform.openai.com)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure the backend
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set at minimum:
```
OPENAI_API_KEY=sk-your-key-here
JWT_SECRET=any-long-random-string
```

### 4. Start both servers
```bash
npm run dev
```

This starts:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## Project structure

```
jobai/
├── frontend/                  # React app
│   └── src/
│       ├── pages/             # One file per route
│       ├── components/
│       │   ├── ui/            # Reusable UI (Button, Input, Card…)
│       │   └── layout/        # AppLayout with sidebar
│       ├── store/             # Zustand stores
│       ├── lib/               # api.ts (Axios client), utils.ts
│       └── types/             # Shared TypeScript types
│
├── backend/                   # Express API
│   └── src/
│       ├── routes/            # auth, jobs, resume, analysis, interview
│       ├── controllers/       # Business logic per route
│       ├── services/
│       │   └── aiService.ts   # All OpenAI calls
│       ├── middleware/        # authenticate, validateBody, errorHandler
│       └── index.ts           # App entry point
│   └── prisma/
│       └── schema.prisma      # DB schema (connect when ready)
│
├── package.json               # npm workspaces root
└── jobai.code-workspace       # VS Code workspace file
```

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Overview, progress, quick actions |
| `/jobs` | Jobs | Add jobs manually or by URL scrape |
| `/jobs/:id` | Job detail | Full job view + skills |
| `/resume` | Resume | Drag-and-drop PDF/DOCX upload |
| `/analyze` | Analyze | Pick resume + job, trigger AI analysis |
| `/analysis/:id` | Results | Fit score, ATS score, skill gap, CV rewrite |
| `/interview/:id` | Interview | Live Q&A mock interview |
| `/interview/:id/result` | Result | Per-question scores + feedback |

---

## API endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |

### Jobs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/jobs` | List user's jobs |
| POST | `/api/jobs` | Create job manually |
| POST | `/api/jobs/scrape` | Scrape job from URL |
| DELETE | `/api/jobs/:id` | Delete job |

### Resume
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/resume/upload` | Upload PDF/DOCX |
| GET | `/api/resume` | List resumes |
| DELETE | `/api/resume/:id` | Delete resume |

### Analysis
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/analysis/analyze` | Run AI analysis |
| GET | `/api/analysis/:id` | Get results |
| POST | `/api/analysis/:id/improve-cv` | Generate improved CV |

### Interview
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/interview/start` | Start session |
| GET | `/api/interview/:id` | Get session state |
| POST | `/api/interview/:id/answer` | Submit answer |
| POST | `/api/interview/:id/end` | End + calculate score |

---

## Connecting PostgreSQL (optional)

The app runs fully in-memory for development. To persist data:

1. Set `DATABASE_URL` in `backend/.env`
2. Run migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```
3. Replace `// TODO: Replace with Prisma` comments in controllers with actual Prisma calls

---

## VS Code tips with Copilot

- Open `jobai.code-workspace` to get the full monorepo view
- Copilot works best with TypeScript — types are fully defined in `src/types/index.ts`
- Use Copilot Chat (`Ctrl+Shift+I`) to ask: *"implement the Prisma calls in authController"*
- The AI service in `backend/src/services/aiService.ts` has clear interfaces — Copilot can help extend them

---

## Next steps

- [ ] Connect PostgreSQL and replace in-memory stores
- [ ] Add Stripe billing for a Pro tier
- [ ] Add voice input using Web Speech API
- [ ] Add PDF export for the improved CV
- [ ] Add a browser extension for one-click job import
- [ ] Deploy: frontend to Vercel, backend to Railway or Render
