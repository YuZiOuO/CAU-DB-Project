from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_name='development'):
    app = Flask(__name__)

    # Load configuration
    if config_name == 'development':
        app.config.from_object('backend.config.DevelopmentConfig')
    elif config_name == 'production':
        app.config.from_object('backend.config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('backend.config.TestingConfig')

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Enable CORS
    CORS(app)

    # Register blueprints
    from backend.app.routes.vehicle_routes import vehicle_bp
    from backend.app.routes.user_routes import user_bp
    from backend.app.routes.store_routes import store_bp
    from backend.app.routes.rental_routes import rental_bp
    from backend.app.routes.vehicle_transfer_routes import vehicle_transfer_bp

    app.register_blueprint(vehicle_bp, url_prefix='/api/vehicles')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(store_bp, url_prefix='/api/stores')
    app.register_blueprint(rental_bp, url_prefix='/api/rentals')
    app.register_blueprint(vehicle_transfer_bp, url_prefix='/api/vehicle-transfers')

    # Create a route for testing the API
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': 'API is running'}

    return app
