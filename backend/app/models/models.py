from datetime import datetime
from backend.app import db
from werkzeug.security import generate_password_hash, check_password_hash

class VehicleType(db.Model):
    """Vehicle Type Model"""
    __tablename__ = 'vehicle_types'

    type_id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(100), nullable=False)
    daily_rent_price = db.Column(db.Float, nullable=False)

    # Relationships
    vehicles = db.relationship('Vehicle', backref='type', lazy=True)
    rentals = db.relationship('Rental', backref='vehicle_type', lazy=True, foreign_keys='Rental.vehicle_type_id')

    def to_dict(self):
        return {
            'type_id': self.type_id,
            'brand': self.brand,
            'model': self.model,
            'daily_rent_price': self.daily_rent_price
        }

class Vehicle(db.Model):
    """Vehicle Model"""
    __tablename__ = 'vehicles'

    vehicle_id = db.Column(db.Integer, primary_key=True)
    type_id = db.Column(db.Integer, db.ForeignKey('vehicle_types.type_id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'), nullable=True)
    manufacture_date = db.Column(db.Date, nullable=False)

    # Relationships
    rentals = db.relationship('Rental', backref='vehicle', lazy=True)
    store = db.relationship('Store', backref='vehicles', lazy=True)

    def to_dict(self):
        return {
            'vehicle_id': self.vehicle_id,
            'type_id': self.type_id,
            'store_id': self.store_id,
            'manufacture_date': self.manufacture_date.strftime('%Y-%m-%d'),
            'type': self.type.to_dict() if self.type else None,
            'store': self.store.to_dict() if self.store else None
        }

class User(db.Model):
    """User Model"""
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    join_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    managed_store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'), nullable=True)

    # Authentication fields
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Relationships
    rentals = db.relationship('Rental', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        # Determine role based on is_admin and managed_store_id
        role = []
        if self.is_admin:
            if self.managed_store_id is None:
                role.append('super')  # System administrator
            else:
                role.append('admin')  # Store administrator
        else:
            role.append('user')  # Regular user

        return {
            'user_id': self.user_id,
            'name': self.name,
            'address': self.address,
            'phone_number': self.phone_number,
            'join_date': self.join_date.strftime('%Y-%m-%d'),
            'is_admin': self.is_admin,
            'managed_store_id': self.managed_store_id,
            'email': self.email,
            'role': role
        }

class Store(db.Model):
    """Store Model"""
    __tablename__ = 'stores'

    store_id = db.Column(db.Integer, primary_key=True)
    store_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)

    # Relationships
    managers = db.relationship('User', backref='managed_store', lazy=True)
    rental_from = db.relationship('Rental', foreign_keys='Rental.rental_store_id', backref='rental_store', lazy=True)
    rental_to = db.relationship('Rental', foreign_keys='Rental.return_store_id', backref='return_store', lazy=True)

    def to_dict(self):
        return {
            'store_id': self.store_id,
            'store_name': self.store_name,
            'address': self.address,
            'phone_number': self.phone_number
        }

class VehicleTransfer(db.Model):
    """Vehicle Transfer Model"""
    __tablename__ = 'vehicle_transfers'

    transfer_id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.vehicle_id'), nullable=False)
    source_store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'), nullable=False)
    destination_store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'), nullable=False)
    transfer_date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    transfer_status = db.Column(db.String(20), nullable=False, default='pending')  # pending, approved, completed, cancelled
    approved_by = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    completed_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.String(255), nullable=True)

    # Relationships
    vehicle = db.relationship('Vehicle', backref='transfers', lazy=True)
    source_store = db.relationship('Store', foreign_keys=[source_store_id], backref='outgoing_transfers', lazy=True)
    destination_store = db.relationship('Store', foreign_keys=[destination_store_id], backref='incoming_transfers', lazy=True)
    approver = db.relationship('User', backref='approved_transfers', lazy=True)

    def to_dict(self):
        return {
            'transfer_id': self.transfer_id,
            'vehicle_id': self.vehicle_id,
            'source_store_id': self.source_store_id,
            'destination_store_id': self.destination_store_id,
            'transfer_date': self.transfer_date.strftime('%Y-%m-%d'),
            'transfer_status': self.transfer_status,
            'approved_by': self.approved_by,
            'completed_date': self.completed_date.strftime('%Y-%m-%d') if self.completed_date else None,
            'notes': self.notes,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'source_store': self.source_store.to_dict() if self.source_store else None,
            'destination_store': self.destination_store.to_dict() if self.destination_store else None,
            'approver': self.approver.to_dict() if self.approver else None
        }

class Rental(db.Model):
    """Rental Model"""
    __tablename__ = 'rentals'

    rental_id = db.Column(db.Integer, primary_key=True)
    rental_date = db.Column(db.Date, nullable=False)
    rental_store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.vehicle_id'), nullable=True)  # Changed to nullable
    vehicle_type_id = db.Column(db.Integer, db.ForeignKey('vehicle_types.type_id'), nullable=True)  # Added field for user's preferred vehicle type
    expected_return_date = db.Column(db.Date, nullable=False)
    return_store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'), nullable=False)
    rental_status = db.Column(db.String(20), nullable=False, default='pending')  # pending, active, returned, cancelled, extension_requested
    is_overdue = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            'rental_id': self.rental_id,
            'rental_date': self.rental_date.strftime('%Y-%m-%d'),
            'rental_store_id': self.rental_store_id,
            'user_id': self.user_id,
            'vehicle_id': self.vehicle_id,
            'vehicle_type_id': self.vehicle_type_id,
            'expected_return_date': self.expected_return_date.strftime('%Y-%m-%d'),
            'return_store_id': self.return_store_id,
            'rental_status': self.rental_status,
            'is_overdue': self.is_overdue,
            'user': self.user.to_dict() if self.user else None,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'vehicle_type': self.vehicle_type.to_dict() if self.vehicle_type else None,
            'rental_store': self.rental_store.to_dict() if self.rental_store else None,
            'return_store': self.return_store.to_dict() if self.return_store else None
        }
