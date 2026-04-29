# Tag-a-Long Backend - Complete Dependency Mapping

**A comprehensive inventory of everything your application depends on**

This document maps every external service, library, API endpoint, and database table in your system. For each dependency, you'll understand **WHY** it exists and **WHAT BREAKS** if it fails.

---

## Table of Contents

1. [External Cloud Services](#1-external-cloud-services)
2. [Major NPM Packages](#2-major-npm-packages)
3. [API Endpoints (Complete Route Map)](#3-api-endpoints-complete-route-map)
4. [Database Schema & Relationships](#4-database-schema--relationships)
5. [Third-Party Integrations](#5-third-party-integrations)
6. [Dependency Risk Matrix](#6-dependency-risk-matrix)
7. [What Happens When Things Fail](#7-what-happens-when-things-fail)

---

# 1. External Cloud Services

These are **paid services** your app can't function without. If any of these go down, parts of your app break.

---

## Service #1: **Vercel** (Hosting Platform)

### **What It Does:**
- Hosts your Express backend as serverless functions
- Provides automatic deployment (Git push → Live in 30 seconds)
- Auto-scaling (handles 1 user or 100,000 users)
- Global CDN for fast response times

### **Why It's Needed:**
Your backend code doesn't run on your laptop—it runs on Vercel's servers. Without Vercel, you'd need to:
- Rent your own server (AWS EC2, DigitalOcean, etc.)
- Configure Node.js environment
- Set up load balancers
- Manage deployments manually
- Pay for 24/7 server uptime

### **Configuration:**
**File:** `vercel.json`
```json
{
  "builds": [{ "src": "src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.js" }]
}
```

### **Cost:**
- **Hobby Plan:** FREE (10GB bandwidth, 100GB-hours compute)
- **Pro Plan:** $20/month (100GB bandwidth, 1000GB-hours compute)
- Your current usage: ~$0-5/month

### **What Breaks If Vercel Fails:**
| Scenario | Impact | Affected Features |
|----------|--------|-------------------|
| Vercel outage | **100% downtime** | Entire backend offline, app unusable |
| Deployment failure | New code doesn't deploy | Stuck on old version, can't ship bug fixes |
| Rate limit exceeded | **503 errors** | Users can't make requests |
| Bandwidth exceeded | Additional charges | Unexpected costs |

### **Backup Plan:**
- **Alternative:** Deploy to AWS Lambda, Railway, Render, or Fly.io
- **Migration Time:** 1-2 days (update deployment config)
- **Mitigation:** Monitor Vercel status page, set up status notifications

---

## Service #2: **PostgreSQL Database** (Data Storage)

### **What It Does:**
- Stores ALL your application data (users, listings, requests, notifications)
- Provides ACID transactions (data consistency)
- Handles concurrent queries
- Manages indexes for fast lookups

### **Provider:**
You don't specify in code, but likely one of:
- **Neon** (serverless Postgres)
- **Supabase** (Postgres + tools)
- **Railway** (managed Postgres)
- **AWS RDS** (enterprise Postgres)

### **Configuration:**
**Environment Variable:** `DATABASE_URL`
```
postgresql://user:password@host:5432/database?schema=public
```

### **Why It's Needed:**
This is your **single source of truth**. All data lives here:
- User accounts and profiles
- Activity listings
- Tag-along requests
- Notifications
- Device tokens

Without a database, your app has no memory—every restart loses all data.

### **Cost:**
- **Free Tier:** Neon, Supabase (~500MB storage)
- **Paid:** $10-20/month for 5GB storage
- **Enterprise:** $100-500/month for 100GB+

### **What Breaks If Database Fails:**
| Scenario | Impact | Affected Features |
|----------|--------|-------------------|
| Database offline | **100% downtime** | Entire app unusable (can't read/write data) |
| Connection limit exceeded | **500 errors** | New requests fail, users see errors |
| Storage full | Can't create data | No new signups, listings, or requests |
| Slow queries | Timeouts | Feed loads slowly, requests timeout |
| Data corruption | Data loss | Users, listings, or requests disappear |

### **Backup Plan:**
- **Daily Backups:** Most providers auto-backup daily
- **Point-in-Time Recovery:** Restore to any moment in last 7 days
- **Read Replicas:** Create read-only copy for failover
- **Migration Time:** 2-4 hours (export data → import to new DB)

---

## Service #3: **AWS S3** (Image Storage)

### **What It Does:**
- Stores user-uploaded images (profile photos, activity photos)
- Serves images globally via CDN
- Provides 99.999999999% durability (data never lost)
- Auto-scales to unlimited storage

### **Configuration:**
**Environment Variables:**
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-west-1
AWS_S3_BUCKET=tagalong-photos
```

**File:** `src/services/imageService.js`

### **Why It's Needed:**
You can't store images in your database (too slow, expensive). S3 is purpose-built for file storage:
- **Fast:** Global CDN delivers images quickly
- **Cheap:** $0.023/GB/month (database storage is $0.50/GB/month)
- **Unlimited:** Store millions of images without worrying about disk space

### **Cost:**
- **Storage:** $0.023 per GB per month
- **Bandwidth:** $0.09 per GB transferred
- **Estimated:** 1,000 users = ~10GB storage = $0.50/month
- **At Scale:** 100,000 users = ~1TB = $23/month

### **What Breaks If AWS S3 Fails:**
| Scenario | Impact | Affected Features |
|----------|--------|-------------------|
| S3 outage | Can't upload images | Users can't set profile photos or post activities with images |
| Bucket deleted | **All images lost** | All existing images show as broken |
| Credentials invalid | Upload failures | New uploads fail, old images still work |
| Bandwidth exceeded | Extra charges | Unexpected AWS bill |

### **Backup Plan:**
- **Alternative:** Cloudflare R2, DigitalOcean Spaces, Supabase Storage
- **Migration:** Re-upload all images to new provider (~1-2 days)
- **Mitigation:** Enable S3 versioning (recover deleted images)

---

## Service #4: **Firebase Cloud Messaging** (Push Notifications)

### **What It Does:**
- Sends push notifications to users' phones
- Manages device tokens (iOS, Android)
- Handles APNs (Apple) and FCM (Google) protocols
- Provides delivery reports

### **Configuration:**
**Environment Variables:**
```bash
FIREBASE_PROJECT_ID=tagalong-app
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tagalong-app.iam.gserviceaccount.com
```

**File:** `src/services/fcmService.js`

### **Why It's Needed:**
Push notifications are critical for engagement:
- "Someone wants to join your activity!" → 70% open rate
- Without push: Users miss requests, engagement drops 50%

Firebase is the **only free option** that works for both iOS and Android.

### **Cost:**
- **FREE** (unlimited messages)
- No paid tier needed for messaging (only for analytics)

### **What Breaks If Firebase Fails:**
| Scenario | Impact | Affected Features |
|----------|--------|-------------------|
| Firebase outage | No push notifications | Users don't know about new requests/acceptances |
| Invalid credentials | Push fails silently | Notifications created in DB, but not delivered |
| APNs certificate expired | iOS push fails | Android works, iOS doesn't receive notifications |
| Token invalid | Specific device fails | That user doesn't get notifications (others do) |

### **Impact on User Experience:**
| Without Push | With Push |
|--------------|-----------|
| User checks app every hour | User gets instant notification |
| Misses time-sensitive requests | Accepts requests immediately |
| 10% weekly engagement | 60% weekly engagement |

### **Backup Plan:**
- **Alternative:** OneSignal, Pusher, AWS SNS
- **Migration:** ~1 week (integrate new SDK, migrate tokens)
- **Mitigation:** In-app notifications still work (users see when they open app)

---

## Service #5: **Stripe** (Payment Processing)

### **What It Does:**
- Processes credit card payments
- Manages subscriptions (monthly/annual billing)
- Sends webhooks for payment events
- Provides fraud detection
- Handles PCI compliance (you don't touch card data)

### **Configuration:**
**Environment Variables:**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Files:**
- Backend: `src/controllers/subscriptionController.js`
- Webhooks: `supabase/functions/stripe-webhook/`

### **Why It's Needed:**
You **cannot** process credit cards yourself (PCI compliance nightmare). Stripe:
- Handles all payment security
- Stores card details (you never see them)
- Manages subscriptions automatically
- Provides legal compliance

### **Cost:**
- **Transaction Fee:** 2.9% + $0.30 per charge
- **Subscription Fee:** Same (2.9% + $0.30 per month)
- **No Monthly Fee**
- **Example:** $9.99/month subscription = $0.59 fee, you get $9.40

### **What Breaks If Stripe Fails:**
| Scenario | Impact | Affected Features |
|----------|--------|-------------------|
| Stripe outage | Can't process payments | New subscriptions fail, renewals delayed |
| Webhook fails | Subscription status out of sync | User pays but app doesn't unlock premium |
| API key revoked | All payments fail | Can't charge anyone |
| Account suspended | **Revenue stops** | All payment processing halted |

### **Revenue Impact:**
| Scenario | Monthly Loss (1,000 users @ $9.99/month) |
|----------|------------------------------------------|
| Stripe down 1 hour | ~$40 lost |
| Stripe down 1 day | ~$320 lost |
| Stripe down 1 week | ~$2,300 lost |

### **Backup Plan:**
- **Alternative:** PayPal, Square, Paddle
- **Migration:** 2-4 weeks (integrate new API, migrate customers)
- **Mitigation:** Monitor Stripe status, have fallback payment method

---

## Service #6: **Supabase** (Serverless Functions & Storage)

### **What It Does:**
- Hosts Edge Functions (Stripe webhook handlers)
- Provides alternative storage option
- Manages authentication (not currently used)
- Runs Deno-based serverless functions

### **Configuration:**
**Environment Variables:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Files:**
- `supabase/functions/stripe-webhook/`
- `supabase/functions/create-subscription/`
- `supabase/functions/cancel-subscription/`

### **Why It's Needed:**
Stripe webhooks need **ultra-reliable** hosting. Supabase Edge Functions:
- Must respond within 5 seconds (Stripe requirement)
- Auto-scale to handle webhook spikes
- Run on Deno (newer, faster runtime)
- Separate from main backend (isolation)

### **Cost:**
- **Free Tier:** 500,000 Edge Function invocations/month
- **Pro Tier:** $25/month (2 million invocations)
- Your usage: ~100-1,000/month = **FREE**

### **What Breaks If Supabase Fails:**
| Scenario | Impact | Affected Features |
|----------|--------|-------------------|
| Edge Functions offline | Webhooks fail | Payments succeed but app doesn't update subscription status |
| Function timeout | Stripe retries | Duplicate webhook handling (idempotency needed) |
| Storage full | Can't store images | Alternative to S3 breaks |

### **Backup Plan:**
- **Alternative:** Vercel Edge Functions, Cloudflare Workers
- **Migration:** 2-3 days (redeploy functions)
- **Mitigation:** Stripe retries webhooks for 3 days

---

# 2. Major NPM Packages

These are **open-source libraries** your code depends on. Updated via `npm install`.

---

## **Core Framework**

### **express** (v4.18.2)
- **What:** Web framework for Node.js
- **Why:** Handles HTTP requests, routing, middleware
- **What breaks:** Entire backend (Express IS your backend)
- **Alternatives:** Fastify, Koa, Hapi
- **Risk:** ⚠️ **CRITICAL** (no backend without this)

---

## **Database & ORM**

### **@prisma/client** (v5.7.0)
- **What:** Database ORM (Object-Relational Mapping)
- **Why:** Type-safe database queries, migrations, schema management
- **What breaks:** All database access (can't read/write data)
- **Alternatives:** TypeORM, Sequelize, raw SQL
- **Risk:** ⚠️ **CRITICAL** (no data access)

### **prisma** (v5.7.0) [devDependency]
- **What:** Prisma CLI for migrations and schema management
- **Why:** Generate Prisma Client, run migrations
- **What breaks:** Can't update database schema, can't generate types
- **Risk:** 🟡 **HIGH** (needed for development)

---

## **Authentication & Security**

### **bcrypt** (v5.1.1)
- **What:** Password hashing library
- **Why:** Securely hash passwords (can't store plain text!)
- **What breaks:** Signup, login (can't verify passwords)
- **Alternatives:** argon2, scrypt
- **Risk:** ⚠️ **CRITICAL** (authentication broken)

### **jsonwebtoken** (v9.0.2)
- **What:** JWT token generation & verification
- **Why:** Stateless authentication (no session storage needed)
- **What breaks:** All protected endpoints (can't verify users)
- **Alternatives:** Passport.js, Auth0
- **Risk:** ⚠️ **CRITICAL** (authentication broken)

### **helmet** (v7.1.0)
- **What:** Security HTTP headers
- **Why:** Prevents XSS, clickjacking, other attacks
- **What breaks:** App still works but LESS SECURE
- **Alternatives:** Manual header setting
- **Risk:** 🟢 **LOW** (app works, just less secure)

### **cors** (v2.8.5)
- **What:** Cross-Origin Resource Sharing
- **Why:** Allows mobile app to call your API
- **What breaks:** Mobile app can't make requests (CORS errors)
- **Alternatives:** Manual CORS headers
- **Risk:** ⚠️ **CRITICAL** (app can't call backend)

---

## **Cloud Services SDKs**

### **@aws-sdk/client-s3** (v3.908.0)
- **What:** AWS SDK v3 for S3
- **Why:** Upload images to S3
- **What breaks:** Image uploads fail (can still serve existing images)
- **Alternatives:** aws-sdk v2, direct HTTP API
- **Risk:** 🟡 **HIGH** (can't upload new images)

### **firebase-admin** (v12.0.0)
- **What:** Firebase Admin SDK
- **Why:** Send push notifications via FCM
- **What breaks:** Push notifications stop (in-app notifications still work)
- **Alternatives:** OneSignal, AWS SNS
- **Risk:** 🟡 **HIGH** (engagement drops without push)

### **stripe** (v14.25.0)
- **What:** Stripe SDK for Node.js
- **Why:** Process payments, manage subscriptions
- **What breaks:** Payment processing fails (can't charge users)
- **Alternatives:** PayPal SDK, Square
- **Risk:** ⚠️ **CRITICAL** (revenue stops)

### **@supabase/supabase-js** (v2.39.0)
- **What:** Supabase JavaScript client
- **Why:** Call Supabase Edge Functions, storage
- **What breaks:** Webhook handling breaks, alternative storage fails
- **Alternatives:** Direct HTTP API calls
- **Risk:** 🟡 **HIGH** (payment status sync breaks)

---

## **Validation & Input Processing**

### **joi** (v17.11.0)
- **What:** Schema validation library
- **Why:** Validate user input (email format, password strength)
- **What breaks:** Bad data enters database, errors increase
- **Alternatives:** Yup, Zod, class-validator
- **Risk:** 🟡 **HIGH** (data quality issues)

### **multer** (v1.4.5-lts.1)
- **What:** Multipart form data parser (file uploads)
- **Why:** Handle image uploads from mobile app
- **What breaks:** Can't upload images (file upload fails)
- **Alternatives:** busboy, formidable
- **Risk:** 🟡 **HIGH** (image upload broken)

### **sharp** (v0.33.1)
- **What:** Image processing library
- **Why:** Resize, compress, convert images
- **What breaks:** Images uploaded at full resolution (huge files, slow loading)
- **Alternatives:** jimp, ImageMagick
- **Risk:** 🟢 **MEDIUM** (app works but images huge/slow)

---

## **Rate Limiting & Abuse Prevention**

### **express-rate-limit** (v7.1.5)
- **What:** Rate limiting middleware
- **Why:** Prevent spam, DDoS attacks, brute-force
- **What breaks:** App vulnerable to abuse (spam signups, attacks)
- **Alternatives:** Manual rate limiting, Cloudflare
- **Risk:** 🟢 **MEDIUM** (app works but vulnerable)

---

## **Utilities**

### **dotenv** (v16.3.1)
- **What:** Load environment variables from `.env` file
- **Why:** Manage secrets, config (API keys, database URL)
- **What breaks:** Environment variables not loaded (app crashes on startup)
- **Alternatives:** Manual process.env setting
- **Risk:** ⚠️ **CRITICAL** (app won't start)

### **morgan** (v1.10.0)
- **What:** HTTP request logger
- **Why:** Log all requests for debugging
- **What breaks:** No request logs (harder to debug issues)
- **Alternatives:** winston, pino
- **Risk:** 🟢 **LOW** (app works, just no logging)

---

## **Development Tools** (devDependencies)

### **nodemon** (v3.0.2)
- **What:** Auto-restart on file changes
- **Why:** Faster development (no manual restarts)
- **What breaks:** Have to manually restart server in dev
- **Risk:** 🟢 **NONE** (dev tool only)

### **jest** (v30.2.0)
- **What:** Testing framework
- **Why:** Run automated tests
- **What breaks:** Can't run tests (not currently used)
- **Risk:** 🟢 **NONE** (no tests written yet)

---

# 3. API Endpoints (Complete Route Map)

**Total Endpoints:** 32 routes across 7 API sections

---

## **Section 1: Authentication** (`/api/auth`)

| Method | Endpoint | Purpose | Authentication | Rate Limit |
|--------|----------|---------|----------------|-----------|
| POST | `/api/auth/signup` | Create new user account | None | 50/15min |
| POST | `/api/auth/login` | Login with email/password | None | 50/15min |

**Total:** 2 endpoints

**Validation:**
- **Signup:** Email, password (8+ chars, uppercase/lowercase/number), username (3-50 alphanumeric), display_name, date_of_birth (18+), city
- **Login:** Email, password

**What They Return:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "username": "..." },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**What Breaks If These Fail:**
- Can't create accounts (no new users)
- Can't login (existing users locked out)

---

## **Section 2: User Profiles** (`/api/profile`)

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| GET | `/api/profile/me` | Get own profile | Required | Returns current user's full profile |
| GET | `/api/profile/:username` | Get user by username | None | Returns public profile (for viewing others) |
| GET | `/api/profile/by-id/:id` | Get user by ID | None | Returns public profile by UUID |
| GET | `/api/profile/search-users?query=...` | Search users | None | Search by display name or username |
| PUT | `/api/profile/me` | Update own profile | Required | Update display_name, bio, city, instagram |
| POST | `/api/profile/me/photo` | Upload profile photo | Required | Set profile_photo_url |
| POST | `/api/profile/gallery` | Add photo to gallery | Required | Add to photo_gallery array (max 5) |
| DELETE | `/api/profile/gallery` | Remove photo from gallery | Required | Remove specific photo from gallery |

**Total:** 8 endpoints

**Validation:**
- **Update:** display_name (2-100 chars), bio (max 150), city (2-100), instagram_handle (max 50)

**Example Response (GET /me):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-...",
    "email": "john@example.com",
    "display_name": "John Doe",
    "username": "johndoe",
    "bio": "Love hiking!",
    "city": "San Diego",
    "profile_photo_url": "https://...",
    "photo_gallery": ["https://...", "https://..."],
    "instagram_handle": "john_adventures",
    "created_at": "2025-11-21T10:30:00.000Z"
  }
}
```

**What Breaks If These Fail:**
- Can't view/edit profiles
- Can't search for users
- Can't upload profile photos

---

## **Section 3: Activity Listings** (`/api/listings`)

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| GET | `/api/listings/feed` | Get activity feed | Required | Returns paginated activities in user's city |
| GET | `/api/listings/my-listings` | Get own listings | Required | Returns user's created activities |
| GET | `/api/listings/:id` | Get single listing | Required | Returns specific activity details |
| POST | `/api/listings` | Create activity | Required | Post new activity (max 10/hour) |
| DELETE | `/api/listings/:id` | Delete activity | Required | Remove own listing |

**Total:** 5 endpoints

**Query Parameters (feed):**
- `city` - Filter by city (optional)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)
- `sort` - 'recent' or 'upcoming' (default: 'recent')

**Validation (POST /listings):**
- **title:** 3-200 chars
- **description:** 10-500 chars
- **category:** sports, food, entertainment, outdoor, fitness, social, other
- **location:** 2-200 chars
- **date:** Must be in future
- **time:** HH:MM format
- **max_participants:** 1-100

**Example Response (GET /feed):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "abc123...",
        "title": "Beach Volleyball",
        "description": "Casual game at Pacific Beach",
        "category": "sports",
        "location": "Pacific Beach",
        "date": "2025-11-22T00:00:00.000Z",
        "time": "18:00",
        "max_participants": 8,
        "photo_url": "https://...",
        "city": "San Diego",
        "user": {
          "username": "sarah_j",
          "display_name": "Sarah Johnson",
          "profile_photo_url": "https://..."
        },
        "has_requested": false
      }
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

**What Breaks If These Fail:**
- Can't view activities (core feature broken)
- Can't create activities (users can't post)
- Can't delete activities

---

## **Section 4: Tag-Along Requests** (`/api/requests`)

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| POST | `/api/requests` | Request to join activity | Required | Send join request to activity host |
| GET | `/api/requests/received` | Get received requests | Required | View requests for your activities |
| GET | `/api/requests/sent` | Get sent requests | Required | View your join requests |
| PUT | `/api/requests/:id/accept` | Accept request | Required | Approve someone's join request |
| PUT | `/api/requests/:id/reject` | Reject request | Required | Decline join request |

**Total:** 5 endpoints

**Query Parameters (received):**
- `status` - Filter by pending/accepted/rejected (optional)
- `listing_id` - Filter by specific listing (optional)

**Example Flow:**
```
1. User A creates "Beach Volleyball" listing
2. User B calls POST /api/requests { listing_id: "abc123" }
3. User A gets push notification
4. User A calls GET /api/requests/received
5. User A calls PUT /api/requests/:id/accept
6. User B gets push notification "You're in!"
```

**What Breaks If These Fail:**
- Can't request to join activities (social feature broken)
- Can't accept/reject requests (hosts can't manage)

---

## **Section 5: Notifications** (`/api/notifications`)

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| GET | `/api/notifications` | Get notifications | Required | Returns user's notifications |
| PUT | `/api/notifications/:id/read` | Mark as read | Required | Mark single notification as read |
| PUT | `/api/notifications/read-all` | Mark all as read | Required | Clear all unread notifications |
| POST | `/api/notifications/register-token` | Register device | Required | Store FCM token for push notifications |
| DELETE | `/api/notifications/unregister-token` | Unregister device | Required | Remove FCM token (logout, uninstall) |

**Total:** 5 endpoints

**Example Response (GET /notifications):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif123...",
      "type": "request_received",
      "title": "John Doe wants to tag along!",
      "body": "View their profile and decide",
      "data": "{\"request_id\":\"req789\",\"listing_id\":\"abc123\"}",
      "is_read": false,
      "created_at": "2025-11-21T16:00:00.000Z"
    }
  ]
}
```

**Notification Types:**
- `request_received` - Someone requested to join your activity
- `request_accepted` - Host accepted your request
- `request_rejected` - Host declined your request (not currently sent)
- `listing_reminder` - Activity happening soon (future feature)

**What Breaks If These Fail:**
- Can't view notifications
- Can't register for push (notifications still created, just not delivered)

---

## **Section 6: Subscriptions** (`/api/subscription`)

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| POST | `/api/subscription/create-checkout` | Start payment flow | Required | Create Stripe checkout session |
| POST | `/api/subscription/cancel` | Cancel subscription | Required | End subscription (immediate or at period end) |
| GET | `/api/subscription/status` | Get subscription status | Required | Check current plan, billing date |
| GET | `/api/subscription/is-premium` | Check premium status | Required | Boolean: is user premium? |

**Total:** 4 endpoints

**Example Flow:**
```
1. User taps "Upgrade to Premium"
2. App calls POST /api/subscription/create-checkout
3. Backend returns Stripe checkout URL
4. App opens checkout in webview
5. User enters credit card → Stripe processes
6. Stripe sends webhook to Supabase Edge Function
7. Edge Function updates database
8. User now has premium access
```

**What Breaks If These Fail:**
- Can't start subscriptions (no revenue)
- Can't cancel subscriptions (user frustration)
- Can't check status (features not gated properly)

---

## **Section 7: Webhooks** (`/api/webhooks`)

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| POST | `/api/webhooks/stripe` | Stripe webhook handler | Signature verification | Process payment events from Stripe |

**Total:** 1 endpoint

**Important:** This endpoint:
- Uses `express.raw()` instead of `express.json()` (needs raw body for signature verification)
- Verifies Stripe signature (prevents fake webhooks)
- Processes events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

**What Breaks If This Fails:**
- Payments succeed but app doesn't unlock premium (subscription status out of sync)
- Cancellations don't reflect in app

---

## **Section 8: Health Check**

| Method | Endpoint | Purpose | Authentication | What It Does |
|--------|----------|---------|----------------|--------------|
| GET | `/health` | Server status | None | Returns server uptime, version |

**Total:** 1 endpoint

**Example Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-21T16:30:00.000Z",
  "version": "2.0.1"
}
```

**Use Case:** Monitoring tools ping this endpoint to check if server is alive.

---

# 4. Database Schema & Relationships

**Database:** PostgreSQL
**ORM:** Prisma
**Total Tables:** 5
**Schema File:** `prisma/schema.prisma`

---

## **Table 1: `users`**

### **Purpose:**
Store user accounts, profiles, and authentication data

### **Columns:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | No | Auto-generated | Primary key |
| email | String | No | - | Login credential (unique) |
| phone | String | Yes | NULL | Phone number (future SMS) |
| password_hash | String | No | - | Bcrypt hashed password |
| display_name | String | No | - | Public name shown to others |
| username | String | No | - | Unique handle (unique) |
| bio | String | Yes | NULL | About me (max 150 chars) |
| profile_photo_url | String | Yes | NULL | S3 URL to profile picture |
| photo_gallery | String[] | No | [] | Array of S3 URLs (max 5) |
| city | String | No | - | User's location |
| instagram_handle | String | Yes | NULL | Instagram @username |
| date_of_birth | DateTime | No | - | Age verification (must be 18+) |
| is_active | Boolean | No | true | Soft delete / ban flag |
| created_at | DateTime | No | now() | Account creation timestamp |
| last_active | DateTime | No | now() | Last request timestamp |

### **Indexes:**
- `email` (unique) - Fast login lookups
- `username` (unique) - Fast username lookups, prevent duplicates
- `city` - Fast filtering by location
- `username` (non-unique) - Fast search queries

### **Relationships:**
```
users (1) ──── (many) listings
users (1) ──── (many) tag_along_requests
users (1) ──── (many) notifications
users (1) ──── (many) fcm_tokens
```

### **What Breaks If This Table Fails:**
- **Corrupted:** Can't authenticate, users lost
- **Locked:** Can't login, signup, or update profiles
- **Missing Index:** Feed queries slow (city filter)

---

## **Table 2: `listings`**

### **Purpose:**
Store activity posts created by users

### **Columns:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | No | Auto-generated | Primary key |
| user_id | UUID | No | - | Foreign key to users (creator) |
| photo_url | String | Yes | NULL | S3 URL to activity image |
| title | String | No | - | Activity headline |
| caption | String | Yes | NULL | Short description |
| description | String | Yes | NULL | Full activity details |
| category | String | Yes | NULL | sports, food, outdoor, etc. |
| location | String | Yes | NULL | Where to meet |
| date | DateTime | Yes | NULL | Activity date |
| time | String | Yes | NULL | Activity time (HH:MM) |
| time_text | String | Yes | NULL | Human-readable time |
| max_participants | Int | Yes | NULL | Group size limit |
| city | String | No | - | Inherited from user (for filtering) |
| latitude | Float | Yes | NULL | GPS coordinate (future: map view) |
| longitude | Float | Yes | NULL | GPS coordinate |
| is_active | Boolean | No | true | Soft delete flag |
| view_count | Int | No | 0 | Analytics (not currently used) |
| created_at | DateTime | No | now() | Post timestamp |
| expires_at | DateTime | No | - | Auto-cleanup timestamp |

### **Indexes:**
- `[city, is_active, created_at]` (composite) - **Fast feed queries** (most important!)
- `[user_id, created_at]` - Fast "my listings" queries
- `expires_at` - Fast cleanup queries (delete old listings)
- `category` - Filter by activity type

### **Relationships:**
```
listings (many) ──── (1) users (creator)
listings (1) ──── (many) tag_along_requests
```

### **Foreign Key Cascade:**
```
DELETE user → CASCADE deletes all their listings
```

### **What Breaks If This Table Fails:**
- **Corrupted:** All activities lost (core feature broken)
- **Locked:** Can't create, view, or delete activities
- **Missing Index:** Feed loading slow (10+ seconds)

---

## **Table 3: `tag_along_requests`**

### **Purpose:**
Store join requests for activities (pending/accepted/rejected)

### **Columns:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | No | Auto-generated | Primary key |
| listing_id | UUID | No | - | Foreign key to listings |
| requester_id | UUID | No | - | Foreign key to users (who requested) |
| status | String | No | "pending" | pending, accepted, rejected |
| created_at | DateTime | No | now() | Request timestamp |
| responded_at | DateTime | Yes | NULL | When host accepted/rejected |

### **Unique Constraint:**
- `[listing_id, requester_id]` - **Prevents duplicate requests** (can't request same activity twice)

### **Indexes:**
- `[listing_id, status]` - Fast "received requests" queries (host view)
- `[requester_id, status]` - Fast "sent requests" queries (requester view)

### **Relationships:**
```
tag_along_requests (many) ──── (1) listings
tag_along_requests (many) ──── (1) users (requester)
```

### **Foreign Key Cascade:**
```
DELETE listing → CASCADE deletes all its requests
DELETE user → CASCADE deletes all their requests
```

### **What Breaks If This Table Fails:**
- **Corrupted:** All requests lost (social feature broken)
- **Locked:** Can't request, accept, or reject
- **Missing Constraint:** Users can spam requests (duplicate prevention broken)

---

## **Table 4: `notifications`**

### **Purpose:**
Store in-app notifications for users

### **Columns:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | No | Auto-generated | Primary key |
| user_id | UUID | No | - | Foreign key to users (recipient) |
| type | String | No | - | request_received, request_accepted, etc. |
| title | String | No | - | Notification headline |
| body | String | No | - | Notification message |
| data | String | Yes | NULL | JSON metadata (deep link data) |
| is_read | Boolean | No | false | Read status |
| created_at | DateTime | No | now() | Notification timestamp |

### **Indexes:**
- `[user_id, is_read, created_at]` - **Fast unread notifications query**

### **Relationships:**
```
notifications (many) ──── (1) users (recipient)
```

### **Foreign Key Cascade:**
```
DELETE user → CASCADE deletes all their notifications
```

### **What Breaks If This Table Fails:**
- **Corrupted:** All notifications lost (users miss requests)
- **Locked:** Can't view or mark notifications as read
- **Missing Index:** Notification screen slow to load

---

## **Table 5: `fcm_tokens`**

### **Purpose:**
Store Firebase Cloud Messaging device tokens for push notifications

### **Columns:**

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | No | Auto-generated | Primary key |
| user_id | UUID | No | - | Foreign key to users (token owner) |
| token | String | No | - | Firebase device token |
| device_type | String | Yes | NULL | ios, android |
| created_at | DateTime | No | now() | Registration timestamp |

### **Unique Constraint:**
- `[user_id, token]` - **Prevents duplicate tokens**

### **Relationships:**
```
fcm_tokens (many) ──── (1) users
```

### **Why Multiple Tokens Per User:**
Users can have multiple devices:
- iPhone + iPad
- Work phone + personal phone
- Old token + new token (after reinstall)

### **Foreign Key Cascade:**
```
DELETE user → CASCADE deletes all their tokens
```

### **What Breaks If This Table Fails:**
- **Corrupted:** Push notifications stop working
- **Locked:** Can't register/unregister devices
- **Missing Constraint:** Duplicate tokens waste Firebase quota

---

## **Database Relationship Diagram**

```
┌─────────────────────────┐
│        users            │
│ ─────────────────────── │
│ id (PK)                 │
│ email (unique)          │
│ username (unique)       │
│ password_hash           │
│ city                    │
│ ...                     │
└─────────────────────────┘
         │
         │ 1
         ├──────────────────┐
         │                  │
    many │                  │ many
         │                  │
         ▼                  ▼
┌──────────────────┐  ┌───────────────────┐
│    listings      │  │ tag_along_requests│
│ ────────────────│  │ ─────────────────│
│ id (PK)          │  │ id (PK)           │
│ user_id (FK) ────┼──┼▶ requester_id (FK)│
│ title            │  │ listing_id (FK) ◀─┤
│ city             │  │ status            │
│ expires_at       │  │ ...               │
└──────────────────┘  └───────────────────┘
         │
         │ 1
         │
    many │
         │
         ▼
┌─────────────────────────┐
│    notifications        │
│ ─────────────────────── │
│ id (PK)                 │
│ user_id (FK)            │
│ type                    │
│ title                   │
│ is_read                 │
└─────────────────────────┘

┌─────────────────────────┐
│      fcm_tokens         │
│ ─────────────────────── │
│ id (PK)                 │
│ user_id (FK)            │
│ token                   │
│ device_type             │
└─────────────────────────┘
         ▲
         │ many
         │
         │ 1
         │
    users (FK)
```

---

# 5. Third-Party Integrations

Beyond basic libraries, these are **external APIs** your app actively communicates with.

---

## **Integration 1: AWS S3 (Image Storage)**

### **SDK:** `@aws-sdk/client-s3` (v3.908.0)

### **What It Does:**
- Uploads user images to S3 bucket
- Processes images (resize, compress)
- Returns public URLs for serving images

### **Implementation:**
**File:** `src/services/imageService.js:15-43`

**Process:**
```javascript
1. Receive image from app (via multer)
2. Process with Sharp:
   - Resize to 1080x1080
   - Convert to JPEG
   - Compress to 85% quality
3. Generate unique filename (UUID + timestamp)
4. Upload to S3 with public-read ACL
5. Return public URL
```

### **API Calls Made:**
- `PutObjectCommand` - Upload file to S3

### **Configuration:**
```javascript
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

### **What Breaks If AWS S3 Fails:**
| Failure Mode | Impact | User Experience |
|--------------|--------|-----------------|
| S3 outage | Can't upload images | "Upload failed, try again" error |
| Invalid credentials | All uploads fail | Persistent upload errors |
| Bucket deleted | All images disappear | Broken image icons everywhere |
| Rate limit exceeded | Upload throttled | Slow uploads or failures |

### **Monitoring:**
- Track upload success rate
- Alert if >5% uploads fail
- Monitor bandwidth costs

---

## **Integration 2: Firebase Cloud Messaging (Push Notifications)**

### **SDK:** `firebase-admin` (v12.0.0)

### **What It Does:**
- Sends push notifications to iOS and Android devices
- Manages device tokens
- Handles APNs (Apple) and FCM (Google) protocols

### **Implementation:**
**File:** `src/services/fcmService.js`

**Process:**
```javascript
1. Initialize Firebase Admin SDK (on server start)
2. When notification needed:
   - Fetch user's FCM tokens from database
   - Build notification payload (title, body, data)
   - Send to each token via Firebase
   - Firebase routes to Apple/Google servers
   - User's device receives notification
```

### **API Calls Made:**
- `admin.messaging().send()` - Send single notification
- `admin.messaging().sendMulticast()` - Send to multiple devices (not currently used)

### **Configuration:**
```javascript
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});
```

### **What Breaks If Firebase Fails:**
| Failure Mode | Impact | User Experience |
|--------------|--------|-----------------|
| Firebase outage | Push stops | Notifications created in DB but not delivered |
| Invalid credentials | Silent failure | No push notifications (hard to debug) |
| APNs certificate expired | iOS push fails | Android works, iOS doesn't receive |
| Token invalid | Specific device fails | That user doesn't get notifications |

### **Notification Flow:**
```
User A requests to join User B's activity
  ↓
