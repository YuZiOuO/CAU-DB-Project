# CAU-DB-Project - Car Rental System

This project is a car rental management system with a Vue.js frontend and Flask backend.

## Project Structure

- `web/`: Frontend application built with Vue.js
- `backend/`: Backend API built with Flask

## Getting Started

### Backend Setup

1. We need Python3 and Node.js 21 or more. But do not use Python3.13 for some reason.  

2. Navigate to the backend directory:
   ```
   cd backend
   ```

3. Create a virtual environment:
   ```
   python -m venv venv
   ```
   If it doesn't work, then try
   ```
   python3 -m venv venv
   ```

4. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
   If it doesn't work, then try
   ```
   pip3 install -r requirements.txt
   ```

6. Set up PostgreSQL:
   - Install PostgreSQL if not already installed
   - Create the necessary databases:
     ```
     createdb car_rental_dev
     createdb car_rental_test
     createdb car_rental_prod
     ```
   - Or configure your own PostgreSQL connection by setting the DATABASE_URL environment variable:
     ```
     export DATABASE_URL="postgresql+pg8000://username:password@localhost/dbname"
     ```
   - Note: This project uses pg8000 as the PostgreSQL driver, which is a pure Python implementation that doesn't require compilation of C extensions.

7. Initialize the database:
   ```
   flask --app backend.run init-db
   ```

8. Create an admin user:
   ```
   flask --app backend.run create-admin
   ```

9. Run the backend:
   ```
   python -m backend.run
   ```
   Or
   ```
   python3 -m backend.run
   ```

The backend server will start at http://localhost:11451.

### Frontend Setup

1. Navigate to the web directory:
   ```
   cd web
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Run the development server:
   ```
   pnpm dev
   ```

The frontend server will start at http://localhost:9980.

## Features

- User authentication and authorization
- Vehicle management
- Store management
- Rental management
- Admin dashboard

## API Documentation

See the [Backend README](backend/README.md) for detailed API documentation.
