# JBC-Agentica — AI Chatbot

A production-ready full-stack AI chatbot application. Users register, log in, and have persistent conversations with a Llama 4 model served via the GROQ API. All messages are stored per-user in PostgreSQL (Supabase).

---

## System Design

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                   React + Vite (SPA)                    │
│        Vercel CDN  ──  Static Asset Delivery            │
└───────────────────┬─────────────────────────────────────┘
                    │  HTTPS  (JWT in Authorization header)
                    ▼
┌─────────────────────────────────────────────────────────┐
│               Flask REST API  (Gunicorn)                 │
│                  Render Web Service                      │
│                                                         │
│  /api/register  ──  /api/login  (public)                │
│  /api/chat  ──  /api/profile  ──  /api/history          │
│  (JWT-protected)                                        │
│                                                         │
│              Flask-JWT-Extended validates               │
│              every protected request                    │
└──────────┬────────────────────────┬────────────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐     ┌──────────────────────┐
│  Supabase        │     │  GROQ API            │
│  PostgreSQL      │     │  Llama 4 Scout       │
│  (users +        │     │  17B model           │
│   messages)      │     │  chat completions    │
└──────────────────┘     └──────────────────────┘
```

### Data Flow — Sending a Message

1. User types a message and submits the chat form.
2. Frontend attaches the stored JWT from `localStorage` as `Authorization: Bearer <token>`.
3. Flask validates the JWT, extracts the `user_id` from the token payload.
4. The user message is saved to the `message` table.
5. The last 10 messages for that user are fetched to build conversation context.
6. The context + new message are forwarded to the GROQ API (Llama 4 Scout).
7. GROQ returns the AI response; it is saved to the database and returned to the frontend.
8. The frontend displays the response with a character-by-character typing animation.

### Database Schema

```
user
  id          INTEGER  PRIMARY KEY
  username    VARCHAR(80)  UNIQUE  NOT NULL
  password    VARCHAR(200)  NOT NULL  (bcrypt hash)

message
  id          INTEGER  PRIMARY KEY
  user_id     INTEGER  FK → user.id
  sender      VARCHAR(10)  ('user' | 'bot')
  message     TEXT  NOT NULL
  timestamp   DATETIME  (UTC)
```

---

## JWT Authentication

The app uses **Flask-JWT-Extended** for stateless authentication. Here is the complete lifecycle:

### 1. Token Generation (Login)

```
POST /api/login  { username, password }

Backend:
  1. Looks up the user by username
  2. Verifies the password against the bcrypt hash (Werkzeug check_password_hash)
  3. If valid → create_access_token(identity=str(user.id))
     - Identity: the user's database ID (string)
     - Expiry: 12 hours (JWT_ACCESS_TOKEN_EXPIRES)
     - Signed with: JWT_SECRET_KEY (HS256 by default)
  4. Returns { access_token: "<signed JWT>" }
```

### 2. Token Structure

A JWT has three base64url-encoded parts separated by dots:

```
HEADER.PAYLOAD.SIGNATURE

Header:  { "alg": "HS256", "typ": "JWT" }
Payload: { "sub": "42", "iat": 1234567890, "exp": 1234611090, "jti": "..." }
          └── user id ┘
Signature: HMAC-SHA256(header + "." + payload, JWT_SECRET_KEY)
```

The backend never stores tokens — only the secret key is needed to verify them.

### 3. Authenticated Requests

```
Frontend (all protected pages):
  token = localStorage.getItem('token')
  fetch('/api/chat', {
    headers: { Authorization: `Bearer ${token}` }
  })

Backend (@jwt_required() decorator):
  1. Extracts the token from the Authorization header
  2. Verifies the HMAC signature using JWT_SECRET_KEY
  3. Checks the expiry (exp claim)
  4. Calls get_jwt_identity() → returns "42" (the user ID string)
  5. Uses that ID for all database queries