Backend creates notification in DB
  ↓
Backend calls sendToMultipleDevices(userB_id, notification)
  ↓
Fetch User B's FCM tokens from fcm_tokens table
  ↓
For each token: admin.messaging().send(...)
  ↓
Firebase routes to Apple (APNs) or Google (FCM)
  ↓
User B's phone receives push notification
  ↓
User B taps notification → App opens to request screen
```

---

## **Integration 3: Stripe (Payment Processing)**

### **SDK:** `stripe` (v14.25.0)

### **What It Does:**
- Creates checkout sessions for subscriptions
- Processes credit card payments
- Manages recurring billing
- Sends webhooks for payment events

### **Implementation:**
**Files:**
- `src/controllers/subscriptionController.js` - API endpoints
- `supabase/functions/stripe-webhook/` - Webhook handler

**Process:**
```javascript
1. User taps "Upgrade to Premium"
2. Backend calls stripe.checkout.sessions.create()
3. Stripe returns checkout URL
4. App opens Stripe Checkout webview
5. User enters credit card
6. Stripe processes payment
7. Stripe sends webhook to Supabase Edge Function
8. Webhook updates database (subscription status)
9. App now shows premium features
```

### **API Calls Made:**
- `stripe.checkout.sessions.create()` - Start payment flow
- `stripe.subscriptions.retrieve()` - Get subscription details
- `stripe.subscriptions.update()` - Cancel subscription
- `stripe.webhooks.constructEvent()` - Verify webhook signature

### **Configuration:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### **Webhook Events Handled:**
- `checkout.session.completed` - Payment succeeded, activate subscription
- `customer.subscription.updated` - Plan changed or renewed
- `customer.subscription.deleted` - Subscription canceled

### **What Breaks If Stripe Fails:**
| Failure Mode | Impact | User Experience |
|--------------|--------|-----------------|
| Stripe outage | Can't start payments | "Try again later" error |
| Webhook fails | Payment succeeds but app doesn't unlock premium | User paid but no access (bad!) |
| API key revoked | All payment calls fail | Complete payment failure |
| Webhook signature invalid | Webhooks rejected | Subscription status out of sync |

### **Critical Path:**
```
Payment Flow (Synchronous):
  User → Stripe Checkout → Payment Success
  ✅ This always works (Stripe handles)

