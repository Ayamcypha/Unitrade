# UniTrade Backend

This is the backend server for the UniTrade application, built with Node.js, Express, and MongoDB.

## Setup Instructions

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env` file in the backend directory with the following content:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
UPLOAD_PATH=uploads/
```

3. Create an `uploads` directory in the backend folder:
```bash
mkdir uploads
```

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get current user profile (requires authentication)

### User Management
- GET `/api/users/:id` - Get user by ID (requires authentication)
- PUT `/api/users/profile` - Update user profile (requires authentication)
- DELETE `/api/users/profile` - Delete user account (requires authentication)

## File Structure
```
backend/
├── models/
│   └── user.model.js
├── routes/
│   ├── auth.routes.js
│   └── user.routes.js
├── middleware/
│   └── auth.middleware.js
├── uploads/
├── .env
├── server.js
└── package.json
```
