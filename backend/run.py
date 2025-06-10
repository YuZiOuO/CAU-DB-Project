# Fall back to relative import (for direct script execution)
from .app import create_app, db
import os

app = create_app(os.getenv('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    """Make shell context for Flask CLI."""
    from .app.models.models import VehicleType, Vehicle, User, Store, Rental
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
    from .app.models.models import User
    
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

def main():
    """Run the application or perform database operations based on command-line arguments."""
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == 'init-db':
            with app.app_context():
                db.create_all()
                print("Database initialized.")
        elif sys.argv[1] == 'create-admin':
            with app.app_context():
                create_admin()
    else:
        app.run(host='127.0.0.1', port=11451, debug=True)

if __name__ == '__main__':
    main()