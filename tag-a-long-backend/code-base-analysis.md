# Tag-a-Long Backend - Complete Codebase Analysis

**Total Lines of Code:** 13,716 lines (excluding node_modules/dependencies)

---

## What is Tag-a-Long?

Tag-a-Long is a **social meetup platform** that lets people create activities (like hiking, coffee, gaming) and allows others to request to join them. Think of it like a social bulletin board where you post what you're doing and others can "tag along" if you approve them.

**Your Role:** You built the backend API - the server that handles all the data, user authentication, photo uploads, and business logic. A mobile app (the frontend) talks to your backend to make everything work.

---

## 🏗️ Project Architecture Overview

```
USER'S PHONE (React Native App)
         ↓
    YOUR BACKEND (Express API - What you built!)
         ↓
    DATABASE (PostgreSQL with Prisma)
         ↓
EXTERNAL SERVICES (AWS S3, Firebase, Stripe)
```

**Think of it like a restaurant:**
- Frontend = The dining room where customers order
- Your Backend = The kitchen that prepares orders
- Database = The pantry that stores ingredients
- External Services = Delivery trucks bringing special supplies

---

## 📁 Complete Directory Structure

### **Root Level** (`tag-a-long-backend/`)

```
tag-a-long-backend/
├── src/                    ← YOUR MAIN CODE LIVES HERE
├── prisma/                 ← DATABASE SETUP & MODELS
├── supabase/              ← ALTERNATIVE CLOUD SERVICES
├── node_modules/          ← DOWNLOADED LIBRARIES (auto-generated)
├── package.json           ← PROJECT SETTINGS & DEPENDENCIES
├── vercel.json            ← DEPLOYMENT CONFIGURATION
├── .env                   ← SECRET KEYS (never commit this!)
└── README.md              ← DOCUMENTATION
```

---

## 🎯 The `src/` Directory - Your Core Code

This is where **all your application logic** lives. Every feature you built is organized here.

### **1. `src/config/` - Configuration Files**

These files set up connections to external services.

| File | Purpose | Beginner Explanation |
|------|---------|---------------------|
| `database.js` | Creates a connection to PostgreSQL database | Like opening a phone line to talk to your database. Uses a "singleton pattern" so you only open one connection (important for Vercel serverless!) |
| `multer.js` | Configures file upload handling | Sets rules for how users can upload photos (max size, file types allowed) |
| `supabase.js` | Connects to Supabase cloud service | Backup storage option for images and data |

**Key Concept:** Configuration files are like "settings" - you set them once and the rest of your code uses them.

---

### **2. `src/controllers/` - Business Logic Handlers**

Controllers are the **brain of your app**. When a request comes in (like "create a listing"), the controller figures out what to do.

| File | What It Handles | Example Request |
|------|----------------|-----------------|
| `authController.js` | User signup & login | "Create an account with email and password" |
| `listingsController.js` | Activity posts (CRUD operations) | "Get all activities in San Diego" |
| `profileController.js` | User profiles | "Update my profile photo" |
| `requestsController.js` | Join requests (accept/reject) | "I want to join John's hiking trip" |
| `notificationsController.js` | Push notifications | "Send notification: Your request was accepted!" |
| `subscriptionController.js` | Stripe payments | "Upgrade to premium membership" |
| `webhookController.js` | External service callbacks | "Stripe says payment succeeded" |

**Beginner Analogy:** Think of controllers as **restaurant chefs**. Each chef specializes in a different dish (listings, profiles, etc.). When an order comes in, the right chef handles it.

**Flow Example:**
```
User taps "Create Activity" button
  ↓
App sends POST request to /api/listings
  ↓
listingsController.js receives request
  ↓
Validates data, uploads photo to S3, saves to database
  ↓
Returns success response to app
  ↓
App shows "Activity created!"
```

---

### **3. `src/middleware/` - Request Processing Pipeline**

Middleware are **gatekeepers**. Every request passes through them before reaching controllers.

| File | Purpose | When It Runs |
|------|---------|-------------|
| `auth.js` | Verifies JWT tokens | Before any protected endpoint (like creating listings) |
| `errorHandler.js` | Catches errors and formats responses | After something goes wrong |
| `rateLimiter.js` | Prevents spam (max 100 requests/min) | On every request |
| `validation.js` | Checks if data is correct format | Before controller logic runs |

