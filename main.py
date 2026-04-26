import os
from flask import Flask, jsonify
from flask_restx import Api
from models import Recipe, User, Rating, Favorite
from exts import db
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from recipes import recipe_ns
from auth import auth_ns
from ratings import rating_ns
from flask_cors import CORS


def is_build_directory_exists():
    build_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "client", "build")
    return os.path.exists(build_dir)


def create_app(config):
    app = Flask(__name__, static_url_path="/", static_folder="./client/build")
    app.config.from_object(config)

    CORS(app)

    db.init_app(app)

    migrate = Migrate(app, db)
    JWTManager(app)

    api = Api(app, doc="/docs")

    api.add_namespace(recipe_ns)
    api.add_namespace(auth_ns)
    api.add_namespace(rating_ns)

    @app.route("/")
    def index():
        if not is_build_directory_exists():
            return jsonify({
                "message": "Frontend build directory not found. Please run 'npm run build' in client directory or rebuild Docker image.",
                "status": "build_missing"
            }), 503
        return app.send_static_file("index.html")

    @app.errorhandler(404)
    def not_found(err):
        if not is_build_directory_exists():
            return jsonify({
                "message": "Resource not found. Frontend build directory not available.",
                "status": "not_found"
            }), 404
        return app.send_static_file("index.html")

    @app.shell_context_processor
    def make_shell_context():
        return {"db": db, "Recipe": Recipe, "user": User, "Rating": Rating, "Favorite": Favorite}

    return app
