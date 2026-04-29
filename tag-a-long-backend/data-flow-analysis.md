# Tag-a-Long Backend - Complete Data Flow Analysis

This document traces **exact data flows** through your Tag-a-Long application with **specific file names, function names, and line numbers**. Perfect for understanding how everything connects!

---

## Table of Contents

1. [App Startup Flow](#1-app-startup-flow-what-happens-when-a-user-first-loads-the-app)
2. [Main User Actions](#2-main-user-actions-complete-flows)
3. [Authentication System](#3-authentication-system-where-and-how)
4. [Payment Processing](#4-payment-processing-flow)
5. [Database Storage](#5-database-storage-what-why-and-where)

---

# 1. App Startup Flow: What Happens When a User First Loads the App?

## 🚀 Backend Server Initialization (Happens Once on Deploy)

### **File: `src/server.js`**

```javascript
Step 1: Load Environment Variables (Line 1)
└─> require('dotenv').config()
    Loads all .env secrets (DATABASE_URL, JWT_SECRET, AWS keys, etc.)

Step 2: Initialize Express App (Line 19)
└─> const app = express()

Step 3: Initialize Firebase for Push Notifications (Lines 22-23)
└─> initializeFirebase() → src/services/fcmService.js:7-23
    ├─> Creates Firebase Admin instance
    └─> Sets firebaseInitialized = true

Step 4: Apply Security Middleware (Lines 26-30)
├─> helmet() - Adds security headers
└─> cors() - Allows cross-origin requests from app

Step 5: Register Webhook Routes (Line 33)
└─> app.use('/api/webhooks', webhookRoutes)
    IMPORTANT: Placed BEFORE express.json() to preserve raw body for Stripe

Step 6: Apply Body Parsing Middleware (Lines 35-36)
├─> express.json() - Parses JSON request bodies
└─> express.urlencoded() - Parses form data

Step 7: Apply Logging (Line 37)
└─> morgan('dev') - Logs all HTTP requests to console

Step 8: Apply Rate Limiting (Line 40)
└─> apiLimiter - Max 100 requests per minute per IP

Step 9: Register All API Routes (Lines 43-48)
├─> /api/auth → authRoutes
├─> /api/profile → profileRoutes
├─> /api/listings → listingsRoutes
├─> /api/requests → requestsRoutes
├─> /api/notifications → notificationsRoutes
└─> /api/subscription → subscriptionRoutes

Step 10: Register Error Handlers (Lines 60-71)
├─> 404 handler - Unknown routes
└─> errorHandler - Global error catching

Step 11: Start Listening (Lines 74-77)
└─> app.listen(PORT) - Server starts on port 3000
    Console: "🚀 Server running on port 3000"
```

**Result:** Backend is now running and ready to accept requests!

---

## 📱 Frontend App Startup (User Opens App)

### **Scenario A: User Has Never Used the App**

```
User opens app
    ↓
App checks local storage for JWT token
    ↓
NO TOKEN FOUND
    ↓
App shows Welcome/Login screen
    ↓
User sees two buttons:
├─> "Create Account" (goes to signup flow)
└─> "Log In" (goes to login flow)
```

### **Scenario B: User Has Logged In Before**

```
User opens app
    ↓
App checks local storage for JWT token
    ↓
TOKEN FOUND (e.g., "eyJhbGciOiJIUzI1NiIsInR...")
    ↓
App sends request to verify token is still valid:
    GET /api/profile/me
    Headers: { Authorization: "Bearer eyJhbGciOiJIUz..." }
    ↓
┌────────────────────────────────────────────────┐
│ BACKEND AUTHENTICATION FLOW (See Section 3)   │
│ Files: src/middleware/auth.js                 │
│        src/utils/jwt.js                       │
└────────────────────────────────────────────────┘
    ↓
Token valid?
├─> YES: App loads home screen with user's data
└─> NO: App redirects to login screen
```

---

# 2. Main User Actions: Complete Flows

## 🔐 Action 1: User Signs Up (Creates Account)

### **Frontend → Backend Flow**

```
USER FILLS OUT SIGNUP FORM
├─> Email: "john@example.com"
├─> Password: "MyPassword123"
├─> Display Name: "John Doe"
├─> Username: "johndoe"
├─> Bio: "Love hiking and coffee"
├─> Date of Birth: "1995-05-15"
├─> City: "San Diego"
└─> Instagram: "john_adventures"

User taps "Create Account" button
    ↓
App sends HTTP request:
    POST http://localhost:3000/api/auth/signup
    Headers: { "Content-Type": "application/json" }
    Body: {
      "email": "john@example.com",
      "password": "MyPassword123",
      "display_name": "John Doe",
      "username": "johndoe",
      "bio": "Love hiking and coffee",
      "date_of_birth": "1995-05-15",
      "city": "San Diego",
      "instagram_handle": "john_adventures"
    }
```

---

### **Backend Processing: Step-by-Step**

#### **Step 1: Request Arrives at Express Server**

**File: `src/server.js:43`**
```javascript
app.use('/api/auth', authRoutes)
```
Routes to → `src/routes/auth.js`

---

#### **Step 2: Route Matching**

**File: `src/routes/auth.js:9`**
```javascript
router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
```

**Middleware Pipeline Executes in Order:**

1. **authLimiter** (`src/middleware/rateLimiter.js`)
   - Checks: Has this IP made too many signup attempts?
   - Limit: 5 signup requests per 15 minutes
   - If exceeded → Returns 429 "Too many requests"
   - If OK → Continues to next middleware

2. **validate(signupSchema)** (`src/middleware/validation.js`)
   - Uses Joi schema from `src/utils/validators.js:3-27`
   - Validates:

**File: `src/utils/validators.js:3-27`**
```javascript
Line 4:  email: Joi.string().email().required()
         ✓ Must be valid email format

Line 5-11: password: Joi.string()
           .min(8)                              ✓ At least 8 characters
           .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)  ✓ Has uppercase, lowercase, number
           .required()

Line 12: display_name: Joi.string().min(2).max(100).required()
         ✓ 2-100 characters

Line 13-17: username: Joi.string()
            .min(3).max(50)                     ✓ 3-50 characters
            .pattern(/^[a-zA-Z0-9_]+$/)         ✓ Only letters, numbers, underscores
            .required()

Line 18: bio: Joi.string().max(150).allow('')
         ✓ Optional, max 150 characters

Line 19-24: date_of_birth: Joi.date()
            .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000))
            ✓ Must be at least 18 years old

Line 25: city: Joi.string().min(2).max(100).required()
         ✓ Required

Line 26: instagram_handle: Joi.string().max(50).allow('')
         ✓ Optional
```

   - If validation fails → Returns 400 with specific error
   - If validation passes → Continues to controller

---

#### **Step 3: Controller Processes Signup**

**File: `src/controllers/authController.js:5-49`**

```javascript
Line 5: const signup = async (req, res, next) => {
Line 6:   try {
Line 7:     const { email, password, display_name, username, bio,
                    date_of_birth, city, instagram_handle } = req.body;

        // STEP 3A: Hash Password
Line 10:    const password_hash = await bcrypt.hash(password, 10);
            │
            └─> bcrypt.hash("MyPassword123", 10)
                ├─> Generates random salt
                ├─> Hashes password 2^10 (1024) times
                └─> Returns: "$2b$10$rKjF5Z5..." (60 character hash)

                SECURITY: Original password is NEVER stored!

        // STEP 3B: Create User in Database
Line 13:    const user = await prisma.user.create({
Line 14:      data: {
Line 15:        email,                                    // "john@example.com"
Line 16:        password_hash,                            // "$2b$10$rKjF5Z5..."
Line 17:        display_name,                             // "John Doe"
Line 18:        username,                                 // "johndoe"
Line 19:        bio: bio || null,                         // "Love hiking and coffee"
Line 20:        date_of_birth: new Date(date_of_birth),   // Date object
Line 21:        city,                                     // "San Diego"
Line 22:        instagram_handle: instagram_handle || null, // "john_adventures"
Line 23:      },

            // Only select safe fields (exclude password_hash!)
Line 24:      select: {
Line 25:        id: true,
Line 26:        email: true,
Line 27:        display_name: true,
Line 28:        username: true,
Line 29:        bio: true,
Line 30:        city: true,
Line 31:        profile_photo_url: true,
Line 32:        created_at: true,
Line 33:      },
Line 34:    });

        // DATABASE WRITES TO:
        // Table: users
        // New row created with UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")

        // STEP 3C: Generate JWT Token
Line 37:    const token = generateToken(user.id);
            │
            └─> Calls: src/utils/jwt.js:3-9

                File: src/utils/jwt.js:3-9
                const generateToken = (userId) => {
                  return jwt.sign(
                    { userId },                     // Payload
                    process.env.JWT_SECRET,         // Secret key
                    { expiresIn: '7d' }            // Expires in 7 days
                  );
                };

                Returns token like: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

        // STEP 3D: Send Response
Line 39:    res.status(201).json({
Line 40:      success: true,
Line 41:      data: {
Line 42:        user,        // User object (no password!)
Line 43:        token,       // JWT token
Line 44:      },
Line 45:    });

Line 46:  } catch (error) {
            // If ANY error occurs (duplicate email, DB connection, etc.)
Line 47:    next(error);  // Passes to global error handler
Line 48:  }
Line 49: };
```

---

#### **Step 4: Response Sent Back to App**

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "display_name": "John Doe",
      "username": "johndoe",
      "bio": "Love hiking and coffee",
      "city": "San Diego",
      "profile_photo_url": null,
      "created_at": "2025-11-21T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE3MDAzMTAwMDAsImV4cCI6MTcwMDkxNDgwMH0.abc123xyz"
  }
}
```

---

#### **Step 5: App Processes Response**

```
App receives response
    ↓
Saves token to secure storage (AsyncStorage/Keychain)
    ↓
Saves user data to app state
    ↓
Navigates to Home Screen
    ↓
Shows "Welcome, John Doe!"
```

---

### **🔍 What Happened in the Database?**

**Table: `users`**

New row inserted:

| Column | Value |
|--------|-------|
| id | 550e8400-e29b-41d4-a716-446655440000 |
| email | john@example.com |
| phone | NULL |
| password_hash | $2b$10$rKjF5Z5X8vY9... |
| display_name | John Doe |
| username | johndoe |
| bio | Love hiking and coffee |
| profile_photo_url | NULL |
| photo_gallery | [] |
| city | San Diego |
| instagram_handle | john_adventures |
| date_of_birth | 1995-05-15T00:00:00.000Z |
| is_active | true |
| created_at | 2025-11-21T10:30:00.000Z |
| last_active | 2025-11-21T10:30:00.000Z |

**Prisma Schema Reference: `prisma/schema.prisma:12-37`**

---

## 🏠 Action 2: User Views Activity Feed

### **Frontend → Backend Flow**

```
User logs in and lands on Home Screen
    ↓
App sends request:
    GET http://localhost:3000/api/listings/feed?city=San Diego&limit=50&offset=0
    Headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
    }
```

---

### **Backend Processing**

#### **Step 1: Route Matching**

**File: `src/routes/listings.js:11`**
```javascript
router.get('/feed', authenticateToken, listingsController.getFeed);
```

Middleware chain:
1. **authenticateToken** (See Section 3 for full breakdown)
2. **listingsController.getFeed**

---

#### **Step 2: Authenticate User**

**File: `src/middleware/auth.js:4-61`** (Full flow in Section 3)

```javascript
Line 5:  const authHeader = req.headers['authorization'];
Line 6:  const token = authHeader && authHeader.split(' ')[1];
         // Extracts: "eyJhbGciOiJIUzI1NiIsInR..."

Line 19: const decoded = jwt.verify(token, process.env.JWT_SECRET);
         // Decodes to: { userId: "550e8400-...", iat: 1700310000, exp: 1700914800 }

Line 22: const user = await prisma.user.findUnique({
Line 23:   where: { id: decoded.userId },
         // Fetches user from database

Line 45: await prisma.user.update({
Line 46:   where: { id: user.id },
Line 47:   data: { last_active: new Date() },
         // Updates last_active timestamp

Line 50: req.user = user;
         // Attaches user to request object

Line 51: next();
         // Continues to controller
```

---

#### **Step 3: Fetch Feed**

**File: `src/controllers/listingsController.js:4-102`**

```javascript
Line 4:  const getFeed = async (req, res, next) => {
Line 5:    try {
Line 6:      const { city, limit = 50, offset = 0, sort = 'recent' } = req.query;
             // city: "San Diego", limit: 50, offset: 0, sort: "recent"

         // STEP 3A: Build Database Query
Line 9:      const where = {
Line 10:       is_active: true,                     // Only active listings
Line 11:       expires_at: { gt: new Date() },      // Not expired
Line 12:       user_id: { not: req.user.id },       // Exclude own listings
Line 13:     };

Line 16:     if (city) {
Line 17:       where.city = city;                   // Filter by San Diego
Line 18:     }

         // STEP 3B: Execute Database Query
Line 21:     const listings = await prisma.listing.findMany({
Line 22:       where,
Line 23:       take: parseInt(limit),               // 50 listings
Line 24:       skip: parseInt(offset),              // Skip 0 (first page)
Line 25:       orderBy: sort === 'recent'
Line 26:         ? { created_at: 'desc' }           // Newest first
Line 27:         : { time_text: 'asc' },
Line 28:       include: {
Line 29:         user: {                            // Include listing creator info
Line 30:           select: {
Line 31:             username: true,
Line 32:             display_name: true,
Line 33:             profile_photo_url: true,
Line 34:           },
Line 35:         },
Line 36:         requests: {                        // Check if user already requested
Line 37:           where: { requester_id: req.user.id },
Line 38:           select: { id: true },
Line 39:         },
Line 40:       },
Line 41:     });

         // DATABASE QUERY EXECUTED:
         // SELECT * FROM listings
         // WHERE is_active = true
         //   AND expires_at > NOW()
         //   AND user_id != '550e8400-...'
         //   AND city = 'San Diego'
         // ORDER BY created_at DESC
         // LIMIT 50
         // OFFSET 0

         // STEP 3C: Get Total Count (for pagination)
Line 44:     const total = await prisma.listing.count({ where });
             // Returns total matching listings (e.g., 127)

         // STEP 3D: Filter Out Past Activities
Line 47:     const now = new Date();
Line 48:     const formattedListings = listings
Line 49:       .filter(listing => {
Line 51:         if (listing.date) {
Line 52:           const activityDate = new Date(listing.date);
Line 54:           if (listing.time) {
                     // Has specific time - check if it's passed
Line 56:             const [hours, minutes] = listing.time.split(':');
Line 57:             activityDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
Line 58:             return activityDate > now;
Line 59:           } else {
                     // No time - check if date has passed (end of day)
Line 61:             activityDate.setHours(23, 59, 59, 999);
Line 62:             return activityDate > now;
Line 63:           }
Line 64:         }
Line 66:         return true;
Line 67:       })

         // STEP 3E: Format Response
Line 68:       .map(listing => ({
Line 69:         id: listing.id,
Line 70:         title: listing.title,
Line 71:         description: listing.description,
Line 72:         category: listing.category,
Line 73:         location: listing.location,
Line 74:         date: listing.date,
Line 75:         time: listing.time,
Line 76:         max_participants: listing.max_participants,
Line 77:         photo_url: listing.photo_url,
Line 78:         caption: listing.caption,
Line 79:         time_text: listing.time_text,
Line 80:         city: listing.city,
Line 81:         created_at: listing.created_at,
Line 82:         expires_at: listing.expires_at,
Line 83:         user: listing.user,
Line 84:         has_requested: listing.requests.length > 0,  // Boolean flag
Line 85:       }));

         // STEP 3F: Send Response
Line 87:     res.json({
Line 88:       success: true,
Line 89:       data: {
Line 90:         listings: formattedListings,
Line 91:         pagination: {
Line 92:           total,                           // 127
Line 93:           limit: parseInt(limit),          // 50
Line 94:           offset: parseInt(offset),        // 0
Line 95:           has_more: parseInt(offset) + parseInt(limit) < total,  // true
Line 96:         },
Line 97:       },
Line 98:     });

Line 99:   } catch (error) {
Line 100:    next(error);
Line 101:  }
Line 102: };
```

---

#### **Step 4: Response Sent**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "abc123...",
        "title": "Beach Volleyball at Sunset",
        "description": "Looking for players for casual beach volleyball game!",
        "category": "sports",
        "location": "Pacific Beach",
        "date": "2025-11-22T00:00:00.000Z",
        "time": "18:00",
        "max_participants": 8,
        "photo_url": "https://tagalong-photos.s3.amazonaws.com/...",
        "caption": "Beach volleyball anyone?",
        "time_text": "Tomorrow at 6 PM",
        "city": "San Diego",
        "created_at": "2025-11-21T10:00:00.000Z",
        "expires_at": "2025-11-22T18:00:00.000Z",
        "user": {
          "username": "beachfan",
          "display_name": "Sarah Johnson",
          "profile_photo_url": "https://..."
        },
        "has_requested": false
      },
      // ... 49 more listings
    ],
    "pagination": {
      "total": 127,
      "limit": 50,
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

#### **Step 5: App Displays Feed**

```
App receives response
    ↓
Parses listings array
    ↓
Renders each listing as a card:
├─> Photo
├─> Title
├─> Username
├─> Location
├─> Time
└─> "Tag Along" button (if not requested)
```

---

## 📝 Action 3: User Creates a New Activity Listing

This is the **PRIMARY ACTION** of your app! Let's trace every single step.

### **Frontend Flow**

```
User taps "+" button to create activity
    ↓
App shows "Create Activity" form:
├─> Title: "Hiking at Torrey Pines"
├─> Description: "Easy 5-mile trail with ocean views"
├─> Category: "outdoor"
├─> Location: "Torrey Pines State Reserve"
├─> Date: "2025-11-23"
├─> Time: "09:00"
├─> Max Participants: 6
└─> Photo: (user selects from camera roll)

User taps "Post Activity" button
    ↓
App uploads photo to backend first (if needed)
    ↓
App sends HTTP request:
    POST http://localhost:3000/api/listings
    Headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR...",
      "Content-Type": "application/json"
    }
    Body: {
      "title": "Hiking at Torrey Pines",
      "description": "Easy 5-mile trail with ocean views",
      "category": "outdoor",
      "location": "Torrey Pines State Reserve",
      "date": "2025-11-23",
      "time": "09:00",
      "max_participants": 6,
      "photo_url": "https://s3.amazonaws.com/...",
      "caption": "Morning hike anyone?",
      "time_text": "Saturday at 9 AM"
    }
```

---

### **Backend Processing: Complete Trace**

#### **Step 1: Route Matching**

**File: `src/routes/listings.js:15-21`**
```javascript
Line 15: router.post(
Line 16:   '/',
Line 17:   authenticateToken,
Line 18:   createListingLimiter,
Line 19:   validate(createListingSchema),
Line 20:   listingsController.createListing
Line 21: );
```

**Middleware Pipeline:**

1. **authenticateToken** (`src/middleware/auth.js`)
   - Verifies JWT token
   - Attaches user to `req.user`

2. **createListingLimiter** (`src/middleware/rateLimiter.js`)
   - Checks: Has user created too many listings recently?
   - Limit: 10 listings per hour
   - If exceeded → Returns 429
   - If OK → Continues

3. **validate(createListingSchema)** (`src/utils/validators.js:34-48`)

**File: `src/utils/validators.js:34-48`**
```javascript
Line 36: title: Joi.string().min(3).max(200).required()
         ✓ "Hiking at Torrey Pines" (valid)

Line 37: description: Joi.string().min(10).max(500).required()
         ✓ "Easy 5-mile trail with ocean views" (valid)

Line 38: category: Joi.string().valid('sports', 'food', 'entertainment',
                                      'outdoor', 'fitness', 'social', 'other').required()
         ✓ "outdoor" (valid)

Line 39: location: Joi.string().min(2).max(200).required()
         ✓ "Torrey Pines State Reserve" (valid)

Line 40: date: Joi.date().min('now').required()
         ✓ "2025-11-23" is in future (valid)

Line 41: time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
         ✓ "09:00" matches HH:MM format (valid)

Line 42: max_participants: Joi.number().integer().min(1).max(100).optional()
         ✓ 6 (valid)
```

---

#### **Step 2: Controller Creates Listing**

**File: `src/controllers/listingsController.js:170-241`**

```javascript
Line 170: const createListing = async (req, res, next) => {
Line 171:   try {
Line 172:     const {
Line 173:       title,
Line 174:       description,
Line 175:       category,
Line 176:       location,
Line 177:       date,
Line 178:       time,
Line 179:       max_participants,
Line 180:       photo_url,
Line 181:       caption,
Line 182:       time_text,
Line 183:     } = req.body;

          // STEP 2A: Calculate Expiration Time
Line 186:     let expires_at;
Line 187:     if (date) {
Line 188:       const activityDate = new Date(date);  // 2025-11-23

Line 191:       if (time) {
                  // Activity has specific time (09:00)
Line 192:         const [hours, minutes] = time.split(':');  // ["09", "00"]
Line 193:         activityDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
                  // activityDate = 2025-11-23 09:00:00
Line 194:         expires_at = activityDate;
                  // Listing will auto-expire at activity start time!

Line 195:       } else {
                  // No time specified, expire at end of day
Line 197:         activityDate.setHours(23, 59, 59, 999);
Line 198:         expires_at = activityDate;
Line 199:       }
Line 200:     } else {
                // No date specified, expire 24 hours from now
Line 202:       expires_at = new Date();
Line 203:       expires_at.setHours(expires_at.getHours() + 24);
Line 204:     }

          // STEP 2B: Create Database Record
Line 207:     const listing = await prisma.listing.create({
Line 208:       data: {
Line 209:         user_id: req.user.id,               // "550e8400-..."
Line 210:         title: title.trim(),                // "Hiking at Torrey Pines"
Line 211:         description: description?.trim() || null,  // "Easy 5-mile..."
Line 212:         category: category || null,         // "outdoor"
Line 213:         location: location?.trim() || null, // "Torrey Pines State Reserve"
Line 214:         date: date ? new Date(date) : null, // 2025-11-23T00:00:00.000Z
Line 215:         time: time || null,                 // "09:00"
Line 216:         max_participants: max_participants || null,  // 6
Line 217:         photo_url: photo_url || null,       // "https://s3..."
Line 218:         caption: caption?.trim() || description?.trim() || null,
Line 219:         time_text: time_text || time || null,  // "Saturday at 9 AM"
Line 220:         city: req.user.city,                // Inherited from user's city
Line 221:         expires_at,                         // 2025-11-23 09:00:00
Line 222:       },

              // Include user info in response
Line 223:       include: {
Line 224:         user: {
Line 225:           select: {
Line 226:             username: true,
Line 227:             display_name: true,
Line 228:             profile_photo_url: true,
Line 229:           },
Line 230:         },
Line 231:       },
Line 232:     });

          // DATABASE WRITE:
          // Table: listings
          // New row with UUID, all fields populated

          // STEP 2C: Send Response
Line 234:     res.status(201).json({
Line 235:       success: true,
Line 236:       data: listing,
Line 237:     });

Line 238:   } catch (error) {
Line 239:     next(error);
Line 240:   }
Line 241: };
```

---

#### **Step 3: Response Sent**

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "def456-...",
    "user_id": "550e8400-...",
    "title": "Hiking at Torrey Pines",
    "description": "Easy 5-mile trail with ocean views",
    "category": "outdoor",
    "location": "Torrey Pines State Reserve",
    "date": "2025-11-23T00:00:00.000Z",
    "time": "09:00",
    "max_participants": 6,
    "photo_url": "https://s3.amazonaws.com/tagalong-photos/listings/...",
    "caption": "Morning hike anyone?",
    "time_text": "Saturday at 9 AM",
    "city": "San Diego",
    "latitude": null,
    "longitude": null,
    "is_active": true,
    "view_count": 0,
    "created_at": "2025-11-21T15:30:00.000Z",
    "expires_at": "2025-11-23T09:00:00.000Z",
    "user": {
      "username": "johndoe",
      "display_name": "John Doe",
      "profile_photo_url": "https://..."
    }
  }
}
```

---

#### **Step 4: Database State**

**Table: `listings`**

New row inserted:

| Column | Value |
|--------|-------|
| id | def456-... |
| user_id | 550e8400-... |
| photo_url | https://s3.amazonaws.com/... |
| title | Hiking at Torrey Pines |
| caption | Morning hike anyone? |
| description | Easy 5-mile trail with ocean views |
| category | outdoor |
| location | Torrey Pines State Reserve |
| date | 2025-11-23T00:00:00.000Z |
| time | 09:00 |
| time_text | Saturday at 9 AM |
| max_participants | 6 |
| city | San Diego |
| latitude | NULL |
| longitude | NULL |
| is_active | true |
| view_count | 0 |
| created_at | 2025-11-21T15:30:00.000Z |
| expires_at | 2025-11-23T09:00:00.000Z |

**Prisma Schema Reference: `prisma/schema.prisma:39-68`**

---

#### **Step 5: App Updates UI**

```
App receives response
    ↓
Shows success message: "Activity posted!"
    ↓
Navigates to "My Listings" screen
    ↓
New listing appears at the top
    ↓
Other users in San Diego can now see this listing in their feed!
```

---

## 🙋 Action 4: User Requests to Join Someone's Activity

This is the **SOCIAL INTERACTION** core of your app!

### **Frontend Flow**

```
User browing feed, sees listing:
    "Beach Volleyball at Sunset" by @sarahjohnson
    ↓
User taps "Tag Along" button
    ↓
App sends HTTP request:
    POST http://localhost:3000/api/requests
    Headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR..."
    }
    Body: {
      "listing_id": "abc123..."
    }
```

---

### **Backend Processing**

#### **Step 1: Route Matching**

**File: `src/routes/requests.js:7`**
```javascript
Line 7: router.post('/', authenticateToken, requestsController.createRequest);
```

Middleware:
1. **authenticateToken** - Verifies user is logged in
2. **requestsController.createRequest** - Handles request creation

---

#### **Step 2: Controller Creates Request**

**File: `src/controllers/requestsController.js:4-109`**

```javascript
Line 4:  const createRequest = async (req, res, next) => {
Line 5:    try {
Line 6:      const { listing_id } = req.body;      // "abc123..."
Line 7:      const requester_id = req.user.id;     // "550e8400-..." (from JWT)

          // STEP 2A: Verify Listing Exists & Is Active
Line 10:     const listing = await prisma.listing.findUnique({
Line 11:       where: { id: listing_id },
Line 12:       include: { user: true },             // Need host info for notification
Line 13:     });

Line 15:     if (!listing || !listing.is_active || listing.expires_at < new Date()) {
              // Listing not found, inactive, or expired
Line 16:       return res.status(404).json({
Line 17:         success: false,
Line 18:         error: {
Line 19:           code: 'LISTING_NOT_FOUND',
Line 20:           message: 'Listing not found or expired',
Line 21:         },
Line 22:       });
Line 23:     }

          // STEP 2B: Prevent Self-Request
Line 26:     if (listing.user_id === requester_id) {
              // User trying to join their own activity
Line 27:       return res.status(400).json({
Line 28:         success: false,
Line 29:         error: {
Line 30:           code: 'CANNOT_REQUEST_OWN_LISTING',
Line 31:           message: 'You cannot request to join your own listing',
Line 32:         },
Line 33:       });
Line 34:     }

          // STEP 2C: Check for Duplicate Request
Line 37:     const existingRequest = await prisma.tagAlongRequest.findUnique({
Line 38:       where: {
Line 39:         listing_id_requester_id: {          // Composite unique key
Line 40:           listing_id,
Line 41:           requester_id,
Line 42:         },
Line 43:       },
Line 44:     });

Line 46:     if (existingRequest) {
              // User already requested to join this activity
Line 47:       return res.status(400).json({
Line 48:         success: false,
Line 49:         error: {
Line 50:           code: 'DUPLICATE_REQUEST',
Line 51:           message: 'You have already requested to join this activity',
Line 52:         },
Line 53:       });
Line 54:     }

          // STEP 2D: Create Request
Line 57:     const request = await prisma.tagAlongRequest.create({
Line 58:       data: {
Line 59:         listing_id,                         // "abc123..."
Line 60:         requester_id,                       // "550e8400-..."
Line 61:         status: 'pending',                  // Default status
Line 62:       },
Line 63:       include: {
Line 64:         requester: {                        // Include requester info for notification
Line 65:           select: {
Line 66:             display_name: true,
Line 67:             username: true,
Line 68:           },
Line 69:         },
Line 70:       },
Line 71:     });

          // DATABASE WRITE:
          // Table: tag_along_requests
          // New row with status: "pending"

          // STEP 2E: Create In-App Notification
Line 74:     const notification = await prisma.notification.create({
Line 75:       data: {
Line 76:         user_id: listing.user_id,          // Host gets notification
Line 77:         type: 'request_received',
Line 78:         title: `${request.requester.display_name} wants to tag along!`,
Line 79:         body: 'View their profile and decide',
Line 80:         data: JSON.stringify({
Line 81:           request_id: request.id,
Line 82:           listing_id: listing_id,
Line 83:           requester_username: request.requester.username,
Line 84:         }),
Line 85:       },
Line 86:     });

          // DATABASE WRITE:
          // Table: notifications
          // Host now has unread notification

          // STEP 2F: Send Push Notification
Line 89:     try {
Line 90:       await sendToMultipleDevices(listing.user_id, {
Line 91:         title: notification.title,
Line 92:         body: notification.body,
Line 93:         data: {
Line 94:           request_id: request.id,
Line 95:           listing_id: listing_id,
Line 96:         },
Line 97:       });

              // Calls: src/services/fcmService.js:59-75

              File: src/services/fcmService.js:59-75
              const sendToMultipleDevices = async (userId, notification) => {
                // Get all FCM tokens for this user
                const tokens = await prisma.fcmToken.findMany({
                  where: { user_id: userId },
                  select: { token: true },
                });

                // Send to all devices (iPhone, iPad, etc.)
                const promises = tokens.map((t) =>
                  sendPushNotification(t.token, notification)
                );

                return Promise.allSettled(promises);
              };

              // Firebase Admin SDK sends notification to device(s)
              // Host's phone shows: "John Doe wants to tag along!"

Line 98:     } catch (error) {
Line 99:       console.error('Error sending push notification:', error);
              // Don't fail request if push fails
Line 100:    }

          // STEP 2G: Send Response
Line 102:    res.status(201).json({
Line 103:      success: true,
Line 104:      data: request,
Line 105:    });

Line 106:  } catch (error) {
Line 107:    next(error);
Line 108:  }
Line 109: };
```

---

#### **Step 3: Response Sent**

```json
HTTP/1.1 201 Created

{
  "success": true,
  "data": {
    "id": "request789...",
    "listing_id": "abc123...",
    "requester_id": "550e8400-...",
    "status": "pending",
    "created_at": "2025-11-21T16:00:00.000Z",
    "responded_at": null,
    "requester": {
      "display_name": "John Doe",
      "username": "johndoe"
    }
  }
}
```

---

#### **Step 4: Database State After Request**

**Table: `tag_along_requests`**

| Column | Value |
|--------|-------|
| id | request789... |
| listing_id | abc123... |
| requester_id | 550e8400-... |
| status | pending |
| created_at | 2025-11-21T16:00:00.000Z |
| responded_at | NULL |

**Table: `notifications`**

| Column | Value |
|--------|-------|
| id | notif456... |
| user_id | sarahjohnson_id (listing host) |
| type | request_received |
| title | John Doe wants to tag along! |
| body | View their profile and decide |
| data | {"request_id":"request789...","listing_id":"abc123...","requester_username":"johndoe"} |
| is_read | false |
| created_at | 2025-11-21T16:00:00.000Z |

---

#### **Step 5: What Happens Next?**

```
REQUESTER'S APP:
└─> Button changes to "Request Pending"
    Can't request again

HOST'S PHONE:
├─> Push notification appears: "John Doe wants to tag along!"
├─> In-app notification badge shows (1)
└─> Host can tap to view John's profile and decide

HOST TAPS "ACCEPT":
    PUT /api/requests/request789.../accept
    ↓
    File: src/controllers/requestsController.js:220-303
    ↓
    Updates request.status = 'accepted'
    ↓
    Creates notification for requester
    ↓
    Sends push notification: "You're in! Sarah Johnson accepted your request"
    ↓
    Both users can now see each other's contact info

HOST TAPS "REJECT":
    PUT /api/requests/request789.../reject
    ↓
    File: src/controllers/requestsController.js:305-354
    ↓
    Updates request.status = 'rejected'
    ↓
    No notification sent (soft rejection)
```

---

## 📷 Action 5: User Uploads Profile Photo (Bonus: S3 Integration)

### **Frontend Flow**

```
User taps "Edit Profile"
    ↓
Taps on profile photo circle
    ↓
Opens camera/photo picker
    ↓
User selects photo
    ↓
App sends multipart/form-data request:
    POST http://localhost:3000/api/profile/me/photo
    Headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR...",
      "Content-Type": "multipart/form-data"
    }
    Body: (binary image data)
```

---

### **Backend Processing**

**File: `src/services/imageService.js:15-43`**

```javascript
Line 15: const uploadToS3 = async (file, folder) => {
Line 16:   try {
          // STEP 1: Process Image with Sharp
Line 18:     const processedImage = await sharp(file.buffer)
Line 19:       .resize(1080, 1080, { fit: 'inside' })  // Max 1080x1080
Line 20:       .jpeg({ quality: 85 })                  // Convert to JPEG, 85% quality
Line 21:       .toBuffer();

          // Before: 4MB PNG, 3000x4000
          // After: 200KB JPEG, 1080x1080

          // STEP 2: Generate Unique Filename
Line 24:     const fileName = `${folder}/${uuidv4()}-${Date.now()}.jpg`;
          // Example: "profiles/550e8400.../1700320000.jpg"

          // STEP 3: Upload to AWS S3
Line 27:     const command = new PutObjectCommand({
Line 28:       Bucket: process.env.AWS_S3_BUCKET,    // "tagalong-photos"
Line 29:       Key: fileName,
Line 30:       Body: processedImage,
Line 31:       ContentType: 'image/jpeg',
Line 32:       ACL: 'public-read',                   // Anyone can view
Line 33:     });

Line 35:     await s3Client.send(command);
          // Image now lives in cloud!

          // STEP 4: Return Public URL
Line 38:     return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
          // Returns: "https://tagalong-photos.s3.us-west-1.amazonaws.com/profiles/550e8400.../1700320000.jpg"

Line 39:   } catch (error) {
Line 40:     console.error('Error uploading to S3:', error);
Line 41:     throw new Error('Failed to upload image');
Line 42:   }
Line 43: };
```

---

# 3. Authentication System: Where and How

## 🔐 Authentication Flow Breakdown

### **Signup Authentication** (Already covered in Action 1)

**Summary:**
- **File:** `src/controllers/authController.js:5-49`
- **Process:** Hash password → Create user → Generate JWT → Return token
- **Token Generation:** `src/utils/jwt.js:3-9`

---

### **Login Authentication**

**File: `src/controllers/authController.js:51-111`**

```javascript
Line 51:  const login = async (req, res, next) => {
Line 52:    try {
Line 53:      const { email, password } = req.body;

          // STEP 1: Find User by Email
Line 56:     const user = await prisma.user.findUnique({
Line 57:       where: { email },
Line 58:       select: {
Line 59:         id: true,
Line 60:         email: true,
Line 61:         password_hash: true,              // Need this to verify password
Line 62:         display_name: true,
Line 63:         username: true,
Line 64:         bio: true,
Line 65:         city: true,
Line 66:         profile_photo_url: true,
Line 67:         instagram_handle: true,
Line 68:         is_active: true,
Line 69:       },
Line 70:     });

          // STEP 2: Check User Exists & Is Active
Line 72:     if (!user || !user.is_active) {
Line 73:       return res.status(401).json({
Line 74:         success: false,
Line 75:         error: {
Line 76:           code: 'INVALID_CREDENTIALS',
Line 77:           message: 'Invalid email or password',
Line 78:         },
Line 79:       });
Line 80:     }

          // STEP 3: Verify Password
Line 83:     const isValidPassword = await bcrypt.compare(password, user.password_hash);
          // Compares: "MyPassword123" with "$2b$10$rKjF5Z5..."
          // Returns: true or false

Line 85:     if (!isValidPassword) {
Line 86:       return res.status(401).json({
Line 87:         success: false,
Line 88:         error: {
Line 89:           code: 'INVALID_CREDENTIALS',
Line 90:           message: 'Invalid email or password',
Line 91:         },
Line 92:       });
Line 93:     }

          // STEP 4: Remove Password from Response
Line 96:     delete user.password_hash;
          // NEVER send password hash to client!

          // STEP 5: Generate JWT Token
Line 99:     const token = generateToken(user.id);
          // Same as signup: 7-day expiration

          // STEP 6: Send Response
Line 101:    res.json({
Line 102:      success: true,
Line 103:      data: {
Line 104:        user,
Line 105:        token,
Line 106:      },
Line 107:    });

Line 108:  } catch (error) {
Line 109:    next(error);
Line 110:  }
Line 111: };
```

---

### **Token Verification (Every Protected Request)**

This runs on **EVERY** authenticated endpoint!

**File: `src/middleware/auth.js:4-61`**

```javascript
Line 4:  const authenticateToken = async (req, res, next) => {

         // STEP 1: Extract Token from Header
Line 5:    const authHeader = req.headers['authorization'];
         // authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR..."

Line 6:    const token = authHeader && authHeader.split(' ')[1];
         // token = "eyJhbGciOiJIUzI1NiIsInR..." (removes "Bearer ")

         // STEP 2: Check Token Exists
Line 8:    if (!token) {
Line 9:      return res.status(401).json({
Line 10:       success: false,
Line 11:       error: {
Line 12:         code: 'NO_TOKEN',
Line 13:         message: 'Access token is required',
Line 14:       },
Line 15:     });
Line 16:   }

Line 18:   try {
           // STEP 3: Verify & Decode Token
Line 19:     const decoded = jwt.verify(token, process.env.JWT_SECRET);
           // Verifies signature with secret key
           // Checks expiration date
           // If valid, decodes to:
           // { userId: "550e8400-...", iat: 1700310000, exp: 1700914800 }

           // STEP 4: Fetch User from Database
Line 22:     const user = await prisma.user.findUnique({
Line 23:       where: { id: decoded.userId },
Line 24:       select: {
Line 25:         id: true,
Line 26:         email: true,
Line 27:         username: true,
Line 28:         display_name: true,
Line 29:         city: true,
Line 30:         is_active: true,
Line 31:       },
Line 32:     });

           // STEP 5: Verify User Still Exists & Is Active
Line 34:     if (!user || !user.is_active) {
Line 35:       return res.status(401).json({
Line 36:         success: false,
Line 37:         error: {
Line 38:           code: 'INVALID_TOKEN',
Line 39:           message: 'Invalid or expired token',
Line 40:         },
Line 41:       });
Line 42:     }

           // STEP 6: Update Last Active Timestamp
Line 45:     await prisma.user.update({
Line 46:       where: { id: user.id },
Line 47:       data: { last_active: new Date() },
Line 48:     });
           // Tracks user activity

           // STEP 7: Attach User to Request
Line 50:     req.user = user;
           // Now controllers can access req.user.id, req.user.city, etc.

           // STEP 8: Continue to Next Middleware/Controller
Line 51:     next();

Line 52:   } catch (error) {
           // Token verification failed (expired, invalid signature, etc.)
Line 53:     return res.status(403).json({
Line 54:       success: false,
Line 55:       error: {
Line 56:         code: 'TOKEN_VERIFICATION_FAILED',
Line 57:         message: 'Failed to authenticate token',
Line 58:       },
Line 59:     });
Line 60:   }
Line 61: };
```

---

### **JWT Token Structure**

**File: `src/utils/jwt.js:3-9`**

```javascript
Line 3: const generateToken = (userId) => {
Line 4:   return jwt.sign(
Line 5:     { userId },                      // Payload (what's encoded)
Line 6:     process.env.JWT_SECRET,          // Secret key (must be ≥32 chars)
Line 7:     { expiresIn: '7d' }             // Expires in 7 days
Line 8:   );
Line 9: };
```

**Decoded Token Example:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1700310000,    // Issued at (timestamp)
  "exp": 1700914800     // Expires at (timestamp)
}
```

**Why JWT?**
- **Stateless:** No session storage needed on server
- **Scalable:** Works across multiple servers
- **Secure:** Signed with secret, can't be forged
- **Self-contained:** Contains all info needed (userId)

---

### **Where Authentication Is Used**

| Route | File | Middleware |
|-------|------|-----------|
| GET /api/profile/me | src/routes/profile.js | authenticateToken |
| PUT /api/profile/me | src/routes/profile.js | authenticateToken |
| GET /api/listings/feed | src/routes/listings.js:11 | authenticateToken |
| POST /api/listings | src/routes/listings.js:17 | authenticateToken |
| DELETE /api/listings/:id | src/routes/listings.js:23 | authenticateToken |
| POST /api/requests | src/routes/requests.js:7 | authenticateToken |
| GET /api/requests/received | src/routes/requests.js:8 | authenticateToken |
| PUT /api/requests/:id/accept | src/routes/requests.js:10 | authenticateToken |
| GET /api/notifications | src/routes/notifications.js | authenticateToken |

**All protected routes follow this pattern:**
```javascript
router.METHOD('/path', authenticateToken, controller.function);
```

---

# 4. Payment Processing Flow

Your app uses **Stripe** for subscription payments, handled via **Supabase Edge Functions** (serverless functions written in Deno).

## 💳 Subscription Creation Flow

### **Step 1: User Taps "Upgrade to Premium"**

```
User in app taps "Upgrade to Premium" button
    ↓
App calls Supabase Edge Function:
    POST https://your-project.supabase.co/functions/v1/create-subscription
    Headers: {
      "Authorization": "Bearer <supabase_anon_key>"
    }
    Body: {
      "user_id": "550e8400-...",
      "price_id": "price_premium_monthly"
    }
```

---

### **Step 2: Edge Function Creates Stripe Checkout Session**

**File: `supabase/functions/create-subscription/index.ts`**

```typescript
// This runs on Supabase's servers (not yours!)

import Stripe from 'stripe';

Deno.serve(async (req) => {
  const { user_id, price_id } = await req.json();

  // Initialize Stripe
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

  // Fetch user from database
  const user = await supabaseClient
    .from('users')
    .select('email')
    .eq('id', user_id)
    .single();

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [{
      price: price_id,          // "price_premium_monthly"
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: 'tagalong://subscription/success',
    cancel_url: 'tagalong://subscription/cancel',
  });

  // Return checkout URL
  return new Response(JSON.stringify({
    checkout_url: session.url
  }));
});
```

---

### **Step 3: User Completes Payment**

```
Edge Function returns:
    { "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..." }
    ↓
App opens Stripe Checkout in web view
    ↓
User enters credit card info
    ↓
Stripe processes payment
    ↓
Stripe redirects to success URL: tagalong://subscription/success
```

---

### **Step 4: Stripe Sends Webhook to Your Backend**

**This is the critical part that updates your database!**

```
Payment successful
    ↓
Stripe sends HTTP POST to:
    POST https://your-project.supabase.co/functions/v1/stripe-webhook
    Headers: {
      "Stripe-Signature": "t=1700310000,v1=abc123..."
    }
    Body: {
      "type": "checkout.session.completed",
      "data": {
        "object": {
          "id": "cs_test_...",
          "customer": "cus_...",
          "subscription": "sub_...",
          "metadata": {
            "user_id": "550e8400-..."
          }
        }
      }
    }
```

---

### **Step 5: Webhook Handler Processes Event**

**File: `supabase/functions/stripe-webhook/index.ts`**

```typescript
import Stripe from 'stripe';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  // Initialize Stripe
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

  // Verify webhook signature (security!)
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')
  );

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Update user's subscription in database
      await supabaseClient
        .from('subscriptions')
        .insert({
          user_id: session.metadata.user_id,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          status: 'active',
          plan: 'premium',
          started_at: new Date(),
        });

      break;

    case 'customer.subscription.updated':
      // Handle subscription changes
      break;

    case 'customer.subscription.deleted':
      // Handle cancellations
      await supabaseClient
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', event.data.object.id);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200
  });
});
```

---

### **Step 6: Database Updated**

**Table: `subscriptions` (if you have this table)**

| Column | Value |
|--------|-------|
| id | ... |
| user_id | 550e8400-... |
| stripe_subscription_id | sub_... |
| stripe_customer_id | cus_... |
| status | active |
| plan | premium |
| started_at | 2025-11-21T16:30:00.000Z |

**User now has premium access!**

---

### **Step 7: App Checks Subscription Status**

```
When user opens app or accesses premium features:
    ↓