**Beginner Analogy:** Middleware is like **airport security checkpoints**:
1. First checkpoint: Rate limiter (not too many bags)
2. Second checkpoint: Auth (show your boarding pass/token)
3. Third checkpoint: Validation (no liquids over 3oz/invalid data)
4. Finally: You board the plane (reach the controller)

**Request Pipeline:**
```
User Request
  ↓
helmet() - Adds security headers
  ↓
cors() - Allows cross-origin requests (app on phone, API on server)
  ↓
express.json() - Parses JSON data
  ↓
morgan() - Logs the request
  ↓
rateLimiter - Checks if user is spamming
  ↓
authenticateToken() - Verifies JWT
  ↓
validate() - Checks data with Joi schemas
  ↓
CONTROLLER - Does the actual work
  ↓
errorHandler() - Catches any errors
  ↓
Response sent back to user
```

---

### **4. `src/routes/` - API Endpoint Definitions**

Routes are like a **phone directory** - they map URLs to controller functions.

| File | URL Pattern | Methods | Purpose |
|------|------------|---------|---------|
| `auth.js` | `/api/auth/*` | POST | Signup & login |
| `profile.js` | `/api/profile/*` | GET, PUT, POST | View/edit profiles |
| `listings.js` | `/api/listings/*` | GET, POST, DELETE | Manage activities |
| `requests.js` | `/api/requests/*` | GET, POST, PUT | Tag-along requests |
| `notifications.js` | `/api/notifications/*` | GET, PUT, POST | Push notifications |
| `subscriptionRoutes.js` | `/api/subscription/*` | GET, POST, DELETE | Stripe billing |
| `webhookRoutes.js` | `/api/webhooks/*` | POST | External callbacks |

**Example from `auth.js`:**
```javascript
router.post('/signup', validate(signupSchema), authController.signup);
//           ↑                 ↑                      ↑
//        URL path      Validation check      Function to run
```

**Beginner Translation:**
- When someone sends a POST request to `/api/auth/signup`
- First run validation to check the data is correct
- Then call `authController.signup()` to create the account

---

### **5. `src/services/` - External Integrations**

Services handle communication with third-party platforms (not your database).

| File | Integration | What It Does |
|------|------------|--------------|
| `imageService.js` | AWS S3 | Uploads photos to cloud storage, resizes them with Sharp |
| `fcmService.js` | Firebase Cloud Messaging | Sends push notifications to users' phones |

**Why separate services from controllers?**
- Controllers focus on *what* to do
- Services focus on *how* to do it with external tools
- Makes code reusable (multiple controllers can use imageService)

**Example Flow:**
```
Controller: "I need to upload this photo"
   ↓
imageService.uploadImage(file)
   ↓
Service: Resizes image → Uploads to S3 → Returns public URL
   ↓
Controller: Saves URL to database
```

---

### **6. `src/utils/` - Utility Functions**

Utilities are **helper tools** used across the app.

| File | Purpose | Used By |
|------|---------|---------|
| `jwt.js` | Generates & verifies authentication tokens | authController, auth middleware |
| `validators.js` | Joi schemas for input validation | All routes (via validation middleware) |

**Beginner Explanation:**
- `jwt.js`: Creates secure tokens that prove a user is logged in (like a temporary password)
- `validators.js`: Rules for what data is allowed (e.g., "email must be valid format, password at least 6 chars")

---

### **7. `src/server.js` - Application Entry Point**

This is **THE** starting point. When you run `npm start`, this file executes.

**What it does:**
1. Loads environment variables (`.env`)
2. Creates Express app
3. Applies middleware (security, parsing, logging)
4. Registers routes (`/api/auth`, `/api/listings`, etc.)
5. Starts listening on port 3000

**Beginner Analogy:** `server.js` is like the **main switch** that turns on your restaurant:
- Opens the doors (starts server)
- Trains the staff (loads middleware)
- Posts the menu (registers routes)
- Welcomes customers (handles requests)

---

## 🗄️ The `prisma/` Directory - Database Layer

Prisma is an **ORM** (Object-Relational Mapping) - it lets you talk to your database using JavaScript instead of raw SQL.

### **Files:**

| File | Purpose |
|------|---------|
| `schema.prisma` | Defines your database structure (tables, columns, relationships) |
| `migrations/` | History of database changes over time |

### **Database Schema (5 Main Tables):**

#### **1. User Table**
Stores user accounts and profiles.

