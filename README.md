
# 💬 AI Chatbot Web App

A full-stack chatbot web application built with **React (Vite)** for the frontend and **Flask** for the backend, integrating **GROQ API** and **LangChain** to provide GPT-style AI responses. It offers user authentication, chat history, and profile management, all backed by a lightweight **SQLite** database.

---

## 🚀 Features

- 🧾 **User Registration & Login**  
  Secure authentication using email and password.

- 🔐 **Token-Based Authentication**  
  Session management powered by **JWT** (JSON Web Tokens).

- 💬 **GPT-Style Chat Interface**  
  Conversational UI where users can chat with the AI.

- 👤 **Profile View**  
  Logged-in users can view their basic profile information.

- 🕓 **Conversation History**  
  Stores and retrieves past messages per user session.

- 🤖 **GROQ API Integration**  
  Uses GROQ + OpenAI via LangChain to generate dynamic responses.

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ React (Vite)
- 🧠 TypeScript (optional)
- 🌐 Axios for API calls
- 🧾 JWT for session storage

### Backend
- 🐍 Flask (Python)
- 💾 SQLite (Django-style default DB for lightweight use)
- 🔐 Flask-JWT or similar for authentication
- 🧠 LangChain for LLM interaction
- 🤖 GROQ API for AI responses

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── app.py
│   ├── routes/
│   └── models/
├── frontend/
│   ├── src/
│   ├── pages/
│   └── components/
```

---

## 📦 Installation & Setup

### Backend (Flask)

```bash
cd backend
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
python app.py  # Runs the Flask server
```

### Frontend (React Vite)

```bash
cd frontend
npm install
npm run dev  # Runs the development server
```

---

## 🔑 API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/register`       | Register a new user            |
| POST   | `/api/login`          | Authenticate and return token  |
| POST   | `/api/chat`           | Send message, receive response |
| GET    | `/api/profile/<id>`   | Get profile info               |
| GET    | `/api/history/<id>`   | Get conversation history       |

---

## 🧠 How It Works

1. Users register or log in using email and password.
2. Auth token (JWT) is stored in localStorage.
3. User types a message into the chat UI.
4. Message is sent to Flask API, which stores it in SQLite.
5. The backend forwards the message to **LangChain + GROQ**, gets the AI response, and sends it back.
6. Both user and bot messages are stored and shown in conversation history.

---

## ✨ Acknowledgements

- [LangChain](https://www.langchain.com/)
- [GROQ API](https://groq.com/)
- [OpenAI](https://openai.com/)
- [Flask](https://flask.palletsprojects.com/)
- [React](https://react.dev/)
