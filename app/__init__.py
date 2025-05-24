from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO # Import SocketIO

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO() # Initialize SocketIO

import os

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_default_secret_key') # Load from env var
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your_default_jwt_secret_key') # Load from env var
    # Replace with your PostgreSQL connection string
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost/dbname')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Uploads configuration
    app.config['UPLOAD_FOLDER_IMAGES'] = os.path.join(app.root_path, 'static/uploads/images')
    app.config['UPLOAD_FOLDER_AUDIO'] = os.path.join(app.root_path, 'static/uploads/audio')
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'ogg'} # Added audio extensions

    # Ensure upload folders exist
    if not os.path.exists(app.config['UPLOAD_FOLDER_IMAGES']):
        os.makedirs(app.config['UPLOAD_FOLDER_IMAGES'])
    if not os.path.exists(app.config['UPLOAD_FOLDER_AUDIO']):
        os.makedirs(app.config['UPLOAD_FOLDER_AUDIO'])

    db.init_app(app)
    migrate.init_app(app, db)

    # It's good practice to register blueprints before models if models depend on app context indirectly
    # However, models need to be defined for migrations and db operations.
    # Ensuring models are imported so SQLAlchemy knows about them.
    from models.user import User
    from models.ticket import Ticket
    from models.message import Message
    from models.task import Task
    from models.mention import MessageMention
    from models.notification import Notification # Import Notification model

    from routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from routes.ticket import ticket_bp
    app.register_blueprint(ticket_bp, url_prefix='/api')

    from routes.chat import chat_bp # Import chat blueprint
    app.register_blueprint(chat_bp, url_prefix='/api')

    from routes.task import task_bp # Import task blueprint
    app.register_blueprint(task_bp, url_prefix='/api')

    from routes.upload import upload_bp # Import upload blueprint
    app.register_blueprint(upload_bp, url_prefix='/api')

    from routes.notification import notification_bp # Import notification blueprint
    app.register_blueprint(notification_bp, url_prefix='/api') # Register notification blueprint

    # Initialize SocketIO with the app
    # Ensure all routes are registered before initializing socketio if routes use socketio instance
    # Or ensure socketio is initialized in a way that it's accessible to blueprints.
    # The current setup (init here, then init_app(app)) is fine.
    socketio.init_app(app)

    # Import and initialize socket event handlers
    from sockets import init_socketio_handlers
    init_socketio_handlers(socketio)

    return app