**Fields:**
- `id` - Unique identifier
- `email` - Login email
- `password_hash` - Encrypted password (never store plain passwords!)
- `display_name` - Name shown to others
- `username` - Unique @handle
- `bio` - About me text
- `profile_photo_url` - Link to profile picture
- `photo_gallery` - Array of photo URLs
- `city` - Location for filtering activities
- `instagram_handle` - Optional Instagram link
- `date_of_birth` - Age verification
- `is_active` - Account status
- `created_at` - Signup timestamp
- `last_active` - Last seen online

**Relationships:**
- One user can create many listings
- One user can make many tag-along requests
- One user can receive many notifications

---

#### **2. Listing Table**
Activities that users post.

**Fields:**
- `id` - Unique identifier
- `user_id` - Who created this activity
- `photo_url` - Activity image
- `title` - Short headline
- `caption` - Brief description
- `description` - Full details
- `category` - Type (hiking, food, gaming, etc.)
- `location` - Address/place name
- `date` - Activity date
- `time` - Activity time
- `time_text` - Human-readable time ("Tomorrow at 3pm")
- `max_participants` - How many can join
- `city` - City for filtering
- `latitude` / `longitude` - GPS coordinates
- `is_active` - Still available?
- `view_count` - How many people viewed it
- `created_at` - Posted timestamp
- `expires_at` - Auto-delete date (optional)

**Relationships:**
- Belongs to one user (the creator)
- Can have many tag-along requests

---

#### **3. TagAlongRequest Table**
Requests to join someone's activity.

**Fields:**
- `id` - Unique identifier
- `listing_id` - Which activity they want to join
- `requester_id` - Who wants to join
- `status` - "pending", "accepted", or "rejected"
- `created_at` - Request timestamp
- `responded_at` - When host accepted/rejected

**Rules:**
- One person can only request to join the same activity once
- Requests are tied to both a listing and a user

---

#### **4. Notification Table**
In-app and push notifications.

**Fields:**
- `id` - Unique identifier
- `user_id` - Who receives this notification
- `type` - Category (request_received, request_accepted, etc.)
- `title` - Notification headline
- `body` - Full message
- `data` - JSON metadata (listing_id, requester info, etc.)
- `is_read` - Has user seen it?
- `created_at` - Timestamp

**Use Case:**
When someone requests to join your activity, you get a notification like:
```
Title: "New Tag Along Request"
Body: "@john_doe wants to join your Hiking Trip"
Data: { listing_id: 123, requester_id: 456 }
```

---

#### **5. FcmToken Table**
Firebase push notification tokens.

**Fields:**
- `id` - Unique identifier
- `user_id` - Token owner
- `token` - Firebase device token (long string)
- `device_type` - "ios" or "android"
- `created_at` - Timestamp

**Why this exists:**
- When users enable push notifications, Firebase gives their device a unique token
- You store this token to send notifications later
- One user can have multiple tokens (e.g., iPhone + iPad)

---

### **Prisma Usage Example:**

**Without Prisma (Raw SQL):**
```javascript
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

**With Prisma (JavaScript):**
```javascript
const user = await prisma.user.findUnique({ where: { id: userId } });
```

**Benefits:**
- Type-safe (autocomplete in VS Code)
- Prevents SQL injection
- Automatic relationship loading
- Easy migrations

---

## ☁️ The `supabase/` Directory - Alternative Cloud Platform

Supabase is a **backend-as-a-service** (like Firebase) that provides:
- Database hosting
- Authentication
- Storage
- Edge Functions (serverless functions)

You use Supabase for:
1. **Stripe webhooks** (handled by Supabase Edge Functions)
2. **Database migrations** (SQL files in `migrations/`)
3. **Alternative storage** (instead of AWS S3)

### **Structure:**

```
supabase/
├── functions/          ← Serverless functions (Deno/TypeScript)
│   ├── stripe-webhook/
│   ├── create-subscription/
│   └── cancel-subscription/
│
└── migrations/        ← SQL scripts to set up database
    ├── 01_create_tables.sql
    ├── 02_row_level_security.sql
    ├── 03_functions.sql
    ├── 04_storage.sql
    ├── 05_safety_features.sql
    ├── 06_categories.sql
    ├── 07_subscriptions.sql
    └── [more migrations...]
