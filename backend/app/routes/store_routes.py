from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.app.models.models import Store, User

store_bp = Blueprint('stores', __name__)

@store_bp.route('', methods=['GET'])
def get_stores():
    """Get all stores"""
    stores = Store.query.all()
    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': [store.to_dict() for store in stores]
    })

@store_bp.route('/<int:store_id>', methods=['GET'])
def get_store(store_id):
    """Get a specific store"""
    store = Store.query.get_or_404(store_id)
    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': store.to_dict()
    })

@store_bp.route('', methods=['POST'])
@jwt_required()
def create_store():
    """Create a new store (global admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)
    
    # Check if user is global admin
    if not current_user.is_admin or current_user.managed_store_id is not None:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Global admin access required.'
        }), 200
    
    data = request.json
    required_fields = ('store_name', 'address', 'phone_number')
    if not data or not all(k in data for k in required_fields):
        return jsonify({
            'code': 400,
            'msg': f'Missing required fields: {", ".join(required_fields)}'
        }), 200
    
    store = Store(
        store_name=data['store_name'],
        address=data['address'],
        phone_number=data['phone_number']
    )
    
    db.session.add(store)
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': 'Store created successfully',
        'data': store.to_dict()
    })

@store_bp.route('/<int:store_id>', methods=['PUT'])
@jwt_required()
def update_store(store_id):
    """Update a store (global admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)
    
    # Check if user is global admin
    if not current_user.is_admin or current_user.managed_store_id is not None:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Global admin access required.'
        }), 200
    
    store = Store.query.get_or_404(store_id)
    data = request.json
    
    if 'store_name' in data:
        store.store_name = data['store_name']
    if 'address' in data:
        store.address = data['address']
    if 'phone_number' in data:
        store.phone_number = data['phone_number']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': 'Store updated successfully',
        'data': store.to_dict()
    })

@store_bp.route('/<int:store_id>', methods=['DELETE'])
@jwt_required()
def delete_store(store_id):
    """Delete a store (global admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)
    
    # Check if user is global admin
    if not current_user.is_admin or current_user.managed_store_id is not None:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Global admin access required.'
        }), 200
    
    store = Store.query.get_or_404(store_id)
    
    # Check if store has managers
    if store.managers:
        return jsonify({
            'code': 400,
            'msg': 'Cannot delete store with assigned managers'
        }), 200
    
    # Check if store has active rentals
    from backend.app.models.models import Rental
    active_rentals = Rental.query.filter(
        (Rental.rental_store_id == store_id) | (Rental.return_store_id == store_id)
    ).filter(Rental.rental_status.in_(['pending', 'active'])).first()
    
    if active_rentals:
        return jsonify({
            'code': 400,
            'msg': 'Cannot delete store with active rentals'
        }), 200
    
    db.session.delete(store)
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': 'Store deleted successfully'
    })

@store_bp.route('/<int:store_id>/managers', methods=['GET'])
@jwt_required()
def get_store_managers(store_id):
    """Get all managers for a store (admin only)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get_or_404(current_user_id)
    
    # Check if user is admin
    if not current_user.is_admin:
        return jsonify({
            'code': 403,
            'msg': 'Permission denied. Admin access required.'
        }), 200
    
    store = Store.query.get_or_404(store_id)
    managers = User.query.filter_by(managed_store_id=store_id, is_admin=True).all()
    
    return jsonify({
        'code': 200,
        'msg': 'Success',
        'data': [manager.to_dict() for manager in managers]
    })