from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import os
import requests
from dotenv import load_dotenv
from flask_jwt_extended.exceptions import JWTExtendedException


app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chatbot.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=12)  # Token expiration time

db = SQLAlchemy(app)
jwt = JWTManager(app)

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print("GROQ_API_KEY loaded:", GROQ_API_KEY)  # Debug: Remove in production

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False)  # 'user' or 'bot'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

def get_user_by_username(username):
    return User.query.filter_by(username=username).first()

@app.before_request
def create_tables():
    db.create_all()

@app.errorhandler(JWTExtendedException)
def handle_jwt_errors(e):
    return jsonify({'msg': str(e), 'error': 'jwt_error'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'msg': 'Username and password required'}), 400
    if get_user_by_username(username):
        return jsonify({'msg': 'Username already exists'}), 400
    hashed_pw = generate_password_hash(password)
    user = User(username=username, password=hashed_pw)
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'Registration successful'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = get_user_by_username(username)
    if not user or not check_password_hash(user.password, password):
        return jsonify({'msg': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token}), 200

def summarize_conversation(messages):
    summary = "\n".join([f"{msg.sender}: {msg.message}" for msg in messages])
    return summary

def format_prompt(summary, user_query):
    return (
        "You are a helpful assistant. "
        f"Here's the conversation so far: {summary}. "
        f"Now respond to this: {user_query}"
    )

def get_groq_response(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 1
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print("Groq API status:", response.status_code)  # Debug
        print("Groq API response:", response.text)      # Debug
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        print("Groq API error:", e)  # Debug
        return "Sorry, I'm having trouble responding right now."

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({'msg': 'Message required'}), 400
    
    print("User message:", user_message)  # Debug
    print("User ID:", user_id)  # Debug

    # 1. Save user message
    msg = Message(user_id=user_id, sender='user', message=user_message)
    db.session.add(msg)
    db.session.commit()

    # 2. Fetch last 5 messages (chronological order)
    messages = (
        Message.query
        .filter_by(user_id=user_id)
        .order_by(Message.timestamp.desc())
        .limit(5)
        .all()
    )
    messages = list(reversed(messages))

    # 3. Summarize conversation
    summary = summarize_conversation(messages)

    # 4. Format prompt
    prompt = format_prompt(summary, user_message)

    # 5. Get bot response
    bot_response = get_groq_response(prompt)

    # 6. Save bot message
    bot_msg = Message(user_id=user_id, sender='bot', message=bot_response)
    db.session.add(bot_msg)
    db.session.commit()

    # 7. Return to frontend
    return jsonify({'response': bot_response}), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({'username': user.username}), 200
from flask import current_app

@app.route('/api/history', methods=['GET'])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    messages = Message.query.filter_by(user_id=user_id).order_by(Message.timestamp).all()
    history = [{'sender': m.sender, 'message': m.message, 'timestamp': m.timestamp.isoformat()} for m in messages]
    return jsonify({'history': history}), 200
                    

if __name__ == '__main__':
    app.run(debug=True)