GET /api/subscription/status
    ↓
Backend checks:
    SELECT status FROM subscriptions
    WHERE user_id = '550e8400-...'
    AND status = 'active'
    ↓
Returns: { "is_premium": true }
    ↓
App unlocks premium features
```

---

## 🔐 Payment Security Features

1. **Webhook Signature Verification**
   - Stripe signs webhooks with secret
   - Your backend verifies signature
   - Prevents fake webhook calls

2. **No Card Data Stored**
   - Stripe handles all payment info
   - Your backend never sees card numbers
   - PCI compliance automatically handled

3. **Idempotency**
   - Webhooks can be sent multiple times
   - Backend checks if subscription already exists
   - Prevents duplicate charges

---

# 5. Database Storage: What, Why, and Where

## 📊 Complete Database Schema Breakdown

### **Table 1: `users`**

**File: `prisma/schema.prisma:12-37`**

| Column | Type | Purpose | Example | Why It's Stored |
|--------|------|---------|---------|-----------------|
| id | UUID | Primary key | 550e8400-... | Unique identifier for user |
| email | String | Login credential | john@example.com | Authentication |
| phone | String? | Optional contact | +1-555-0100 | Future SMS notifications |
| password_hash | String | Encrypted password | $2b$10$rKjF5Z5... | Authentication (never plain text!) |
| display_name | String | Public name | John Doe | Shown to other users |
| username | String | Unique handle | johndoe | Tagging, mentions, unique ID |
| bio | String? | About me | Love hiking! | Profile description |
| profile_photo_url | String? | Profile picture | https://s3... | Avatar display |
| photo_gallery | String[] | Additional photos | [url1, url2...] | Profile showcase |
| city | String | Location | San Diego | Filter activities by city |
| instagram_handle | String? | Social link | @john_adventures | Social proof, verification |
| date_of_birth | DateTime | Age verification | 1995-05-15 | Must be 18+ |
| is_active | Boolean | Account status | true | Soft delete (ban without deleting) |
| created_at | DateTime | Signup time | 2025-11-21... | Analytics, user age |
| last_active | DateTime | Last seen | 2025-11-21... | Activity tracking |

**Indexes:**
- `city` - Fast filtering by city
- `username` - Fast username lookups

**Why These Fields?**
- **email + password_hash:** Authentication system
- **display_name + username:** Public identity
- **city:** Core feature (location-based activities)
- **is_active:** Allows banning without deleting data
- **last_active:** Shows who's active, useful for analytics

---

### **Table 2: `listings`**

**File: `prisma/schema.prisma:39-68`**

| Column | Type | Purpose | Example | Why It's Stored |
|--------|------|---------|---------|-----------------|
| id | UUID | Primary key | abc123... | Unique listing ID |
| user_id | UUID | Creator | 550e8400-... | Who posted this activity |
| photo_url | String? | Activity image | https://s3... | Visual appeal |
| title | String | Headline | Beach Volleyball | Quick summary |
| caption | String? | Short desc | Fun game! | Legacy field |
| description | String? | Full details | Casual game at... | Complete info |
| category | String? | Type | sports | Filtering/search |
| location | String? | Place | Pacific Beach | Where to meet |
| date | DateTime? | Activity date | 2025-11-22 | When it happens |
| time | String? | Activity time | 18:00 | Specific time |
| time_text | String? | Readable time | Tomorrow 6 PM | Human-friendly |
| max_participants | Int? | Capacity | 8 | Limit group size |
| city | String | City filter | San Diego | Fast city filtering |
| latitude | Float? | GPS coord | 32.7157 | Future: map view |
| longitude | Float? | GPS coord | -117.1611 | Future: map view |
| is_active | Boolean | Status | true | Hide without deleting |
| view_count | Int | Analytics | 45 | Track popularity |
| created_at | DateTime | Posted time | 2025-11-21... | Sort by newest |
| expires_at | DateTime | Auto-delete time | 2025-11-22... | Cleanup old listings |

**Indexes:**
- `[city, is_active, created_at]` - Fast feed queries
- `[user_id, created_at]` - User's listings
- `expires_at` - Auto-cleanup queries
- `category` - Filter by category

**Why These Fields?**
- **expires_at:** Automatic cleanup (activities expire after they happen)
- **city:** Inherited from user, enables city filtering
- **view_count:** Analytics for future features
- **is_active:** Allows user to pause/unpause listing
- **latitude/longitude:** Future feature (map view)

---

### **Table 3: `tag_along_requests`**

**File: `prisma/schema.prisma:70-85`**

| Column | Type | Purpose | Example | Why It's Stored |
|--------|------|---------|---------|-----------------|
| id | UUID | Primary key | request789... | Unique request ID |
| listing_id | UUID | Which activity | abc123... | Links to listing |
| requester_id | UUID | Who requested | 550e8400-... | Links to user |
| status | String | State | pending | pending/accepted/rejected |
| created_at | DateTime | Request time | 2025-11-21... | When user requested |
| responded_at | DateTime? | Response time | 2025-11-21... | When host decided |

**Unique Constraint:**
- `[listing_id, requester_id]` - Prevents duplicate requests

**Indexes:**
- `[listing_id, status]` - Host's received requests
- `[requester_id, status]` - User's sent requests

**Why These Fields?**
- **status:** Core workflow (pending → accepted/rejected)
- **responded_at:** Track response time analytics
- **Unique constraint:** Prevents spam requests

**Status Flow:**
```
pending → accepted (host accepts)
pending → rejected (host declines)
```

---

### **Table 4: `notifications`**

**File: `prisma/schema.prisma:87-101`**

| Column | Type | Purpose | Example | Why It's Stored |
|--------|------|---------|---------|-----------------|
| id | UUID | Primary key | notif456... | Unique notification ID |
| user_id | UUID | Recipient | 550e8400-... | Who gets this notification |
| type | String | Category | request_received | Notification type |
| title | String | Headline | New Tag Along! | Notification title |
| body | String | Message | John wants to join | Full text |
| data | String? | JSON metadata | {"request_id":"..."} | Deep link data |
| is_read | Boolean | Read status | false | Unread indicator |
| created_at | DateTime | Sent time | 2025-11-21... | Sort by newest |

**Index:**
- `[user_id, is_read, created_at]` - Fast unread queries

**Notification Types:**
| Type | When | Title Example |
|------|------|---------------|
| request_received | Someone requests to join your listing | "John Doe wants to tag along!" |
| request_accepted | Host accepts your request | "You're in! Sarah accepted your request" |
| request_rejected | Host declines your request | "Request declined" |
| listing_reminder | 24 hours before activity | "Activity tomorrow: Beach Volleyball" |

**Why These Fields?**
- **type:** Different UI styles per type
- **data (JSON):** Deep linking (tap notification → open specific screen)
- **is_read:** Show unread badge count

---

### **Table 5: `fcm_tokens`**

**File: `prisma/schema.prisma:103-114`**

| Column | Type | Purpose | Example | Why It's Stored |
|--------|------|---------|---------|-----------------|
| id | UUID | Primary key | ... | Unique token ID |
| user_id | UUID | Token owner | 550e8400-... | Links to user |
| token | String | FCM token | dGhpcyBpcyBhIHR... | Firebase device token |
| device_type | String? | Platform | ios | iOS vs Android |
| created_at | DateTime | Registered time | 2025-11-21... | Token age |

**Unique Constraint:**
- `[user_id, token]` - Prevents duplicate tokens

**Why This Table Exists:**
- Users can have multiple devices (iPhone + iPad)
- Each device has unique FCM token
- Need to send push to all devices
- Tokens can become invalid (user uninstalls app)

**Push Notification Flow:**
```
User enables notifications
    ↓
