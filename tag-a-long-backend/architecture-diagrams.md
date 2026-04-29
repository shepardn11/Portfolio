# Tag-a-Long - Visual Architecture Diagrams

**Interactive Mermaid diagrams explaining the complete system architecture**

> **Note:** These diagrams render in GitHub, VS Code (with Mermaid extension), and other Mermaid-compatible viewers.

---

## Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [Request Flow (Detailed)](#2-request-flow-detailed)
3. [Authentication Flow](#3-authentication-flow)
4. [Payment & Subscription Flow](#4-payment--subscription-flow)
5. [Database Schema (Entity Relationship)](#5-database-schema-entity-relationship)
6. [Technology Stack](#6-technology-stack)
7. [External Services Integration](#7-external-services-integration)
8. [API Route Map](#8-api-route-map)

---

# 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Mobile App<br/>React Native<br/>iOS/Android]
    end

    subgraph "API Gateway"
        B[Vercel<br/>Serverless Functions<br/>Edge Network]
    end

    subgraph "Application Layer - Express Backend"
        C[Express Server<br/>Node.js]
        D[Middleware Pipeline]
        E[Routes<br/>API Endpoints]
        F[Controllers<br/>Business Logic]
        G[Services<br/>External Integrations]
    end

    subgraph "Data Layer"
        H[(PostgreSQL<br/>Database<br/>Prisma ORM)]
    end

    subgraph "External Services"
        I[AWS S3<br/>Image Storage]
        J[Firebase FCM<br/>Push Notifications]
        K[Stripe<br/>Payments]
        L[Supabase<br/>Edge Functions<br/>Webhooks]
    end

    A -->|HTTP/JSON| B
    B -->|Routes Request| C
    C --> D
    D --> E
    E --> F
    F --> G
    F <-->|SQL Queries<br/>Prisma| H
    G <-->|Upload Images| I
    G <-->|Send Push| J
    G <-->|Process Payments| K
    L -->|Stripe Webhooks| H
    K -->|Payment Events| L

    style A fill:#e1f5ff
    style B fill:#fff4e6
    style C fill:#f0f0f0
    style H fill:#e8f5e9
    style I fill:#fff3e0
    style J fill:#fce4ec
    style K fill:#e3f2fd
    style L fill:#f3e5f5
```

**Key Components:**
- **Mobile App:** React Native (TypeScript)
- **API Gateway:** Vercel serverless deployment
- **Backend:** Express.js (Node.js v18+)
- **Database:** PostgreSQL with Prisma ORM
- **Storage:** AWS S3 for images
- **Notifications:** Firebase Cloud Messaging
- **Payments:** Stripe + Supabase Edge Functions

---

# 2. Request Flow (Detailed)

This shows what happens when a user creates an activity listing.

```mermaid
sequenceDiagram
    participant User as 📱 Mobile App
    participant Vercel as ☁️ Vercel Edge
    participant Middleware as 🛡️ Middleware
    participant Controller as 🎯 Controller
    participant ImageService as 📸 Image Service
    participant S3 as 🪣 AWS S3
    participant DB as 🗄️ PostgreSQL

    User->>Vercel: POST /api/listings<br/>{title, description, photo...}<br/>Authorization: Bearer token
    Vercel->>Middleware: Route to Express

    Note over Middleware: Security Pipeline
    Middleware->>Middleware: 1. Helmet (security headers)
    Middleware->>Middleware: 2. CORS (allow origin)
    Middleware->>Middleware: 3. Rate Limit (10/hour)
    Middleware->>Middleware: 4. Authenticate JWT
    Middleware->>DB: Verify user exists
    DB-->>Middleware: User found ✓
    Middleware->>Middleware: 5. Validate data (Joi)

    Middleware->>Controller: Request validated ✓

    Note over Controller: Business Logic
    Controller->>Controller: Calculate expires_at<br/>(activity date + time)
    Controller->>ImageService: Upload photo

    ImageService->>ImageService: Resize to 1080x1080<br/>Compress JPEG 85%
    ImageService->>S3: PUT object
    S3-->>ImageService: Public URL

    ImageService-->>Controller: Image URL
    Controller->>DB: INSERT INTO listings<br/>(user_id, title, photo_url...)
    DB-->>Controller: New listing created

    Controller-->>User: 201 Created<br/>{id, title, photo_url, user...}

    Note over User: Activity posted!<br/>Visible in feed
```

**Timeline:** ~500-1500ms total
- Middleware: 50-100ms
- Image upload: 300-1000ms (largest factor)
- Database insert: 20-50ms
- Response: 10-20ms

---

# 3. Authentication Flow

## Signup Flow

```mermaid
sequenceDiagram
    participant User as 📱 Mobile App
    participant API as 🌐 Backend API
    participant Controller as 🎯 Auth Controller
    participant bcrypt as 🔐 bcrypt
    participant DB as 🗄️ Database
    participant JWT as 🎫 JWT Utils

    User->>API: POST /api/auth/signup<br/>{email, password, username...}
    API->>Controller: Route to signup()

    Note over Controller: Validation
    Controller->>Controller: Joi validates:<br/>• Email format<br/>• Password strength<br/>• Age 18+<br/>• Username unique

    Controller->>bcrypt: hash(password, 10 rounds)
    bcrypt-->>Controller: $2b$10$hashed...

    Controller->>DB: INSERT INTO users<br/>(email, password_hash...)
    DB-->>Controller: User created<br/>{id, email, username...}

    Controller->>JWT: generateToken(userId)
    Note over JWT: Sign with JWT_SECRET<br/>Expires in 7 days
    JWT-->>Controller: eyJhbGciOiJIUzI1NiIs...

    Controller-->>User: 201 Created<br/>{user: {...}, token: "..."}

    Note over User: Token saved to<br/>secure storage
```

## Login Flow

```mermaid
sequenceDiagram
    participant User as 📱 Mobile App
    participant API as 🌐 Backend API
    participant Controller as 🎯 Auth Controller
    participant DB as 🗄️ Database
    participant bcrypt as 🔐 bcrypt
    participant JWT as 🎫 JWT Utils

    User->>API: POST /api/auth/login<br/>{email, password}
    API->>Controller: Route to login()

    Controller->>DB: SELECT * FROM users<br/>WHERE email = ?
    DB-->>Controller: User found (includes password_hash)

    Controller->>bcrypt: compare(password, password_hash)
    bcrypt-->>Controller: true ✓

    Controller->>JWT: generateToken(userId)
    JWT-->>Controller: eyJhbGciOiJIUzI1NiIs...

    Controller-->>User: 200 OK<br/>{user: {...}, token: "..."}

    Note over User: Token saved<br/>User logged in
```

## Token Verification (Every Protected Request)

```mermaid
sequenceDiagram
    participant User as 📱 Mobile App
    participant Middleware as 🛡️ Auth Middleware
    participant JWT as 🎫 JWT Utils
    participant DB as 🗄️ Database
    participant Controller as 🎯 Controller

    User->>Middleware: GET /api/listings/feed<br/>Authorization: Bearer <token>

    Middleware->>Middleware: Extract token from header
    Middleware->>JWT: verify(token, JWT_SECRET)

    alt Token Valid
        JWT-->>Middleware: {userId: "550e8400..."}
        Middleware->>DB: SELECT * FROM users<br/>WHERE id = userId
        DB-->>Middleware: User found & active
        Middleware->>DB: UPDATE users<br/>SET last_active = NOW()
        Middleware->>Middleware: Attach user to req.user
        Middleware->>Controller: Continue to controller
        Controller-->>User: 200 OK + Data
    else Token Invalid/Expired
        JWT-->>Middleware: Error
        Middleware-->>User: 401 Unauthorized<br/>{error: "INVALID_TOKEN"}
    end
```

---

# 4. Payment & Subscription Flow

```mermaid
sequenceDiagram
    participant User as 📱 Mobile App
    participant Backend as 🌐 Express API
    participant Stripe as 💳 Stripe
    participant SupabaseFn as ⚡ Supabase<br/>Edge Function
    participant DB as 🗄️ Database

    Note over User,DB: Step 1: User Initiates Subscription

    User->>Backend: POST /api/subscription/create-checkout
    Backend->>Stripe: Create checkout session
    Stripe-->>Backend: {checkout_url: "https://checkout.stripe.com/..."}
    Backend-->>User: {checkout_url: "..."}

    Note over User: Opens Stripe Checkout<br/>in WebView

    User->>Stripe: Enter credit card<br/>Tap "Subscribe"
    Stripe->>Stripe: Process payment

    Note over Stripe,DB: Step 2: Stripe Sends Webhook (Asynchronous)

    Stripe->>SupabaseFn: POST /stripe-webhook<br/>Event: checkout.session.completed

    SupabaseFn->>SupabaseFn: Verify webhook signature
    SupabaseFn->>DB: INSERT INTO subscriptions<br/>(user_id, stripe_subscription_id,<br/>status: "active")
    DB-->>SupabaseFn: Subscription saved

    SupabaseFn-->>Stripe: 200 OK (webhook received)

    Note over User,DB: Step 3: User Gets Premium Access

    User->>Backend: GET /api/subscription/is-premium
    Backend->>DB: SELECT status FROM subscriptions<br/>WHERE user_id = ?
    DB-->>Backend: status: "active"
    Backend-->>User: {is_premium: true}

    Note over User: Premium features<br/>unlocked! 🎉
```

**Critical Path:**
1. **Synchronous:** User → Stripe (payment always works)
2. **Asynchronous:** Stripe → Webhook → Database (can fail!)

**Failure Mode:**
- If webhook fails: User paid but no premium access
- Mitigation: Stripe retries webhooks for 3 days
- Manual fix: Check Stripe dashboard, update DB

---

# 5. Database Schema (Entity Relationship)

```mermaid
erDiagram
    USERS ||--o{ LISTINGS : creates
    USERS ||--o{ TAG_ALONG_REQUESTS : makes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ FCM_TOKENS : has
    LISTINGS ||--o{ TAG_ALONG_REQUESTS : receives

    USERS {
        uuid id PK
        string email UK
        string username UK
        string password_hash
        string display_name
        string bio
        string profile_photo_url
        string[] photo_gallery
        string city "indexed"
        string instagram_handle
        datetime date_of_birth
        boolean is_active
        datetime created_at
        datetime last_active
    }

    LISTINGS {
        uuid id PK
        uuid user_id FK
        string photo_url
        string title
        string caption
        string description
        string category "indexed"
        string location
        datetime date
        string time
        string time_text
        int max_participants
        string city "indexed"
        float latitude
        float longitude
        boolean is_active
        int view_count
        datetime created_at "indexed"
        datetime expires_at "indexed"
    }

    TAG_ALONG_REQUESTS {
        uuid id PK
        uuid listing_id FK
        uuid requester_id FK
        string status "pending|accepted|rejected"
        datetime created_at
        datetime responded_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string type
        string title
        string body
        string data "JSON"
        boolean is_read "indexed"
        datetime created_at "indexed"
    }

    FCM_TOKENS {
        uuid id PK
        uuid user_id FK
        string token UK
        string device_type
        datetime created_at
    }
```

**Key Relationships:**
- **1:N** - One user creates many listings
- **1:N** - One user makes many requests
- **1:N** - One listing receives many requests
- **Unique Constraints:**
  - `[listing_id, requester_id]` - Can't request same activity twice
  - `[user_id, token]` - No duplicate FCM tokens

**Indexes for Performance:**
- `LISTINGS[city, is_active, created_at]` - Fast feed queries
- `NOTIFICATIONS[user_id, is_read, created_at]` - Fast unread count
- `TAG_ALONG_REQUESTS[listing_id, status]` - Fast host view

---

# 6. Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        A[React Native<br/>TypeScript]
        A1[Expo]
        A2[React Navigation]
    end

    subgraph "Backend Runtime"
        B[Node.js v18+]
        B1[Express.js 4.18]
        B2[JavaScript ES6+]
    end

    subgraph "Database"
        C[PostgreSQL 15+]
        C1[Prisma ORM 5.7]
    end

    subgraph "Cloud Platform"
        D[Vercel<br/>Serverless]
        D1[Supabase<br/>Edge Functions<br/>Deno]
    end

    subgraph "External Services"
        E[AWS S3]
        F[Firebase FCM]
        G[Stripe]
    end

    subgraph "Development Tools"
        H[Git/GitHub]
        I[VS Code]
        J[Postman]
        K[Prisma Studio]
    end

    A --> B
    B --> C
    B --> D
    B --> E
    B --> F
    B --> G
    D --> D1

    style A fill:#61dafb
    style B fill:#68a063
    style C fill:#336791
    style D fill:#000000
    style E fill:#ff9900
    style F fill:#ffca28
    style G fill:#635bff
```

**Language Breakdown:**
- **Frontend:** JavaScript/TypeScript (React Native)
- **Backend:** JavaScript (Node.js)
- **Edge Functions:** TypeScript (Deno)
- **Database:** SQL (via Prisma)
- **Config:** JSON (package.json, vercel.json)
- **Schema:** Prisma Schema Language

**Framework Versions:**
- Node.js: v18+
- Express: 4.18.2
- React Native: Latest (managed by Expo)
- Prisma: 5.7.0

---

# 7. External Services Integration

```mermaid
graph TB
    subgraph "Your Backend"
        API[Express API]
    end

    subgraph "AWS Ecosystem"
        S3[S3 Bucket<br/>tagalong-photos]
        CDN[CloudFront CDN<br/>Optional]
    end

    subgraph "Firebase Ecosystem"
        FCM[Firebase Cloud<br/>Messaging]
        APNs[Apple Push<br/>Notification Service]
        GoogleFCM[Google FCM<br/>Servers]
    end

    subgraph "Stripe Ecosystem"
        StripeAPI[Stripe API]
        StripeCheckout[Stripe Checkout]
        StripeWebhook[Stripe Webhooks]
    end

    subgraph "Supabase Ecosystem"
        SupabaseDB[PostgreSQL]
        SupabaseFn[Edge Functions]
        SupabaseStorage[Storage<br/>Alternative]
    end

    API -->|Upload Image| S3
    S3 -->|Serve Image| CDN

    API -->|Send Notification| FCM
    FCM -->|Route iOS| APNs
    FCM -->|Route Android| GoogleFCM

    API -->|Create Session| StripeAPI
    StripeAPI --> StripeCheckout
    StripeCheckout -->|Payment Event| StripeWebhook
    StripeWebhook --> SupabaseFn

    API <-->|Query Data| SupabaseDB
    SupabaseFn -->|Update DB| SupabaseDB

    style S3 fill:#ff9900
    style FCM fill:#ffca28
    style StripeAPI fill:#635bff
    style SupabaseDB fill:#3ecf8e
```

**Data Flows:**
1. **Images:** App → Backend → S3 → CDN → Users
2. **Push:** Backend → Firebase → APNs/Google → User Devices
3. **Payments:** App → Stripe → Webhook → Supabase → Database
4. **Data:** App → Backend → PostgreSQL → Backend → App

---

# 8. API Route Map

```mermaid
graph TB
    Start[Mobile App]

    subgraph "Authentication Routes"
        Auth1[POST /api/auth/signup]
        Auth2[POST /api/auth/login]
    end

    subgraph "Profile Routes"
        Profile1[GET /api/profile/me]
        Profile2[PUT /api/profile/me]
        Profile3[GET /api/profile/:username]
        Profile4[POST /api/profile/me/photo]
        Profile5[GET /api/profile/search-users]
    end

    subgraph "Listings Routes"
        List1[GET /api/listings/feed]
        List2[POST /api/listings]
        List3[GET /api/listings/:id]
        List4[DELETE /api/listings/:id]
        List5[GET /api/listings/my-listings]
    end

    subgraph "Requests Routes"
        Req1[POST /api/requests]
        Req2[GET /api/requests/received]
        Req3[GET /api/requests/sent]
        Req4[PUT /api/requests/:id/accept]
        Req5[PUT /api/requests/:id/reject]
    end

    subgraph "Notifications Routes"
        Notif1[GET /api/notifications]
        Notif2[PUT /api/notifications/:id/read]
        Notif3[POST /api/notifications/register-token]
    end

    subgraph "Subscription Routes"
        Sub1[POST /api/subscription/create-checkout]
        Sub2[GET /api/subscription/status]
        Sub3[POST /api/subscription/cancel]
    end

    Start --> Auth1
    Start --> Auth2
    Start --> Profile1
    Start --> List1
    Start --> Req1
    Start --> Notif1
    Start --> Sub1

    style Auth1 fill:#ffebee
    style Auth2 fill:#ffebee
    style List1 fill:#e3f2fd
    style List2 fill:#e3f2fd
    style Req1 fill:#f3e5f5
    style Req4 fill:#f3e5f5
    style Sub1 fill:#fff3e0
```

**Route Categories:**
- 🔴 **Auth** (2 routes) - Public, rate limited 50/15min
- 🟢 **Profile** (8 routes) - Mixed auth, CRUD operations
- 🔵 **Listings** (5 routes) - Protected, core feature
- 🟣 **Requests** (5 routes) - Protected, social interaction
- 🟡 **Notifications** (5 routes) - Protected, engagement
- 🟠 **Subscriptions** (4 routes) - Protected, monetization

**Total:** 32 API endpoints

---

# Visual Summary: Complete Architecture

```mermaid
graph TB
    subgraph "Client Tier"
        Mobile[📱 Mobile App<br/>React Native]
    end

    subgraph "Edge Tier"
        Vercel[☁️ Vercel<br/>Global CDN<br/>Serverless]
    end

    subgraph "Application Tier"
        Express[🚀 Express Server<br/>Node.js]
        Middleware[🛡️ Middleware<br/>Auth, Validation, Rate Limit]
        Routes[🗺️ Routes<br/>32 Endpoints]
        Controllers[🎯 Controllers<br/>Business Logic]
        Services[⚙️ Services<br/>S3, FCM, Stripe]
    end

    subgraph "Data Tier"
        PostgreSQL[(🗄️ PostgreSQL<br/>5 Tables<br/>Prisma ORM)]
    end

    subgraph "Storage Tier"
        S3[🪣 AWS S3<br/>Image Storage]
    end

    subgraph "Notification Tier"
        Firebase[🔔 Firebase FCM<br/>Push Notifications]
    end

    subgraph "Payment Tier"
        Stripe[💳 Stripe<br/>Payments]
        SupabaseEdge[⚡ Supabase<br/>Webhooks]
    end

    Mobile -->|HTTPS/JSON| Vercel
    Vercel --> Express
    Express --> Middleware
    Middleware --> Routes
    Routes --> Controllers
    Controllers --> Services
    Controllers <-->|Prisma| PostgreSQL
    Services -->|Upload| S3
    Services -->|Send| Firebase
    Services -->|Charge| Stripe
    Stripe -->|Webhook| SupabaseEdge
    SupabaseEdge -->|Update| PostgreSQL

    style Mobile fill:#e1f5ff
    style Vercel fill:#000000,color:#ffffff
    style Express fill:#68a063,color:#ffffff
    style PostgreSQL fill:#336791,color:#ffffff
    style S3 fill:#ff9900,color:#ffffff
    style Firebase fill:#ffca28
    style Stripe fill:#635bff,color:#ffffff
    style SupabaseEdge fill:#3ecf8e
```

---

## How to Use These Diagrams

### **In Interviews:**

1. **Start with High-Level Architecture**
   - "Let me walk you through the system architecture..."
   - Show overall structure (client → API → database → services)

2. **Explain Request Flow**
   - "When a user creates an activity, here's what happens..."
   - Walk through middleware pipeline → controller → database

3. **Discuss Authentication**
   - "We use JWT-based stateless authentication..."
   - Show signup/login/verification flows

4. **Describe Payment Integration**
   - "Payments are handled asynchronously via webhooks..."
   - Explain Stripe checkout + Supabase webhook handler

5. **Show Database Design**
   - "Our database has 5 main tables with these relationships..."
   - Point out indexes and foreign key cascades

### **In Documentation:**

- Embed these diagrams in your README
- Use in technical design docs
- Include in onboarding materials for new developers

### **For Learning:**

- Study each diagram to understand data flow
- Trace a user action through the system
- Identify bottlenecks and optimization opportunities

---

## Rendering These Diagrams

### **GitHub:**
✅ Renders automatically in `.md` files

### **VS Code:**
1. Install "Markdown Preview Mermaid Support" extension
2. Open markdown file
3. Press `Ctrl+Shift+V` (Windows) or `Cmd+Shift+V` (Mac)

### **Online Editors:**
- [Mermaid Live Editor](https://mermaid.live/)
- [Mermaid Chart](https://www.mermaidchart.com/)

### **Documentation Sites:**
- GitBook (native support)
- Docusaurus (via plugin)
- MkDocs (via plugin)

---

## Key Takeaways from Architecture

1. **Stateless Backend:** JWT tokens, no session storage (scales horizontally)
2. **Serverless Deployment:** Auto-scaling, pay-per-use (cost-effective)
3. **Layered Architecture:** Clear separation of concerns (maintainable)
4. **Async Webhooks:** Stripe webhooks via Supabase Edge Functions (reliable)
5. **Image Optimization:** Sharp preprocessing before S3 upload (performance)
6. **Push Notifications:** Firebase FCM for multi-platform (engagement)
7. **Database Indexes:** Optimized for feed queries (fast)

---

**You can now visualize and explain your entire architecture!** 🚀