from backend.app import create_app, db
from backend.app.models.models import VehicleType, Vehicle, User, Store, Rental
import os

app = create_app(os.getenv('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    """Make shell context for Flask CLI."""
    return {
        'db': db,
        'VehicleType': VehicleType,
        'Vehicle': Vehicle,
        'User': User,
        'Store': Store,
        'Rental': Rental
    }

@app.cli.command("init-db")
def init_db():
    """Initialize the database."""
    db.create_all()
    print("Database initialized.")

@app.cli.command("create-admin")
def create_admin():
    """Create an admin user."""
    admin = User.query.filter_by(email='admin@example.com').first()
    if admin:
        print("Admin user already exists.")
        return
    
    admin = User(
        name='Admin',
        email='admin@example.com',
        address='Admin Address',
        phone_number='1234567890',
        is_admin=True,
        managed_store_id=None  # Global admin
    )
    admin.set_password('admin123')
    
    db.session.add(admin)
    db.session.commit()
    print("Admin user created successfully.")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)