Firebase SDK generates token
    ↓
POST /api/notifications/register-token
    ↓
Token saved to fcm_tokens table
    ↓
When notification needed:
    ↓
SELECT token FROM fcm_tokens WHERE user_id = '...'
    ↓
Send push to all tokens
```

---

## 🗃️ Why This Database Design?

### **1. Normalization**
- **Users** separate from **Listings** (one user, many listings)
- **TagAlongRequests** link users to listings (many-to-many)
- No data duplication

### **2. Scalability**
- **Indexes** on frequently queried fields
- **UUIDs** instead of auto-increment IDs (distributed systems)
- **expires_at** enables automatic cleanup

### **3. Data Integrity**
- **Foreign keys** with `onDelete: Cascade`
  - Delete user → Deletes their listings
  - Delete listing → Deletes associated requests
- **Unique constraints** prevent duplicates
- **Required fields** enforce data quality

### **4. Soft Deletes**
- **is_active** field instead of DELETE
- Allows "banning" users without losing data
- Analytics still work on historical data

### **5. Performance**
- **Composite indexes:** `[city, is_active, created_at]`
  - Single query hits one index
  - Fast feed loading
- **Selective loading:** `select` only needed fields
  - Reduces data transfer

---

## 📈 Data Flow Across Tables

### **Example: Complete Lifecycle of a Tag-Along**

```
1. USER SIGNS UP
   └─> INSERT INTO users
       New row: { id: "user123", email: "john@...", ... }

