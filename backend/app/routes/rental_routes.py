from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models.models import Rental, User, Vehicle, Store, VehicleType
from backend.app.utils.rental_utils import check_overdue_rentals, check_rental_overdue
from datetime import datetime

rental_bp = Blueprint('rentals', __name__)

@rental_bp.route('', methods=['GET'])
@jwt_required()
def get_rentals():
    """Get rentals based on user role"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check for overdue rentals
    check_overdue_rentals()

    # If user is global admin, return all rentals
    if current_user.is_admin and current_user.managed_store_id is None:
        rentals = Rental.query.all()
    # If user is store admin, return rentals for their store
    elif current_user.is_admin and current_user.managed_store_id is not None:
        store_id = current_user.managed_store_id
        rentals = Rental.query.filter(
            (Rental.rental_store_id == store_id) | (Rental.return_store_id == store_id)
        ).all()
    # If user is regular user, return their rentals
    else:
        rentals = Rental.query.filter_by(user_id=current_user_id).all()

    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': [rental.to_dict() for rental in rentals]
    })

@rental_bp.route('/<int:rental_id>', methods=['GET'])
@jwt_required()
def get_rental(rental_id):
    """Get a specific rental"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    rental = Rental.query.get_or_404(rental_id)

    # Check if user has permission to view this rental
    if not current_user.is_admin and rental.user_id != current_user_id:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. You can only view your own rentals.'
        }), 200

    # If user is store admin, check if rental is from/to their store
    if current_user.is_admin and current_user.managed_store_id is not None:
        store_id = current_user.managed_store_id
        if rental.rental_store_id != store_id and rental.return_store_id != store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only view rentals from/to your store.'
            }), 200

    # Check if rental is overdue
    check_rental_overdue(rental)

    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': rental.to_dict()
    })

@rental_bp.route('', methods=['POST'])
@jwt_required()
def create_rental():
    """Create a new rental request"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    data = request.json
    required_fields = ('rental_store_id', 'expected_return_date', 'return_store_id', 'vehicle_type_id')
    if not data or not all(k in data for k in required_fields):
        return jsonify({
            'code': 400,
            'msg': f'Missing required fields: {", ".join(required_fields)}'
        }), 200

    # Check if stores exist
    rental_store = Store.query.get(data['rental_store_id'])
    return_store = Store.query.get(data['return_store_id'])
    if not rental_store or not return_store:
        return jsonify({
            'code': 404,
            'msg': 'Rental store or return store not found'
        }), 200

    # Check if vehicle type exists
    vehicle_type = VehicleType.query.get(data['vehicle_type_id'])
    if not vehicle_type:
        return jsonify({
            'code': 404,
            'msg': 'Vehicle type not found'
        }), 200

    # Parse and validate expected return date
    try:
        expected_return_date = datetime.strptime(data['expected_return_date'], '%Y-%m-%d').date()
        if expected_return_date < datetime.utcnow().date():
            return jsonify({
                'code': 400,
                'msg': 'Expected return date cannot be in the past'
            }), 200
    except ValueError:
        return jsonify({
            'code': 400,
            'msg': 'Invalid date format. Use YYYY-MM-DD'
        }), 200

    # Create rental with pending status (admin will assign vehicle later)
    rental = Rental(
        rental_date=datetime.utcnow().date(),
        rental_store_id=data['rental_store_id'],
        user_id=current_user_id,
        vehicle_id=-1,  # Use special pending vehicle ID (-1)
        vehicle_type_id=data['vehicle_type_id'],  # User's preferred vehicle type
        expected_return_date=expected_return_date,
        return_store_id=data['return_store_id'],
        rental_status='pending'
    )

    db.session.add(rental)
    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Rental request created successfully',
        'data': rental.to_dict()
    })

@rental_bp.route('/<int:rental_id>/approve', methods=['PUT'])
@jwt_required()
def approve_rental(rental_id):
    """Approve a rental request and assign a vehicle (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    # If store admin, check if rental is from their store
    if current_user.managed_store_id is not None:
        rental = Rental.query.get_or_404(rental_id)
        if rental.rental_store_id != current_user.managed_store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only approve rentals from your store.'
            }), 200

    data = request.json
    if not data or 'vehicle_id' not in data:
        return jsonify({
            'code': 400,
            'msg': 'Vehicle ID is required'
        }), 200

    # Check if vehicle exists
    vehicle = Vehicle.query.get(data['vehicle_id'])
    if not vehicle:
        return jsonify({
            'code': 404,
            'msg': 'Vehicle not found'
        }), 200

    # Check if vehicle is already rented
    active_rental = Rental.query.filter_by(vehicle_id=data['vehicle_id'], rental_status='active').first()
    if active_rental:
        return jsonify({
            'code': 400,
            'msg': 'Vehicle is already rented'
        }), 200

    rental = Rental.query.get_or_404(rental_id)

    # Check if rental is in pending status
    if rental.rental_status != 'pending':
        return jsonify({
            'code': 400,
            'msg': f'Cannot approve rental with status: {rental.rental_status}'
        }), 200

    # Check if vehicle type matches the requested vehicle type
    if vehicle.type_id != rental.vehicle_type_id:
        return jsonify({
            'code': 400,
            'msg': 'Vehicle type does not match the requested vehicle type'
        }), 200

    # Update rental with vehicle and change status to active
    rental.vehicle_id = data['vehicle_id']
    rental.rental_status = 'active'

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Rental approved successfully',
        'data': rental.to_dict()
    })

