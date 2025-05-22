from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models.models import VehicleType, Vehicle, Rental, User
from datetime import datetime
from functools import wraps

vehicle_bp = Blueprint("vehicles", __name__)


def admin_required(f):
    """Decorator to check if the current user is an admin"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)

        if not user.is_admin:
            return jsonify(
                {"code": 403, "msg": "Permission denied. Admin access required."}
            ), 200

        return f(*args, **kwargs)

    return decorated_function


# Vehicle Type Routes
@vehicle_bp.route("/types", methods=["GET"])
def get_vehicle_types():
    """Get all vehicle types"""
    vehicle_types = VehicleType.query.all()
    return jsonify(
        {"code": 200, "msg": "Success", "data": [vt.to_dict() for vt in vehicle_types]}
    )


@vehicle_bp.route("/types/<int:type_id>", methods=["GET"])
def get_vehicle_type(type_id):
    """Get a specific vehicle type"""
    vehicle_type = VehicleType.query.get_or_404(type_id)
    return jsonify({"code": 200, "msg": "Success", "data": vehicle_type.to_dict()})


@vehicle_bp.route("/types", methods=["POST"])
@jwt_required()
@admin_required
def create_vehicle_type():
    """Create a new vehicle type (admin only)"""
    data = request.json
    if not data or not all(k in data for k in ("brand", "model", "daily_rent_price")):
        return jsonify({"code": 400, "msg": "Missing required fields"}), 200

    vehicle_type = VehicleType(
        brand=data["brand"],
        model=data["model"],
        daily_rent_price=float(data["daily_rent_price"]),
    )

    db.session.add(vehicle_type)
    db.session.commit()

    return jsonify(
        {
            "code": 200,
            "msg": "Vehicle type created successfully",
            "data": vehicle_type.to_dict(),
        }
    )


@vehicle_bp.route("/types/<int:type_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_vehicle_type(type_id):
    """Update a vehicle type (admin only)"""
    vehicle_type = VehicleType.query.get_or_404(type_id)
    data = request.json

    if "brand" in data:
        vehicle_type.brand = data["brand"]
    if "model" in data:
        vehicle_type.model = data["model"]
    if "daily_rent_price" in data:
        vehicle_type.daily_rent_price = float(data["daily_rent_price"])

    db.session.commit()

    return jsonify(
        {
            "code": 200,
            "msg": "Vehicle type updated successfully",
            "data": vehicle_type.to_dict(),
        }
    )


@vehicle_bp.route("/types/<int:type_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_vehicle_type(type_id):
    """Delete a vehicle type (admin only)"""
    vehicle_type = VehicleType.query.get_or_404(type_id)

    # Check if there are vehicles of this type
    if vehicle_type.vehicles:
        return jsonify(
            {"code": 400, "msg": "Cannot delete vehicle type with associated vehicles"}
        ), 200

    db.session.delete(vehicle_type)
    db.session.commit()

    return jsonify({"code": 200, "msg": "Vehicle type deleted successfully"})


# Vehicle Routes
@vehicle_bp.route("", methods=["GET"])
@jwt_required()
@admin_required
def get_vehicles():
    """Get all vehicles (admin only)"""
    vehicles = Vehicle.query.all()
    return jsonify(
        {"code": 200, "msg": "Success", "data": [v.to_dict() for v in vehicles]}
    )


@vehicle_bp.route("/<int:vehicle_id>", methods=["GET"])
@jwt_required()
@admin_required
def get_vehicle(vehicle_id):
    """Get a specific vehicle (admin only)"""
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    return jsonify({"code": 200, "msg": "Success", "data": vehicle.to_dict()})


@vehicle_bp.route("", methods=["POST"])
@jwt_required()
@admin_required
def create_vehicle():
    """Create a new vehicle (admin only)"""
    data = request.json
    if not data or not all(
        k in data for k in ("type_id", "manufacture_date", "store_id")
    ):
        return jsonify(
            {
                "code": 400,
                "msg": "Missing required fields: type_id, manufacture_date, store_id",
            }
        ), 200

    # Check if vehicle type exists
    vehicle_type = VehicleType.query.get(data["type_id"])
    if not vehicle_type:
        return jsonify({"code": 404, "msg": "Vehicle type not found"}), 200

    # Check if store exists
    from backend.app.models.models import Store

    store = Store.query.get(data["store_id"])
    if not store:
        return jsonify({"code": 404, "msg": "Store not found"}), 200

    try:
        manufacture_date = datetime.strptime(
            data["manufacture_date"], "%Y-%m-%d"
        ).date()
    except ValueError:
        return jsonify({"code": 400, "msg": "Invalid date format. Use YYYY-MM-DD"}), 200

    vehicle = Vehicle(
        type_id=data["type_id"],
        store_id=data["store_id"],
        manufacture_date=manufacture_date,
    )

    db.session.add(vehicle)
    db.session.commit()

    return jsonify(
        {"code": 200, "msg": "Vehicle created successfully", "data": vehicle.to_dict()}
    )


@vehicle_bp.route("/<int:vehicle_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_vehicle(vehicle_id):
    """Update a vehicle (admin only)"""
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    data = request.json

    if "type_id" in data:
        # Check if vehicle type exists
        vehicle_type = VehicleType.query.get(data["type_id"])
        if not vehicle_type:
            return jsonify({"code": 404, "msg": "Vehicle type not found"}), 200
        vehicle.type_id = data["type_id"]

    if "manufacture_date" in data:
        try:
            vehicle.manufacture_date = datetime.strptime(
                data["manufacture_date"], "%Y-%m-%d"
            ).date()
        except ValueError:
            return jsonify(
                {"code": 400, "msg": "Invalid date format. Use YYYY-MM-DD"}
            ), 200

    if "store_id" in data:
        # Check if store exists
        from backend.app.models.models import Store

        store = Store.query.get(data["store_id"])
        if not store:
            return jsonify({"code": 404, "msg": "Store not found"}), 200

        # Check if vehicle is currently rented
        active_rental = Rental.query.filter_by(
            vehicle_id=vehicle_id, rental_status="active"
        ).first()
        if active_rental:
            return jsonify(
                {
                    "code": 400,
                    "msg": "Cannot change store of a vehicle that is currently rented",
                }
            ), 200

        # Check if there's a pending transfer for this vehicle
        from backend.app.models.models import VehicleTransfer

        pending_transfer = (
            VehicleTransfer.query.filter_by(vehicle_id=vehicle_id)
            .filter(VehicleTransfer.transfer_status.in_(["pending", "approved"]))
            .first()
        )
        if pending_transfer:
            return jsonify(
                {
                    "code": 400,
                    "msg": "Cannot change store of a vehicle that has a pending or approved transfer",
                }
            ), 200

        vehicle.store_id = data["store_id"]

    db.session.commit()

    return jsonify(
        {"code": 200, "msg": "Vehicle updated successfully", "data": vehicle.to_dict()}
    )


@vehicle_bp.route("/<int:vehicle_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_vehicle(vehicle_id):
    """Delete a vehicle (admin only)"""
    vehicle = Vehicle.query.get_or_404(vehicle_id)

    # Check if vehicle is currently rented
    active_rentals = (
        Rental.query.filter_by(vehicle_id=vehicle_id)
        .filter(Rental.rental_status.in_(["pending", "active"]))
        .first()
    )
    if active_rentals:
        return jsonify(
            {"code": 400, "msg": "Cannot delete vehicle with active rentals"}
        ), 200

    db.session.delete(vehicle)
    db.session.commit()

    return jsonify({"code": 200, "msg": "Vehicle deleted successfully"})