```

### **Key Migrations:**

| File | What It Does |
|------|-------------|
| `01_create_tables.sql` | Creates initial database tables |
| `02_row_level_security.sql` | Security rules (users can only edit their own data) |
| `03_functions.sql` | Database helper functions |
| `04_storage.sql` | Sets up file storage buckets |
| `05_safety_features.sql` | User blocking/reporting features |
| `06_categories.sql` | Activity categories (hiking, food, etc.) |
| `07_subscriptions.sql` | Premium membership tables |

### **Edge Functions (Supabase Functions):**

These run on **Supabase's servers** (not yours). Written in **Deno** (like Node.js but newer).

**Why use them?**
- Stripe webhooks need to run reliably
- Serverless = no server maintenance
- Auto-scaling

---

## 📦 Configuration Files

### **1. `package.json` - Project Manifest**

This file tells Node.js:
- What your project is called
- What version it is
- What libraries (dependencies) it needs
- What commands you can run

**Key Sections:**

```json
{
  "name": "tag-a-long-backend",
  "version": "2.0.1",

  "scripts": {
    "start": "node src/server.js",           // Production mode
    "dev": "nodemon src/server.js",          // Development (auto-restart)
    "prisma:generate": "prisma generate",    // Update Prisma client
    "prisma:migrate": "prisma migrate dev"   // Run database migrations
  },

  "dependencies": {
    "express": "^4.18.2",                    // Web framework
    "@prisma/client": "^5.7.0",              // Database ORM
    "bcrypt": "^5.1.1",                      // Password hashing
    "jsonwebtoken": "^9.0.2",                // JWT tokens
    "@aws-sdk/client-s3": "^3.908.0",        // AWS S3 uploads
    "firebase-admin": "^12.0.0",             // Push notifications
    "stripe": "^14.25.0",                    // Payments
    "multer": "^1.4.5-lts.1",                // File uploads
    "sharp": "^0.33.1",                      // Image processing
    "joi": "^17.11.0",                       // Validation
    "helmet": "^7.1.0",                      // Security
    "cors": "^2.8.5"                         // Cross-origin requests
  }
}
```

**Beginner Explanation:**
- `dependencies` = Libraries you downloaded to help build your app
- `scripts` = Shortcuts for common commands
  - `npm run dev` runs `nodemon src/server.js`
  - `npm start` runs `node src/server.js`

---

### **2. `vercel.json` - Deployment Configuration**

Tells Vercel (hosting platform) how to run your app.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",     // Entry point
      "use": "@vercel/node"        // Use Node.js runtime
    }
  ],
  "routes": [
    {
      "src": "/(.*)",              // All requests
      "dest": "src/server.js"      // Go to server.js
    }
  ]
}
```

**What it means:**
- Run `src/server.js` using Node.js
- Send all traffic to that file
- Vercel will handle serverless scaling automatically

---

### **3. `.env` - Environment Variables**

