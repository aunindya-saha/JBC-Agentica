from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import os
import requests
import psycopg2
from sqlalchemy import create_engine
from dotenv import load_dotenv
from flask_jwt_extended.exceptions import JWTExtendedException

load_dotenv()

app = Flask(__name__)

CORS(app,
     origins=os.getenv("ALLOWED_ORIGIN", "*"),
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

def _make_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dbname=os.getenv("DB_NAME", "postgres"),
        sslmode="require",
    )

app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql+psycopg2://"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'creator': _make_connection,
    'pool_pre_ping': True,
}
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=12)

db = SQLAlchemy(app)
jwt = JWTManager(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))


with app.app_context():
    db.create_all()


@app.route('/api/health', methods=['GET'])
def health():
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({'status': 'ok', 'db': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'db': str(e)}), 500


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
    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'Username already exists'}), 400
    user = User(username=username, password=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'Registration successful'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'msg': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token}), 200


def get_groq_response(messages_context, user_query):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    conversation = [{"role": "system", "content": "You are a helpful assistant."}]
    for msg in messages_context:
        role = "user" if msg.sender == "user" else "assistant"
        conversation.append({"role": role, "content": msg.message})
    conversation.append({"role": "user", "content": user_query})

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": conversation,
        "temperature": 1
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException:
        return "Sorry, I'm having trouble responding right now."


@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    user_id = get_jwt_identity()
    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({'msg': 'Message required'}), 400

    msg = Message(user_id=user_id, sender='user', message=user_message)
    db.session.add(msg)
    db.session.commit()

    recent = (
        Message.query
        .filter_by(user_id=user_id)
        .order_by(Message.timestamp.desc())
        .limit(10)
        .all()
    )
    recent = list(reversed(recent))

    bot_response = get_groq_response(recent[:-1], user_message)

    bot_msg = Message(user_id=user_id, sender='bot', message=bot_response)
    db.session.add(bot_msg)
    db.session.commit()

    return jsonify({'response': bot_response}), 200


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'msg': 'User not found'}), 404
    return jsonify({'username': user.username}), 200


@app.route('/api/history', methods=['GET'])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    messages = Message.query.filter_by(user_id=user_id).order_by(Message.timestamp).all()
    return jsonify({
        'history': [
            {'sender': m.sender, 'message': m.message, 'timestamp': m.timestamp.isoformat()}
            for m in messages
        ]
    }), 200


if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
