# Car Rental System Backend

This is the backend for the Car Rental System, built with Flask, SQLAlchemy, and JWT authentication.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up PostgreSQL:
   - Install PostgreSQL if not already installed
   - Create the necessary databases:
     ```
     createdb car_rental_dev
     createdb car_rental_test
     createdb car_rental_prod
     ```
   - Or configure your own PostgreSQL connection by setting the DATABASE_URL environment variable:
     ```
     export DATABASE_URL="postgresql://username:password@localhost/dbname"
     ```

5. Initialize the database:
   ```
   flask --app backend.run init-db
   ```

6. Create an admin user:
   ```
   flask --app backend.run create-admin
   ```

7. Run the application:
   ```
   python -m backend.run
   ```

The server will start at http://localhost:5000.

## API Documentation

All API endpoints return JSON responses with the following structure:
```json
{
  "code": 200,
  "msg": "Success message",
  "data": {}
}
```

Even for error responses, the HTTP status code is 200, but the `code` field in the JSON response will indicate the actual status (e.g., 400, 403, 404).

### Authentication

#### Login
- **URL**: `/api/users/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "code": 200,
    "msg": "Login successful",
    "data": {
      "user": {
        "user_id": 1,
        "name": "User Name",
        "email": "user@example.com",
        "address": "User Address",
        "phone_number": "1234567890",
        "join_date": "2023-01-01",
        "is_admin": false,
        "managed_store_id": null,
        "role": ["user"]
      },
      "access_token": "jwt_access_token",
      "refresh_token": "jwt_refresh_token"
    }
  }
  ```

#### Register
- **URL**: `/api/users/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "New User",
    "email": "newuser@example.com",
    "password": "password123",
    "address": "User Address",
    "phone_number": "1234567890"
  }
  ```
- **Response**: Similar to login response

### Vehicle Types

#### Get All Vehicle Types
- **URL**: `/api/vehicles/types`
- **Method**: `GET`
- **Auth**: None
- **Response**:
  ```json
  {
    "code": 200,
    "msg": "Success",
    "data": [
      {
        "type_id": 1,
        "brand": "Toyota",
        "model": "Camry",
        "daily_rent_price": 50.0
      }
    ]
  }
  ```

#### Create Vehicle Type (Admin only)
- **URL**: `/api/vehicles/types`
- **Method**: `POST`
- **Auth**: Admin
- **Body**:
  ```json
  {
    "brand": "Honda",
    "model": "Civic",
    "daily_rent_price": 45.0
  }
  ```

### Vehicles

#### Get All Vehicles (Admin only)
- **URL**: `/api/vehicles`
- **Method**: `GET`
- **Auth**: Admin

#### Create Vehicle (Admin only)
- **URL**: `/api/vehicles`
- **Method**: `POST`
- **Auth**: Admin
- **Body**:
  ```json
  {
    "type_id": 1,
    "manufacture_date": "2020-01-01"
  }
  ```

### Stores

#### Get All Stores
- **URL**: `/api/stores`
- **Method**: `GET`
- **Auth**: None

#### Create Store (Global Admin only)
- **URL**: `/api/stores`
- **Method**: `POST`
- **Auth**: Global Admin
- **Body**:
  ```json
  {
    "store_name": "Downtown Branch",
    "address": "123 Main St",
    "phone_number": "1234567890"
  }
  ```

### Rentals

#### Get User Rentals
- **URL**: `/api/rentals`
- **Method**: `GET`
- **Auth**: User (gets own rentals), Admin (gets all or store rentals)
- **Response**:
  ```json
  {
    "code": 200,
    "msg": "Success",
    "data": [
      {
        "rental_id": 1,
        "rental_date": "2023-01-15",
        "rental_store_id": 1,
        "user_id": 1,
        "vehicle_id": 1,
        "expected_return_date": "2023-01-20",
        "return_store_id": 1,
        "rental_status": "active",
        "is_overdue": false,
        "user": { /* user details */ },
        "vehicle": { /* vehicle details */ },
        "rental_store": { /* store details */ },
        "return_store": { /* store details */ }
      }
    ]
  }
  ```

#### Create Rental Request
- **URL**: `/api/rentals`
- **Method**: `POST`
- **Auth**: User
- **Body**:
  ```json
  {
    "rental_store_id": 1,
    "expected_return_date": "2023-02-01",
    "return_store_id": 1
  }
  ```

#### Approve Rental (Admin only)
- **URL**: `/api/rentals/{rental_id}/approve`
- **Method**: `PUT`
- **Auth**: Admin
- **Body**:
  ```json
  {
    "vehicle_id": 1
  }
  ```

#### Return Rental (Admin only)
- **URL**: `/api/rentals/{rental_id}/return`
- **Method**: `PUT`
- **Auth**: Admin

#### Request Extension
- **URL**: `/api/rentals/{rental_id}/extend`
- **Method**: `PUT`
- **Auth**: User (owner of rental)
- **Body**:
  ```json
  {
    "expected_return_date": "2023-02-15"
  }
  ```

#### Approve Extension (Admin only)
- **URL**: `/api/rentals/{rental_id}/approve-extension`
- **Method**: `PUT`
- **Auth**: Admin

#### Cancel Rental
- **URL**: `/api/rentals/{rental_id}/cancel`
- **Method**: `PUT`
- **Auth**: User (can cancel own pending rentals), Admin (can cancel any)

## User Roles

1. **Regular User** (role: ["user"]): Can create rental requests, view own rentals, request extensions, and cancel own pending rentals.
2. **Store Admin** (role: ["admin"]): Can manage rentals for their store, approve/reject rentals and extensions.
3. **Global Admin** (role: ["super"]): Has all permissions, can manage stores, users, and vehicle types.

## Rental Status

The rental system tracks the following statuses for rentals:

1. **pending**: Rental request created but not yet approved by admin
2. **active**: Rental approved and vehicle assigned
3. **extension_requested**: User has requested an extension for the rental
4. **returned**: Vehicle has been returned
5. **cancelled**: Rental has been cancelled

Additionally, the system tracks whether a rental is overdue with the `is_overdue` field, which is automatically updated when retrieving rental information.
