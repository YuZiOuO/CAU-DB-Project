# Flask Application Setup

## Package Structure Fix

The backend directory has been set up as a proper Python package by adding an `__init__.py` file. This allows the Flask CLI to correctly import the application using the `backend.run` module path.

## Running Database Commands

You can initialize the database using one of the following methods:

1. Using Flask CLI (recommended for Python < 3.13):
   ```
   flask --app backend.run init-db
   ```

2. Using direct Python execution (works with all Python versions):
   ```
   cd backend
   python run.py init-db
   ```

## Known Issues

There is a compatibility issue between SQLAlchemy 2.0.25 and Python 3.13. If you encounter the following error:

```
AssertionError: Class <class 'sqlalchemy.sql.elements.SQLCoreOperations'> directly inherits TypingOnly but has additional attributes {'__firstlineno__', '__static_attributes__'}.
```

Consider using Python 3.12 or earlier, or wait for an updated version of SQLAlchemy that is compatible with Python 3.13.