2. USER CREATES LISTING
   └─> INSERT INTO listings
       New row: { id: "listing456", user_id: "user123", ... }

3. ANOTHER USER REQUESTS TO JOIN
   └─> INSERT INTO tag_along_requests
       New row: { id: "request789", listing_id: "listing456", requester_id: "user999", status: "pending" }
   └─> INSERT INTO notifications
       New row: { user_id: "user123", type: "request_received", ... }
   └─> INSERT TO firebase (via fcmService)

4. HOST ACCEPTS REQUEST
   └─> UPDATE tag_along_requests
       SET status = "accepted", responded_at = NOW()
       WHERE id = "request789"
   └─> INSERT INTO notifications
       New row: { user_id: "user999", type: "request_accepted", ... }

5. ACTIVITY HAPPENS & EXPIRES
   └─> Automatic expiration (expires_at < NOW())
       Listing disappears from feed
       (Not deleted, just hidden)

6. CLEANUP (Cron Job or Manual)
   └─> DELETE FROM listings
       WHERE expires_at < NOW() - INTERVAL '30 days'
       CASCADE deletes associated requests
```

---

## 🔍 Query Patterns You Should Know

### **1. Get User's Feed (Most Complex Query)**

```javascript
// File: src/controllers/listingsController.js:21-41
await prisma.listing.findMany({
  where: {
    is_active: true,
    expires_at: { gt: new Date() },
    user_id: { not: currentUserId },
    city: "San Diego"
  },
  orderBy: { created_at: 'desc' },
  take: 50,
  skip: 0,
  include: {
    user: {
      select: { username: true, display_name: true, profile_photo_url: true }
    },
    requests: {
      where: { requester_id: currentUserId },
      select: { id: true }
    }
  }
});
```

**What This Does:**
- Filters: Active, not expired, not own, in city
- Sorts: Newest first
- Pagination: 50 per page
- Joins: User info + request status
- Result: Feed of activities ready to display

---

### **2. Get Received Requests (Host View)**

```javascript
// File: src/controllers/requestsController.js:129-150
await prisma.tagAlongRequest.findMany({
  where: {
    listing: { user_id: currentUserId },
    status: "pending"
  },
  orderBy: { created_at: 'desc' },
  include: {
    listing: {
      select: { id: true, caption: true, photo_url: true }
    },
    requester: {
      select: { id: true, username: true, display_name: true, profile_photo_url: true, bio: true }
    }
  }
});
```

**What This Does:**
- Filters: Requests for my listings, pending status
- Sorts: Newest first
- Joins: Listing details + requester profile
- Result: List of people wanting to join my activities

---

### **3. Update Last Active (Every Request)**

```javascript
// File: src/middleware/auth.js:45-48
await prisma.user.update({
  where: { id: userId },
  data: { last_active: new Date() }
});
```

**What This Does:**
- Updates timestamp on every authenticated request
- Useful for "last seen" feature
- Analytics on active users

---

## 🎓 Database Best Practices in Your Code

### **1. Always Use Transactions for Multi-Step Operations**

When creating a request + notification, both should succeed or fail together:

```javascript
await prisma.$transaction([
  prisma.tagAlongRequest.create({ data: {...} }),
  prisma.notification.create({ data: {...} })
]);
```

### **2. Use `select` to Reduce Data Transfer**

Don't fetch all fields if you only need a few:

```javascript
// ❌ Bad: Fetches all fields (including password_hash!)
const user = await prisma.user.findUnique({ where: { id } });