Activation Flow (Asynchronous):
  Stripe → Webhook → Supabase Function → Database Update
  ⚠️ This can fail! Must monitor webhook delivery
```

**Monitoring:**
- Track webhook success rate
- Alert if webhooks fail
- Implement retry logic (Stripe retries for 3 days)

---

## **Integration 4: Supabase (Serverless Functions)**

### **SDK:** `@supabase/supabase-js` (v2.39.0)

### **What It Does:**
- Hosts Edge Functions (Deno-based serverless)
- Handles Stripe webhooks
- Provides alternative storage (not currently primary)

### **Implementation:**
**Files:**
- `supabase/functions/stripe-webhook/` - Main webhook handler
- `supabase/functions/create-subscription/`
- `supabase/functions/cancel-subscription/`

**Why Separate from Main Backend:**
- **Reliability:** Stripe webhooks must respond within 5 seconds
- **Isolation:** Webhook failures don't crash main app
- **Technology:** Uses Deno (newer, faster runtime)

### **What Breaks If Supabase Fails:**
| Failure Mode | Impact | User Experience |
|--------------|--------|-----------------|
| Edge Functions offline | Webhooks fail | Payments succeed but app doesn't unlock premium |
| Function timeout | Stripe retries | Duplicate webhook handling (need idempotency) |
| Database connection fails | Can't update subscription | Subscription status out of sync |

---

# 6. Dependency Risk Matrix

**Which dependencies are most critical to monitor?**

| Dependency | Criticality | Failure Impact | Replacement Time | Monitoring Priority |
|------------|-------------|----------------|------------------|---------------------|
| **Vercel** | ⚠️ CRITICAL | 100% downtime | 1-2 days | ⭐⭐⭐⭐⭐ |
| **PostgreSQL** | ⚠️ CRITICAL | 100% downtime | 2-4 hours | ⭐⭐⭐⭐⭐ |
| **AWS S3** | 🟡 HIGH | Can't upload images | 1-2 days | ⭐⭐⭐⭐ |
| **Firebase FCM** | 🟡 HIGH | No push notifications | 1 week | ⭐⭐⭐⭐ |
| **Stripe** | ⚠️ CRITICAL | No revenue | 2-4 weeks | ⭐⭐⭐⭐⭐ |
| **Supabase** | 🟡 HIGH | Webhook sync issues | 2-3 days | ⭐⭐⭐⭐ |
| **express** | ⚠️ CRITICAL | No backend | 1-2 weeks | ⭐⭐⭐ |
| **@prisma/client** | ⚠️ CRITICAL | No database access | 1-2 weeks | ⭐⭐⭐ |
| **bcrypt** | ⚠️ CRITICAL | Can't authenticate | 3-5 days | ⭐⭐⭐ |
| **jsonwebtoken** | ⚠️ CRITICAL | Can't authenticate | 3-5 days | ⭐⭐⭐ |
| **cors** | ⚠️ CRITICAL | App can't call API | 1 hour | ⭐⭐ |
| **joi** | 🟡 HIGH | Bad data in DB | 2-3 days | ⭐⭐ |
| **sharp** | 🟢 MEDIUM | Images huge/slow | 1-2 days | ⭐ |
| **helmet** | 🟢 LOW | Less secure | 1 hour | ⭐ |
| **morgan** | 🟢 LOW | No logging | 1 hour | ⭐ |

---

# 7. What Happens When Things Fail

## **Scenario 1: Vercel Outage (Complete Downtime)**

### **What Fails:**
- ✗ Entire backend offline
- ✗ All API calls fail
- ✗ App shows "Cannot connect to server"

### **What Still Works:**
- ✓ Users can open app
- ✓ Cached data displays (if app has offline mode)

### **Recovery Time:**
- **If Vercel global outage:** Wait for Vercel (historical: 99.99% uptime = ~4 minutes/month)
- **If your account suspended:** Contact support (1-24 hours)
- **If deploying elsewhere:** 1-2 days

### **User Impact:**
- 100% of users can't use app
- All features broken

### **Business Impact:**
- **Revenue:** $0 during outage (can't process subscriptions)
- **Reputation:** User reviews tank if >1 hour

---

## **Scenario 2: Database Connection Limit Exceeded**

### **What Fails:**
- ✗ New requests get "Too many connections" error
- ✗ 500 Internal Server Error

### **What Still Works:**
- ✓ Existing connections continue working
- ✓ Some users can still use app (those with active connections)

### **Recovery:**
- **Immediate:** Restart database (closes all connections) - 2 minutes
- **Short-term:** Increase connection limit - 5 minutes
- **Long-term:** Add connection pooling (PgBouncer) - 4 hours

### **User Impact:**
- 50-80% of users see errors
- Random requests fail

### **Business Impact:**
- Churn increases (frustration)
- Support tickets spike

---

## **Scenario 3: AWS S3 Outage**

### **What Fails:**
- ✗ Can't upload new images
- ✗ Image upload errors

### **What Still Works:**
- ✓ Can view existing images (S3 serves from multiple datacenters)
- ✓ Can create text-only listings
- ✓ All other features work

### **Recovery:**
- **If S3 outage:** Wait for AWS (historical: 99.99% uptime)
- **If your bucket deleted:** Restore from backup (4 hours)

### **User Impact:**
- 10-20% of users affected (only those uploading)

### **Business Impact:**
- Low impact (most features work)
- Revenue continues

---

## **Scenario 4: Firebase Push Notification Failure**

### **What Fails:**
- ✗ No push notifications delivered
- ✗ Users don't know about new requests

### **What Still Works:**
- ✓ In-app notifications still created
- ✓ Users see notifications when they open app
- ✓ All other features work

### **Recovery:**
- **If Firebase outage:** Wait for Firebase
- **If invalid credentials:** Update credentials (10 minutes)

### **User Impact:**
- 30-50% engagement drop (users miss notifications)
- Delayed responses to requests

### **Business Impact:**
- Retention decreases
- User complaints about "not getting notifications"

---

## **Scenario 5: Stripe Webhook Failure**

### **What Fails:**
- ✗ Payments succeed but app doesn't unlock premium
- ✗ Subscription status out of sync

### **What Still Works:**
- ✓ Users can attempt to subscribe
- ✓ Stripe processes payment successfully
- ✓ All free features work

### **Recovery:**
- **Manual sync:** Check Stripe dashboard, manually update database (10 min per user)
- **Automated sync:** Run script to reconcile Stripe vs. database (1 hour to build)

### **User Impact:**
- Users paid but don't have premium access (very bad!)
- Support tickets spike

### **Business Impact:**
- Reputation damage (paid but no access)
- Refund requests
- Churn

---

## **Disaster Recovery Checklist**

### **Before Launch:**
- [ ] Set up database backups (daily)
- [ ] Test database restore (monthly)
- [ ] Monitor Vercel status (status.vercel.com)
- [ ] Set up error tracking (Sentry)
- [ ] Document API keys locations
- [ ] Create runbook for common failures

### **Monitoring Alerts:**
- [ ] Alert if error rate >5%
- [ ] Alert if response time >2 seconds
- [ ] Alert if database connections >80%
- [ ] Alert if S3 uploads fail >10%
- [ ] Alert if FCM sends fail >10%
- [ ] Alert if Stripe webhooks fail

### **During Outage:**
1. Check status pages (Vercel, AWS, Firebase, Stripe)
2. Check error logs (Sentry, Vercel logs)
3. Post status update to users (Twitter, in-app banner)
4. Estimate recovery time
5. Implement workaround if possible

---

# Summary: Dependency Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                  TIER 1: CRITICAL (App Dead)                │
│  Vercel, PostgreSQL, Express, Prisma, bcrypt, JWT, CORS    │
│  Failure = 100% downtime                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            TIER 2: HIGH PRIORITY (Major Features)           │
│        AWS S3, Firebase FCM, Stripe, Supabase, Joi          │
│  Failure = Core features broken but app partially works     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│          TIER 3: MEDIUM PRIORITY (UX Degradation)           │
│              Sharp, Multer, Rate Limiting                   │
│  Failure = App works but user experience worse              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            TIER 4: LOW PRIORITY (Nice to Have)              │
│                  Helmet, Morgan, dotenv                     │
│  Failure = App works fine, just less secure/observable      │
└─────────────────────────────────────────────────────────────┘
```

---

**You now have a complete map of every dependency in your system!** Use this to make informed decisions about monitoring, backup plans, and risk mitigation. 🎯