```

### 4. Error Handling

| Scenario | HTTP Status | Behaviour |
|---|---|---|
| Missing token | 401 | `handle_jwt_errors` returns `{error: "jwt_error"}` |
| Expired token | 401 | Same handler; frontend removes token and redirects to `/` |
| Invalid signature | 401 | Same handler |

### 5. Logout

There is no server-side token revocation. Logout simply removes the token from `localStorage`:

```js
localStorage.removeItem('token');
window.location.href = '/';
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 6 |
| Styling | Tailwind CSS 4 + Chakra UI |
| Routing | React Router DOM 7 |
| Backend framework | Flask 3 (Python) |
| WSGI server | Gunicorn |
| Authentication | Flask-JWT-Extended (HS256 JWT) |
| Password hashing | Werkzeug (bcrypt) |
| ORM | Flask-SQLAlchemy |
| Database | PostgreSQL via Supabase |
| AI model | Llama 4 Scout 17B (GROQ API) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Database connectivity check |
| `POST` | `/api/register` | No | Create a new account |
| `POST` | `/api/login` | No | Authenticate, receive JWT |
| `POST` | `/api/chat` | JWT | Send message, get AI response |
| `GET` | `/api/profile` | JWT | Get current user's username |
| `GET` | `/api/history` | JWT | Get full message history |

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase project with a PostgreSQL database
- A GROQ API key (free at console.groq.com)

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in your values
cp .env.example .env

python app.py
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install

# Copy and fill in your values
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000

npm run dev
# Runs on http://localhost:5173
```

---

## Deployment

### Backend → Render

1. Push your code to GitHub (make sure `.env` is in `.gitignore`).
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repository, select the **`backend`** folder as the root directory.
4. Set the following:

   | Field | Value |
   |---|---|
   | **Runtime** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn --bind 0.0.0.0:$PORT app:app` |

5. Add all environment variables under **Environment**:

   ```
   GROQ_API_KEY        = your_groq_api_key
   JWT_SECRET_KEY      = a_long_random_string
   DB_HOST             = aws-x-region.pooler.supabase.com
   DB_PORT             = 5432
   DB_NAME             = postgres
   DB_USER             = postgres.your_project_ref
   DB_PASSWORD         = your_db_password
   ALLOWED_ORIGIN      = https://your-frontend.vercel.app
   ```

6. Click **Deploy**. Once live, copy your service URL (e.g. `https://jbc-agentica-api.onrender.com`).

> **Note:** Free-tier Render services spin down after 15 minutes of inactivity. The first request after a cold start may take ~30 seconds.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Vercel auto-detects Vite. Leave build settings as-is.
4. Add the environment variable:

   ```
   VITE_API_URL = https://jbc-agentica-api.onrender.com
   ```

   (Use the Render URL from the previous step — no trailing slash.)

5. Click **Deploy**.
6. Go back to Render and update `ALLOWED_ORIGIN` to your Vercel production URL, then redeploy the backend.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key from console.groq.com |
| `JWT_SECRET_KEY` | Secret for signing JWTs — use a long random string |
| `DB_HOST` | Supabase pooler hostname |
| `DB_PORT` | Database port (default: `5432`) |
| `DB_NAME` | Database name (default: `postgres`) |
| `DB_USER` | Database user (e.g. `postgres.projectref`) |
| `DB_PASSWORD` | Database password |
| `ALLOWED_ORIGIN` | Frontend URL for CORS (e.g. `https://your-app.vercel.app`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full URL of your backend (no trailing slash) |

---

## Security Notes

- Passwords are stored as bcrypt hashes — never in plaintext.
- JWTs are stateless and expire after 12 hours.
- CORS is restricted to the `ALLOWED_ORIGIN` value in production.
- The database connection uses `sslmode=require`.
- Never commit your `.env` file — it is listed in `.gitignore`.
- Rotate `JWT_SECRET_KEY` to invalidate all existing sessions if needed.