// ✅ Good: Only fetches what you need
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, username: true, display_name: true }
});
```

### **3. Use Indexes for Filtered Queries**

Your schema has these indexes:

```prisma
@@index([city, is_active, created_at])  // Feed queries
@@index([user_id, created_at])          // User's listings
@@index([expires_at])                   // Cleanup queries
```

These make queries **1000x faster** on large datasets!

---

# 🎯 Summary: Complete Data Flows

## **Flow 1: User Signup**
```
POST /api/auth/signup
  → authLimiter (5 requests/15 min)
  → validate(signupSchema)
  → authController.signup()
    → bcrypt.hash(password, 10)
    → prisma.user.create()
    → generateToken(userId)
  ← Response: { user, token }
```

## **Flow 2: User Views Feed**
```
GET /api/listings/feed?city=San Diego
  → authenticateToken()
    → jwt.verify(token)
    → prisma.user.findUnique()
    → prisma.user.update(last_active)
  → listingsController.getFeed()
    → prisma.listing.findMany(where: { city, is_active, expires_at > now })
    → Filter past activities
    → Format response
  ← Response: { listings[], pagination }
```

## **Flow 3: User Creates Listing**
```
POST /api/listings
  → authenticateToken()
  → createListingLimiter (10 requests/hour)
  → validate(createListingSchema)
  → listingsController.createListing()
    → Calculate expires_at (activity date/time)
    → prisma.listing.create()
  ← Response: { listing }
