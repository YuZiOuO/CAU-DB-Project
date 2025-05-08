from datetime import datetime
from backend.app import db
from backend.app.models.models import Rental

def check_overdue_rentals():
    """
    Check for overdue rentals and update the is_overdue field.
    This function should be called periodically or when retrieving rental information.
    """
    today = datetime.utcnow().date()
    
    # Find active rentals with expected return date before today
    overdue_rentals = Rental.query.filter(
        Rental.rental_status == 'active',
        Rental.expected_return_date < today,
        Rental.is_overdue == False
    ).all()
    
    # Update is_overdue field
    for rental in overdue_rentals:
        rental.is_overdue = True
    
    # Find active rentals with expected return date on or after today that were previously marked as overdue
    non_overdue_rentals = Rental.query.filter(
        Rental.rental_status == 'active',
        Rental.expected_return_date >= today,
        Rental.is_overdue == True
    ).all()
    
    # Update is_overdue field
    for rental in non_overdue_rentals:
        rental.is_overdue = False
    
    # Commit changes if any rentals were updated
    if overdue_rentals or non_overdue_rentals:
        db.session.commit()
    
    return len(overdue_rentals), len(non_overdue_rentals)

def check_rental_overdue(rental):
    """
    Check if a specific rental is overdue and update the is_overdue field if necessary.
    This function should be called when retrieving a specific rental.
    
    Args:
        rental: The rental object to check
        
    Returns:
        bool: True if the rental is overdue, False otherwise
    """
    if rental.rental_status != 'active':
        # Only active rentals can be overdue
        if rental.is_overdue:
            rental.is_overdue = False
            db.session.commit()
        return False
    
    today = datetime.utcnow().date()
    is_overdue = rental.expected_return_date < today
    
    # Update is_overdue field if necessary
    if is_overdue != rental.is_overdue:
        rental.is_overdue = is_overdue
        db.session.commit()
    
    return is_overdue