**CRITICAL:** This file contains **secret keys** and is **NEVER committed to git** (it's in `.gitignore`).

**Example contents:**
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=super-secret-key-min-32-characters
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_SECRET_KEY=sk_test_...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

**Why environment variables?**
- Different values for development vs. production
- Keeps secrets out of code
- Easy to change without redeploying

**How to use in code:**
```javascript
const secret = process.env.JWT_SECRET;
```

---

### **4. `.gitignore` - Files NOT in Version Control**

Tells Git to ignore:
- `node_modules/` - Downloaded dependencies (huge!)
- `.env` - Secret keys
- `dist/` - Build artifacts
- `.DS_Store` - Mac system files

**Why?**
- Keeps repo small
- Protects secrets
- Only tracks source code

---

## 🔄 How Data Flows Through Your App

### **Example: User Creates a Listing**

```
1. USER ACTION
   User fills out "Create Activity" form in app
   Taps "Post Activity" button

2. APP SENDS REQUEST
   POST /api/listings
   Headers: { Authorization: "Bearer <jwt_token>" }
   Body: {
     title: "Beach Volleyball",
     description: "Casual game at Sunset Cliffs",
     category: "sports",
     date: "2025-11-22",
     time: "18:00",
     location: "Sunset Cliffs, San Diego",
     city: "San Diego",
     max_participants: 8,
     photo: <image_file>
   }

3. YOUR BACKEND RECEIVES REQUEST
   ↓
   src/server.js routes to listings.js

4. MIDDLEWARE PIPELINE
   ↓
   helmet() - Adds security headers
   ↓
   cors() - Allows cross-origin
   ↓
   express.json() - Parses body
   ↓
   rateLimiter - Checks rate limit (OK)
   ↓
   authenticateToken() - Verifies JWT
     → Decodes token → Extracts user_id
     → Fetches user from database
     → Attaches to req.user
   ↓
   validate(listingSchema) - Validates data
     → Checks title is 3-100 chars
     → Checks date is in future
     → Checks category is valid
     → All pass ✓

5. CONTROLLER LOGIC
   ↓
   listingsController.createListing() runs
   ↓
   Calls imageService.uploadImage(photo)
     → Resizes to 1080x1080
     → Uploads to AWS S3
     → Returns public URL
   ↓
   Creates database record:
     prisma.listing.create({
       data: {
         user_id: req.user.id,
         title: "Beach Volleyball",
         description: "...",
         photo_url: "https://s3.amazonaws.com/...",
         category: "sports",
         city: "San Diego",
         // ... other fields
       }
     })
   ↓
   Database returns created listing with id

6. RESPONSE SENT
   ↓
   Status: 201 Created
   Body: {
     success: true,
     data: {
       id: 456,
       title: "Beach Volleyball",
       photo_url: "https://...",
       user: {
         id: 123,
         username: "beach_lover",
         profile_photo_url: "..."
       },
       created_at: "2025-11-21T10:30:00Z"
     }
   }

7. APP UPDATES UI
   Shows "Activity posted!" message
   Adds new listing to user's profile
```

---

### **Example: User Requests to Join Activity**

```
1. USER ACTION
   User sees listing on feed
   Taps "Tag Along" button

2. APP SENDS REQUEST
   POST /api/requests
   Body: { listing_id: 456 }

3. BACKEND PROCESSES
   ↓
   requestsController.createRequest() runs
   ↓
   Checks if listing is still active
   ↓
   Checks if user already requested (prevent duplicates)
   ↓
   Creates tag_along_request record:
     status: "pending"
     listing_id: 456
     requester_id: 789
   ↓
   Fetches listing owner (user_id: 123)
   ↓
   Creates notification for owner:
     type: "new_request"
     user_id: 123
     title: "New Tag Along Request"
     body: "@surfer_dude wants to join Beach Volleyball"
   ↓
   Sends push notification via fcmService:
     → Looks up owner's FCM tokens
     → Sends via Firebase Admin SDK
     → Notification appears on owner's phone

4. RESPONSE
   Status: 201 Created
   Body: { success: true, request_id: 999 }

5. APP UPDATES
   Button changes to "Request Pending"
```

---

## 🔐 Authentication System Explained

### **How JWT Tokens Work**

**JWT** = JSON Web Token (a secure, encoded string)

**Why use tokens instead of sessions?**
- Stateless (no server memory needed)
- Works across multiple servers
- Perfect for mobile apps

### **Token Lifecycle:**

```
1. USER SIGNS UP
   POST /api/auth/signup
   ↓
   authController.signup()
     → Hash password with bcrypt
     → Create user in database
     → Generate JWT token:
       {
         userId: 123,
         email: "user@example.com",
         iat: 1637520000,           // Issued at
         exp: 1638124800            // Expires in 7 days
       }
     → Sign with JWT_SECRET
   ↓
   Return token to app

2. APP STORES TOKEN
   Saves in secure storage (AsyncStorage, Keychain)

3. APP MAKES REQUESTS
   Every request includes header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

4. BACKEND VERIFIES TOKEN
   authenticateToken() middleware runs
     → Extracts token from header
     → Verifies signature with JWT_SECRET
     → Decodes payload
     → Fetches user from database
     → Attaches to req.user

5. TOKEN EXPIRES
   After 7 days, token becomes invalid
   User must log in again
```

### **Password Security:**

**Hashing with bcrypt:**
```javascript
// Signup
const passwordHash = await bcrypt.hash(password, 10);
//                                                ↑
//                                        Salt rounds (10 = very secure)

// Login
const isValid = await bcrypt.compare(password, user.password_hash);
//                                      ↑                ↑
//                              User input      Stored hash
```

**Why hash?**
- If database is leaked, hackers can't read passwords
- Each password gets unique "salt" (random data)
- Bcrypt is intentionally slow (prevents brute-force)

---

## 📸 Image Upload System

### **Flow:**

```
1. USER SELECTS PHOTO
   App opens camera/photo picker
   User chooses image

2. APP SENDS TO BACKEND
   POST /api/profile/me/photo
   Content-Type: multipart/form-data
   Body: <binary_image_data>

3. MULTER MIDDLEWARE PROCESSES
   multer.single('photo') runs
   ↓
   Checks file size (< 5MB)
   Checks file type (image/jpeg, image/png)
   ↓
   Saves to memory buffer (not disk)

4. CONTROLLER CALLS IMAGE SERVICE
   imageService.uploadProfileImage(file, userId)
   ↓
   Uses Sharp library:
     → Resize to 1080x1080
     → Convert to JPEG
     → Compress (quality: 85)
   ↓
   Uploads to AWS S3:
     Bucket: tagalong-photos
     Key: profiles/123/photo-1637520000.jpg
     ACL: public-read
   ↓
   Returns public URL:
     https://tagalong-photos.s3.us-west-1.amazonaws.com/profiles/123/photo-1637520000.jpg

5. UPDATE DATABASE
   prisma.user.update({
     where: { id: 123 },
     data: { profile_photo_url: "https://..." }
   })

6. RESPONSE
   Return URL to app
   App displays new photo
```

**Why AWS S3?**
- Scalable (unlimited storage)
- Fast global CDN
- Reliable (99.999999999% durability)
- Cheap ($0.023 per GB/month)

---

## 🔔 Push Notification System

### **Components:**

1. **Firebase Cloud Messaging (FCM)** - Google's push service
2. **APNs** - Apple Push Notification service (for iOS)
3. **Your fcmService.js** - Wrapper around Firebase Admin SDK

### **Setup Flow:**

```
1. APP STARTS
   User opens app for first time
   ↓
   Firebase SDK generates device token
   (Unique string like: "dGhpcyBpcyBhIHRva2Vu...")

2. APP REGISTERS TOKEN
   POST /api/notifications/register-token
   Body: {
     token: "dGhpcyBpcyBhIHRva2Vu...",
     device_type: "ios"
   }
   ↓
   Backend saves to fcm_tokens table

3. NOTIFICATION TRIGGERED
   Example: Someone requests to join your activity
   ↓
   requestsController creates notification record
   ↓
   Calls fcmService.sendToUser(userId, notification)
   ↓
   Looks up user's FCM tokens
   ↓
   Sends via Firebase Admin SDK:
     → Firebase servers deliver to device
     → Notification appears on lock screen
     → User taps → App opens to request details
```

### **Notification Types:**

| Type | Title | When |
|------|-------|------|
| `new_request` | "New Tag Along Request" | Someone wants to join your activity |
| `request_accepted` | "Request Accepted!" | Host approved your request |
| `request_rejected` | "Request Declined" | Host declined your request |
| `listing_reminder` | "Activity Tomorrow" | 24 hours before activity |

---

## 💳 Payment System (Stripe)

### **Architecture:**

```
USER'S PHONE
     ↓
STRIPE MOBILE SDK (handles payment UI)
     ↓
STRIPE SERVERS (process payment)
     ↓
SUPABASE EDGE FUNCTIONS (your webhook handlers)
     ↓
YOUR DATABASE (update subscription status)
```

### **Why Supabase Edge Functions?**

- **Reliability**: Stripe webhooks must respond within 5 seconds
- **Security**: Webhook signature verification
- **Scalability**: Auto-scaling serverless

### **Subscription Flow:**

```
1. USER TAPS "UPGRADE TO PREMIUM"
   App calls Supabase function:
   POST https://your-project.supabase.co/functions/v1/create-subscription
   Body: { user_id: 123, price_id: "price_1234" }

2. EDGE FUNCTION CREATES STRIPE SESSION
   Calls Stripe API:
   stripe.checkout.sessions.create({
     customer_email: user.email,
     line_items: [{ price: "price_1234", quantity: 1 }],
     mode: "subscription"
   })
   ↓
   Returns checkout URL

3. APP OPENS STRIPE CHECKOUT
   User enters credit card info
   Stripe processes payment

4. STRIPE SENDS WEBHOOK
   POST https://your-project.supabase.co/functions/v1/stripe-webhook
   Body: {
     type: "checkout.session.completed",
     data: { subscription_id: "sub_123", customer_id: "cus_456" }
   }

5. WEBHOOK HANDLER UPDATES DATABASE
   prisma.subscription.create({
     user_id: 123,
     stripe_subscription_id: "sub_123",
     status: "active",
     plan: "premium"
   })

6. USER NOW HAS PREMIUM ACCESS
   Backend checks subscription status on requests
   Unlocks premium features in app
```

---

## 🚀 Deployment Architecture

### **Vercel Serverless Functions**

**What is serverless?**
- You don't manage servers
- Code runs on-demand
- Auto-scales from 0 to infinity
- Pay only for execution time

**How it works:**

```
USER REQUEST
     ↓
VERCEL EDGE NETWORK (routes to nearest region)
     ↓
SERVERLESS FUNCTION COLD START (if inactive >5 mins)
  ↓ Loads src/server.js
  ↓ Initializes Express
  ↓ Connects to database
     ↓
HANDLES REQUEST
     ↓
RESPONSE
     ↓
FUNCTION STAYS WARM (for next request)
```

**Cold Start Problem:**
- First request after inactivity = slow (1-2 seconds)
- Solution: Database singleton pattern prevents connection overload

### **Database Connection Management:**

**Problem:**
Serverless functions create new connections every invocation. PostgreSQL has a max connection limit (usually 100).

**Solution (in `database.js`):**
```javascript
// Singleton pattern - only ONE Prisma client instance
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Development: Reuse across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}
```

**Why this works:**
- Production: One client per function instance
- Development: One client across all hot reloads
- Prevents "too many connections" errors

---

## 🛡️ Security Features

### **1. Password Hashing (bcrypt)**
```javascript
// Signup
const hash = await bcrypt.hash(password, 10);
// Salt rounds = 10 (2^10 = 1024 iterations)

// Login
const valid = await bcrypt.compare(plainPassword, hash);
```

### **2. JWT Tokens**
- Signed with secret key (JWT_SECRET)
- Expire after 7 days
- Cannot be forged without secret

### **3. Rate Limiting**
```javascript
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 100,                 // 100 requests per minute
  message: 'Too many requests'
});
```

**Prevents:**
- Brute-force attacks
- API abuse
- DDoS attacks

### **4. Input Validation (Joi)**
```javascript
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  username: Joi.string().alphanum().min(3).max(30).required()
});
```

**Prevents:**
- SQL injection
- XSS attacks
- Invalid data

### **5. CORS**
```javascript
cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
});
```

**Prevents:**
- Unauthorized websites from calling your API
- Only your app can make requests

### **6. Helmet**
```javascript
helmet() // Adds security headers
```

**Sets headers like:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=...`

### **7. Stripe Webhook Verification**
```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(payload, sig, secret);
```

**Prevents:**
- Fake webhook calls
- Payment fraud

---

## 📊 File Categories Summary

### **BACKEND CORE** (Node.js/Express)
- `src/server.js` - Application entry point
- `src/config/*.js` - Service configurations
- `src/middleware/*.js` - Request pipeline
- `src/controllers/*.js` - Business logic
- `src/routes/*.js` - API endpoints
- `src/services/*.js` - External integrations
- `src/utils/*.js` - Helper functions

### **DATABASE** (Prisma/PostgreSQL)
- `prisma/schema.prisma` - Data models
- `prisma/migrations/` - Schema changes

### **CLOUD FUNCTIONS** (Supabase/Deno)
- `supabase/functions/` - Serverless endpoints
- `supabase/migrations/` - Database setup SQL

### **CONFIGURATION**
- `package.json` - Dependencies
- `vercel.json` - Deployment config
- `.env` - Secret keys
- `.gitignore` - Ignored files

### **DOCUMENTATION**
- `README.md` - Setup guide
- `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment steps
- `TESTING.md` - Test procedures
- `TEST_RESULTS.md` - Test coverage

---

## 🎓 Key Concepts for Beginners

### **1. REST API**
Your backend is a **REST API** (Representational State Transfer). It's like a menu at a restaurant:
- Each endpoint is a dish you can order
- HTTP methods are how you order:
  - `GET` = "Show me..." (read data)
  - `POST` = "Create..." (add new data)
  - `PUT` = "Update..." (change existing data)
  - `DELETE` = "Remove..." (delete data)

### **2. MVC Pattern**
Your code follows **MVC** (Model-View-Controller):
- **Model**: Prisma schema (data structure)
- **View**: JSON responses (what users see)
- **Controller**: Business logic (how things work)

### **3. Middleware**
Think of middleware as a **conveyor belt**:
- Request enters → Goes through each middleware → Reaches controller
- Each middleware can:
  - Modify the request
  - Stop the request (if invalid)
  - Add data (like authenticated user)

### **4. Environment Variables**
**Why use .env instead of hardcoding?**
```javascript
// BAD - Secret in code
const secret = 'my-secret-key-123';

// GOOD - Secret in .env
const secret = process.env.JWT_SECRET;
```
Benefits:
- Different values per environment (dev/prod)
- Secrets not in version control
- Easy to change without redeploying

### **5. Async/Await**
Your code uses **async/await** for database/API calls:
```javascript
// Without async/await (messy callbacks)
prisma.user.findUnique({ where: { id: 1 } })
  .then(user => {
    console.log(user);
  });

// With async/await (clean)
const user = await prisma.user.findUnique({ where: { id: 1 } });
console.log(user);
```

### **6. Error Handling**
```javascript
try {
  const user = await prisma.user.create({ data: {...} });
  res.json({ success: true, data: user });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
```
**Always:**
- Wrap async code in try/catch
- Log errors for debugging
- Return user-friendly messages

---

## 🔄 Development Workflow

### **Local Development**

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your keys

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run migrations
npm run prisma:migrate

# 5. Start dev server
npm run dev
# Server runs on http://localhost:3000
# Auto-restarts on code changes (nodemon)
```

### **Testing API Endpoints**

**Using curl:**
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (protected)
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer <your_token>"
```

### **Deployment to Vercel**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... (all .env variables)

# 4. Deploy
vercel --prod
```

---

## 📈 Project Stats

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | 13,716 |
| **Main Files** | 25+ JavaScript files |
| **API Endpoints** | 30+ routes |
| **Database Tables** | 5 models |
| **External Services** | AWS S3, Firebase, Stripe, Supabase |
| **Dependencies** | 30+ npm packages |
| **Middleware Layers** | 7 stages |
| **Prisma Migrations** | 10+ migrations |

---

## 🎯 What Makes This Backend Well-Architected?

1. **Separation of Concerns**
   - Routes define endpoints
   - Controllers handle logic
   - Services integrate externals
   - Middleware processes requests

2. **Security Best Practices**
   - Password hashing
   - JWT authentication
   - Rate limiting
   - Input validation
   - Helmet security headers

3. **Scalability**
   - Serverless deployment
   - Database connection pooling
   - Image CDN (S3)
   - Stateless authentication

4. **Error Handling**
   - Global error middleware
   - Try/catch in controllers
   - User-friendly messages

5. **Code Organization**
   - Clear folder structure
   - Reusable utilities
   - Modular design

6. **Database Design**
   - Proper indexes
   - Relationships defined
   - Migrations tracked

---

## 🚀 Next Steps for Learning

To become a world-class engineer, focus on:

### **1. Master These Concepts**
- [ ] HTTP methods (GET, POST, PUT, DELETE)
- [ ] REST API design principles
- [ ] Authentication (JWT, sessions, OAuth)
- [ ] Database design (normalization, indexes, relationships)
- [ ] Async programming (Promises, async/await)
- [ ] Error handling strategies
- [ ] Security (OWASP Top 10)

### **2. Understand These Patterns**
- [ ] MVC (Model-View-Controller)
- [ ] Middleware pipeline
- [ ] Singleton pattern
- [ ] Repository pattern
- [ ] Dependency injection

### **3. Learn These Tools**
- [ ] Git (version control)
- [ ] Docker (containerization)
- [ ] CI/CD (automated deployment)
- [ ] Monitoring (Sentry, Datadog)
- [ ] Testing (Jest, Supertest)

### **4. Practice These Skills**
- [ ] Read other people's code
- [ ] Refactor your own code
- [ ] Write tests
- [ ] Optimize performance
- [ ] Debug production issues

---

## 💡 Final Tips

**When explaining your code:**
1. Start with the big picture (what the app does)
2. Explain the request flow (user action → backend → response)
3. Highlight key technologies (Express, Prisma, AWS, Firebase)
4. Mention security features (authentication, validation, rate limiting)
5. Discuss scalability (serverless, CDN, database optimization)

**Common interview questions:**
- "How does authentication work?" → JWT tokens
- "How do you handle file uploads?" → Multer + S3
- "How do you prevent SQL injection?" → Prisma ORM + Joi validation
- "How does your app scale?" → Vercel serverless functions
- "What security measures did you implement?" → List 7 features above

**Remember:**
- You built a **production-ready** backend
- It handles **real users** and **real payments**
- It's **secure**, **scalable**, and **well-architected**
- You should be **proud** of this work!

---

**Good luck with your homework assignment!** You've built something impressive. Now go explain it with confidence!