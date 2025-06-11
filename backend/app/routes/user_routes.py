from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from backend.app import db
from backend.app.models.models import User
from datetime import datetime

user_bp = Blueprint("users", __name__)


@user_bp.route("/login", methods=["POST"])
def login():
    """User login endpoint"""
    data = request.json
    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"code": 400, "msg": "Missing email or password"}), 200

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"code": 401, "msg": "Invalid email or password"}), 200

    # Create tokens
    access_token = create_access_token(identity=user.user_id)
    refresh_token = create_refresh_token(identity=user.user_id)

    return jsonify(
        {
            "code": 200,
            "msg": "Login successful",
            "data": {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            },
        }
    )


@user_bp.route("/register", methods=["POST"])
def register():
    """User registration endpoint"""
    data = request.json
    required_fields = ("name", "email", "password", "address", "phone_number")
    if not data or not all(k in data for k in required_fields):
        return jsonify(
            {
                "code": 400,
                "msg": f"Missing required fields: {', '.join(required_fields)}",
            }
        ), 200

    # Check if email already exists
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"code": 409, "msg": "Email already registered"}), 200

    # Create new user
    user = User(
        name=data["name"],
        email=data["email"],
        address=data["address"],
        phone_number=data["phone_number"],
        join_date=datetime.utcnow().date(),
        is_admin=False,  # Default to regular user
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    # Create tokens
    access_token = create_access_token(identity=user.user_id)
    refresh_token = create_refresh_token(identity=user.user_id)

    return jsonify(
        {
            "code": 200,
            "msg": "Registration successful",
            "data": {
                "user": user.to_dict(),
                "access_token": access_token,
                "refresh_token": refresh_token,
            },
        }
    )


@user_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)

    # We shouldn't create a new refresh token each time
    # This could lead to an unlimited refresh token chain
    return jsonify(
        {"code": 200, "msg": "Token refreshed", "data": {"access_token": access_token}}
    )


@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    """Get current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)

    return jsonify({"code": 200, "msg": "Success", "data": user.to_dict()})


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Update current user profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.json

    # Update user fields
    if "name" in data:
        user.name = data["name"]
    if "address" in data:
        user.address = data["address"]
    if "phone_number" in data:
        user.phone_number = data["phone_number"]
    if "password" in data:
        user.set_password(data["password"])

    db.session.commit()

    return jsonify(
        {"code": 200, "msg": "Profile updated successfully", "data": user.to_dict()}
    )


@user_bp.route("", methods=["GET"])
@jwt_required()
def get_users():
    """Get all users (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify(
            {"code": 403, "msg": "Permission denied. Admin access required."}
        ), 200

    # Global admin can see all users
    if current_user.managed_store_id is None:
        users = User.query.all()
    # Store admin can see regular users (non-admin)
    else:
        users = User.query.filter_by(is_admin=False).all()

    return jsonify(
        {"code": 200, "msg": "Success", "data": [u.to_dict() for u in users]}
    )


@user_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    """Get a specific user (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify(
            {"code": 403, "msg": "Permission denied. Admin access required."}
        ), 200

    user = User.query.get_or_404(user_id)

    # Store admin can only view non-admin users
    if current_user.managed_store_id is not None and user.is_admin:
        return jsonify(
            {"code": 403, "msg": "Permission denied. You can only view regular users."}
        ), 200

    return jsonify({"code": 200, "msg": "Success", "data": user.to_dict()})


@user_bp.route("/<int:user_id>/permissions", methods=["PUT"])
@jwt_required()
def update_user_permissions(user_id):
    """Update user permissions (global admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is global admin
    if not current_user.is_admin or current_user.managed_store_id is not None:
        return jsonify(
            {"code": 403, "msg": "Permission denied. Global admin access required."}
        ), 200

    user = User.query.get_or_404(user_id)
    data = request.json

    if "is_admin" in data:
        user.is_admin = bool(data["is_admin"])

    if "managed_store_id" in data:
        if data["managed_store_id"] is not None:
            # Check if store exists
            from backend.app.models.models import Store

            store = Store.query.get(data["managed_store_id"])
            if not store:
                return jsonify({"code": 404, "msg": "Store not found"}), 200
        user.managed_store_id = data["managed_store_id"]

    db.session.commit()

    return jsonify(
        {
            "code": 200,
            "msg": "User permissions updated successfully",
            "data": user.to_dict(),
        }
    )
