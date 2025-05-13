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

@app.cli.command("create-pending-vehicle")
def create_pending_vehicle():
    """Create a special pending vehicle with ID -1."""
    from .app.models.models import Vehicle, VehicleType
    from datetime import datetime

    # Check if pending vehicle already exists
    pending_vehicle = Vehicle.query.filter_by(vehicle_id=-1).first()
    if pending_vehicle:
        print("Pending vehicle already exists.")
        return

    # Check if we have at least one vehicle type
    vehicle_type = VehicleType.query.first()
    if not vehicle_type:
        print("No vehicle types found. Please create at least one vehicle type first.")
        return

    # Create pending vehicle with ID -1
    pending_vehicle = Vehicle(
        vehicle_id=-1,
        type_id=vehicle_type.type_id,
        manufacture_date=datetime.utcnow().date()
    )

    db.session.add(pending_vehicle)
    db.session.commit()
    print("Pending vehicle created successfully with ID -1.")

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
        elif sys.argv[1] == 'create-pending-vehicle':
            with app.app_context():
                create_pending_vehicle()
    else:
        app.run(host='127.0.0.1', port=11451, debug=True)

if __name__ == '__main__':
    main()
