from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models.models import VehicleTransfer, Vehicle, User, Store
from datetime import datetime

vehicle_transfer_bp = Blueprint('vehicle_transfers', __name__)

@vehicle_transfer_bp.route('', methods=['GET'])
@jwt_required()
def get_transfers():
    """Get all vehicle transfers based on user role"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    # If user is global admin, return all transfers
    if current_user.managed_store_id is None:
        transfers = VehicleTransfer.query.all()
    # If user is store admin, return transfers for their store
    else:
        store_id = current_user.managed_store_id
        transfers = VehicleTransfer.query.filter(
            (VehicleTransfer.source_store_id == store_id) | (VehicleTransfer.destination_store_id == store_id)
        ).all()

    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': [transfer.to_dict() for transfer in transfers]
    })

@vehicle_transfer_bp.route('/<int:transfer_id>', methods=['GET'])
@jwt_required()
def get_transfer(transfer_id):
    """Get a specific vehicle transfer"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    transfer = VehicleTransfer.query.get_or_404(transfer_id)

    # If user is store admin, check if transfer is from/to their store
    if current_user.managed_store_id is not None:
        store_id = current_user.managed_store_id
        if transfer.source_store_id != store_id and transfer.destination_store_id != store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only view transfers from/to your store.'
            }), 200

    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': transfer.to_dict()
    })

@vehicle_transfer_bp.route('', methods=['POST'])
@jwt_required()
def create_transfer():
    """Initiate a vehicle transfer (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    data = request.json
    required_fields = ('vehicle_id', 'source_store_id', 'destination_store_id')
    if not data or not all(k in data for k in required_fields):
        return jsonify({
            'code': 400,
            'msg': f'Missing required fields: {", ".join(required_fields)}'
        }), 200

    # Check if vehicle exists
    vehicle = Vehicle.query.get(data['vehicle_id'])
    if not vehicle:
        return jsonify({
            'code': 404,
            'msg': 'Vehicle not found'
        }), 200

    # Check if stores exist
    source_store = Store.query.get(data['source_store_id'])
    destination_store = Store.query.get(data['destination_store_id'])
    if not source_store or not destination_store:
        return jsonify({
            'code': 404,
            'msg': 'Source store or destination store not found'
        }), 200

    # Check if source and destination are different
    if data['source_store_id'] == data['destination_store_id']:
        return jsonify({
            'code': 400,
            'msg': 'Source and destination stores must be different'
        }), 200

    # Check if vehicle is currently at the source store
    if vehicle.store_id != data['source_store_id']:
        return jsonify({
            'code': 400,
            'msg': 'Vehicle is not currently at the source store'
        }), 200

    # Check if vehicle is currently rented
    active_rental = vehicle.rentals and any(r.rental_status in ['pending', 'active'] for r in vehicle.rentals)
    if active_rental:
        return jsonify({
            'code': 400,
            'msg': 'Cannot transfer a vehicle that is currently rented or has a pending rental'
        }), 200

    # Check if vehicle already has a pending transfer
    pending_transfer = VehicleTransfer.query.filter_by(
        vehicle_id=data['vehicle_id'], 
        transfer_status='pending'
    ).first()
    if pending_transfer:
        return jsonify({
            'code': 400,
            'msg': 'Vehicle already has a pending transfer'
        }), 200

    # Create the transfer
    transfer = VehicleTransfer(
        vehicle_id=data['vehicle_id'],
        source_store_id=data['source_store_id'],
        destination_store_id=data['destination_store_id'],
        transfer_date=datetime.utcnow().date(),
        transfer_status='pending',
        notes=data.get('notes')
    )

    db.session.add(transfer)
    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Vehicle transfer initiated successfully',
        'data': transfer.to_dict()
    })

@vehicle_transfer_bp.route('/<int:transfer_id>/approve', methods=['PUT'])
@jwt_required()
def approve_transfer(transfer_id):
    """Approve a vehicle transfer (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    transfer = VehicleTransfer.query.get_or_404(transfer_id)

    # If user is store admin, check if they manage the source store
    if current_user.managed_store_id is not None and transfer.source_store_id != current_user.managed_store_id:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. You can only approve transfers from your store.'
        }), 200

    # Check if transfer is in pending status
    if transfer.transfer_status != 'pending':
        return jsonify({
            'code': 400,
            'msg': f'Cannot approve transfer with status: {transfer.transfer_status}'
        }), 200

    # Update transfer status to approved
    transfer.transfer_status = 'approved'
    transfer.approved_by = current_user_id

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Vehicle transfer approved successfully',
        'data': transfer.to_dict()
    })

@vehicle_transfer_bp.route('/<int:transfer_id>/complete', methods=['PUT'])
@jwt_required()
def complete_transfer(transfer_id):
    """Complete a vehicle transfer (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    transfer = VehicleTransfer.query.get_or_404(transfer_id)

    # If user is store admin, check if they manage the destination store
    if current_user.managed_store_id is not None and transfer.destination_store_id != current_user.managed_store_id:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. You can only complete transfers to your store.'
        }), 200

    # Check if transfer is in approved status
    if transfer.transfer_status != 'approved':
        return jsonify({
            'code': 400,
            'msg': f'Cannot complete transfer with status: {transfer.transfer_status}'
        }), 200

    # Update transfer status to completed
    transfer.transfer_status = 'completed'
    transfer.completed_date = datetime.utcnow().date()

    # Update vehicle's store_id
    vehicle = Vehicle.query.get(transfer.vehicle_id)
    vehicle.store_id = transfer.destination_store_id

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Vehicle transfer completed successfully',
        'data': transfer.to_dict()
    })

@vehicle_transfer_bp.route('/<int:transfer_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_transfer(transfer_id):
    """Cancel a vehicle transfer (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)

    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200

    transfer = VehicleTransfer.query.get_or_404(transfer_id)

    # If user is store admin, check if transfer is from/to their store
    if current_user.managed_store_id is not None:
        store_id = current_user.managed_store_id
        if transfer.source_store_id != store_id and transfer.destination_store_id != store_id:
            return jsonify({
                'code': 403,
                'msg': 'Permission denied. You can only cancel transfers from/to your store.'
            }), 200

    # Check if transfer is in pending or approved status
    if transfer.transfer_status not in ['pending', 'approved']:
        return jsonify({
            'code': 400,
            'msg': f'Cannot cancel transfer with status: {transfer.transfer_status}'
        }), 200

    # Update transfer status to cancelled
    transfer.transfer_status = 'cancelled'

    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': 'Vehicle transfer cancelled successfully',
        'data': transfer.to_dict()
    })