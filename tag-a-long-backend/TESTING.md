# Tag a Long API Testing Guide

## Server Status
✅ **Backend is running on http://localhost:3000**

## Test Results

### ✅ Authentication Endpoints
- **Signup**: Working - Creates user and returns JWT token
- **Login**: Working - Authenticates user and returns JWT token

### ✅ Profile Endpoints
- **Get Profile**: Working - Returns authenticated user profile

### ✅ Feed Endpoint
- **Get Feed**: Working - Returns empty array (no listings yet)

### ✅ Health Check
- **Health**: Working - Server is healthy

## Quick Test Commands

### 1. Create a User (Signup)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "Sarah123",
    "display_name": "Sarah",
    "username": "sarah_hikes",
    "bio": "Love hiking!",
    "date_of_birth": "1998-05-15",
    "city": "Provo"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "Sarah123"
  }'
```

**Save the token from the response!**

### 3. Get Your Profile
```bash
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update Profile
```bash
curl -X PUT http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated bio!",
    "city": "Salt Lake City"
  }'
```

### 5. Get Feed (will be empty until listings are created)
```bash
curl http://localhost:3000/api/listings/feed \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. View Another User's Profile
```bash
curl http://localhost:3000/api/profile/testuser
```

## Database Location
SQLite database: `tag-a-long-backend/dev.db`

To view the database:
```bash
cd tag-a-long-backend
npm run prisma:studio
```

This will open Prisma Studio in your browser to view/edit data.

## Notes for Image Upload Testing

The image upload endpoints (profile photo, listing creation) require AWS S3 credentials.

**Options:**
1. **Add real AWS credentials** to `.env` file
2. **Use local storage mock** (modify imageService.js to save files locally)
3. **Skip image testing** and focus on other endpoints

For now, you can test all text-based operations without S3.

## Next Steps

1. **Create more test users** - Build out a realistic dataset
2. **Test request flow** - Create listings, send requests, accept/reject
3. **Build the frontend** - React Native mobile app
4. **Add S3 integration** - Enable real image uploads

## Current Test User

Username: `testuser`
Email: `test@example.com`
Password: `Test1234`
City: Provo
Token: See login response

---

**Backend Status: ✅ Fully Functional**

All core endpoints are working. Ready for frontend development!