@rental_bp.route('/<int:rental_id>/return', methods=['PUT'])
@jwt_required()
def return_rental(rental_id):
    """Mark a rental as returned (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    rental = Rental.query.get_or_404(rental_id)

    # If store admin, check if rental is to their store
    if current_user.managed_store_id is not None and rental.return_store_id != current_user.managed_store_id:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. You can only process returns at your store.'
        }), 200

    # Check if rental is in active status
    if rental.rental_status != 'active':
        return jsonify({
            'code': 400,
            'msg': f'Cannot return rental with status: {rental.rental_status}'
        }), 200

    # Update rental status to returned and reset is_overdue
    rental.rental_status = 'returned'
    rental.is_overdue = False

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Rental returned successfully',
        'data': rental.to_dict()
    })

@rental_bp.route('/<int:rental_id>/extend', methods=['PUT'])
@jwt_required()
def request_extension(rental_id):
    """Request an extension for a rental"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    rental = Rental.query.get_or_404(rental_id)

    # Check if user owns this rental
    if rental.user_id != current_user_id:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. You can only extend your own rentals.'
        }), 200

    # Check if rental is in active status
    if rental.rental_status != 'active':
        return jsonify({
            'code': 400,
            'msg': f'Cannot extend rental with status: {rental.rental_status}'
        }), 200

    data = request.json
    if not data or 'expected_return_date' not in data:
        return jsonify({
            'code': 400,
            'msg': 'New expected return date is required'
        }), 200

    # Parse and validate new expected return date
    try:
        new_return_date = datetime.strptime(data['expected_return_date'], '%Y-%m-%d').date()
        if new_return_date <= rental.expected_return_date:
            return jsonify({
                'code': 400,
                'msg': 'New return date must be after current return date'
            }), 200
    except ValueError:
        return jsonify({
            'code': 400,
            'msg': 'Invalid date format. Use YYYY-MM-DD'
        }), 200

    # Update rental status to extension_requested and store new date
    rental.rental_status = 'extension_requested'
    # Store the requested new date in a temporary field or in a separate extension request table
    # For simplicity, we'll just update the expected return date directly
    rental.expected_return_date = new_return_date

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Extension requested successfully',
        'data': rental.to_dict()
    })

@rental_bp.route('/<int:rental_id>/approve-extension', methods=['PUT'])
@jwt_required()
def approve_extension(rental_id):
    """Approve an extension request (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    rental = Rental.query.get_or_404(rental_id)

    # If store admin, check if rental is from/to their store
    if current_user.managed_store_id is not None:
        if rental.rental_store_id != current_user.managed_store_id and rental.return_store_id != current_user.managed_store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only approve extensions for rentals from/to your store.'
            }), 200

    # Check if rental has an extension request
    if rental.rental_status != 'extension_requested':
        return jsonify({
            'code': 400,
            'msg': f'No extension request for rental with status: {rental.rental_status}'
        }), 200

    # Update rental status back to active (extension approved) and reset is_overdue
    rental.rental_status = 'active'
    rental.is_overdue = False

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Extension approved successfully',
        'data': rental.to_dict()
    })

@rental_bp.route('/<int:rental_id>/reject-extension', methods=['PUT'])
@jwt_required()
def reject_extension(rental_id):
    """Reject an extension request (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    rental = Rental.query.get_or_404(rental_id)

    # If store admin, check if rental is from/to their store
    if current_user.managed_store_id is not None:
        if rental.rental_store_id != current_user.managed_store_id and rental.return_store_id != current_user.managed_store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only reject extensions for rentals from/to your store.'
            }), 200

    # Check if rental has an extension request
    if rental.rental_status != 'extension_requested':
        return jsonify({
            'code': 400,
            'msg': f'No extension request for rental with status: {rental.rental_status}'
        }), 200

    data = request.json
    if not data or 'original_return_date' not in data:
        return jsonify({
            'code': 400,
            'msg': 'Original return date is required'
        }), 200

    # Parse original return date
    try:
        original_return_date = datetime.strptime(data['original_return_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({
            'code': 400,
            'msg': 'Invalid date format. Use YYYY-MM-DD'
        }), 200

    # Update rental status back to active and restore original return date
    rental.rental_status = 'active'
    rental.expected_return_date = original_return_date

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Extension rejected successfully',
        'data': rental.to_dict()
    })

@rental_bp.route('/<int:rental_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_rental(rental_id):
    """Cancel a rental (user can cancel pending, admin can cancel any)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    rental = Rental.query.get_or_404(rental_id)

    # Regular users can only cancel their own pending rentals
    if not current_user.is_admin:
        if rental.user_id != current_user_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only cancel your own rentals.'
            }), 200

        if rental.rental_status != 'pending':
            return jsonify({
                'code': 400,
                'msg': 'You can only cancel pending rentals.'
            }), 200

    # Store admins can only cancel rentals from/to their store
    if current_user.is_admin and current_user.managed_store_id is not None:
        if rental.rental_store_id != current_user.managed_store_id and rental.return_store_id != current_user.managed_store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only cancel rentals from/to your store.'
            }), 200

    # Cannot cancel already returned or cancelled rentals
    if rental.rental_status in ['returned', 'cancelled']:
        return jsonify({
            'code': 400,
            'msg': f'Cannot cancel rental with status: {rental.rental_status}'
        }), 200

    # Update rental status to cancelled and reset is_overdue
    rental.rental_status = 'cancelled'
    rental.is_overdue = False

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Rental cancelled successfully',
        'data': rental.to_dict()
    })