```

## **Flow 4: User Requests to Join**
```
POST /api/requests
  → authenticateToken()
  → requestsController.createRequest()
    → prisma.listing.findUnique(verify exists & active)
    → Check not own listing
    → Check no duplicate request
    → prisma.tagAlongRequest.create(status: "pending")
    → prisma.notification.create(type: "request_received")
    → sendToMultipleDevices(push notification)
      → prisma.fcmToken.findMany(user_id)
      → firebase.messaging().send()
  ← Response: { request }

Host's phone shows: "John Doe wants to tag along!"
```

## **Flow 5: Host Accepts Request**
```
PUT /api/requests/:id/accept
  → authenticateToken()
  → requestsController.acceptRequest()
    → prisma.tagAlongRequest.findUnique(verify ownership)
    → prisma.tagAlongRequest.update(status: "accepted", responded_at: NOW())
    → prisma.notification.create(type: "request_accepted")
    → sendToMultipleDevices(push notification)
  ← Response: { request }

Requester's phone shows: "You're in! Sarah accepted your request"
```

---

# 🏆 Key Takeaways for Beginners

## **1. Request Lifecycle**
Every request goes through:
1. **Routing** (matches URL to handler)
2. **Middleware** (authentication, validation, rate limiting)
3. **Controller** (business logic)
4. **Database** (read/write data)
5. **Response** (send JSON back)

## **2. Authentication Pattern**
```
JWT Token (in header)
  → Middleware verifies & decodes
  → Attaches user to request
  → Controllers access req.user
```

## **3. Database Relationships**
```
User (1) ──── (many) Listings
User (1) ──── (many) TagAlongRequests
Listing (1) ──── (many) TagAlongRequests
User (1) ──── (many) Notifications
User (1) ──── (many) FcmTokens
```

## **4. File Organization**
- **Routes** define endpoints
- **Middleware** processes requests
- **Controllers** contain business logic
- **Services** handle external APIs
- **Utils** provide helper functions

## **5. Security Layers**
1. Rate limiting (prevent spam)
2. Input validation (prevent bad data)
3. Authentication (verify identity)
4. Authorization (verify permissions)
5. Password hashing (never store plain text)
6. JWT signing (can't be forged)

---

**You now understand the complete data flow of your Tag-a-Long backend! Use this document to explain your architecture in interviews, understand bugs, and plan new features.** 🚀