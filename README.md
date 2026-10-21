# Restaurant Starter

A production-ready, mobile-first restaurant ordering application and owner management dashboard engineered specifically for **Cloudflare Workers**, **Cloudflare D1** (Serverless SQL), and optional **Cloudflare R2** (Object Storage).

Designed to be operated, maintained, and deployed entirely using an **Android phone or browser dashboard**, with zero requirement for local Node.js servers, paid UI libraries, or paid hosting tiers.

---

## 1. Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 | Ultra-responsive, mobile-first customer storefront & owner portal |
| **Backend API** | Cloudflare Workers (TypeScript Web Fetch API) | Serverless REST API adhering to web crypto & edge security standards |
| **Database** | Cloudflare D1 (Distributed SQLite on Edge) | Persistent relational SQL database with migrations & prepared statements |
| **Asset Storage** | Cloudflare R2 / Local Web Fallback | Authenticated image uploads with MIME & file size validation |
| **Hosting** | Cloudflare Workers (with Static Assets binding) | Fast edge delivery via Cloudflare's global network |
| **Vite Dev Mode** | Custom Cloudflare Worker Dev Middleware | Runs edge Worker logic & D1 database emulation natively inside Vite |

---

## 2. File Tree & Codebase Structure

```text
├── .env.example                  # Environment configuration template
├── .gitignore                    # Excludes secrets, .dev.vars, .wrangler, and SQLite files
├── index.html                    # Mobile-optimized HTML entry point with typography
├── metadata.json                 # AI Studio applet specifications
├── package.json                  # Scripts & dependencies
├── README.md                     # Complete production deployment & operational guide
├── tsconfig.json                 # TypeScript compiler options
├── vite.config.ts                # Vite config + Cloudflare Worker dev middleware
├── wrangler.jsonc                # Cloudflare Workers configuration file
│
├── migrations/                   # Cloudflare D1 SQL Migrations
│   ├── 0001_initial_schema.sql   # Settings, categories, menu items, orders, sessions
│   └── 0002_seed_data.sql        # Initial British menu dishes & restaurant settings
│
├── worker/                       # Cloudflare Workers Backend
│   ├── api.ts                    # REST API routes (settings, menu, orders, auth, upload)
│   ├── crypto.ts                 # Web Crypto API (PBKDF2 hashing, secure tokens, SHA-256)
│   ├── db-emulator.ts            # High-fidelity D1 database emulator for dev preview
│   ├── index.ts                  # Worker fetch entry point & static asset handler
│   ├── seed-defaults.ts          # Default settings and authentic British menu data
│   └── types.ts                  # TypeScript models and Cloudflare Worker Env interfaces
│
└── src/                          # Customer & Owner Frontend (React + Vite)
    ├── App.tsx                   # Main router, layout, toast manager, and providers
    ├── main.tsx                  # React entry point
    ├── index.css                 # Tailwind CSS v4 styling & typography
    ├── types.ts                  # Client types
    ├── assets/images/            # High-fidelity food & dining photography
    ├── context/
    │   └── AppContext.tsx        # Cart state, owner session, data refresh, and toasts
    ├── components/
    │   ├── CartDrawer.tsx        # Slide-over basket with delivery/pickup & checkout form
    │   ├── Footer.tsx            # Restaurant hours, address, phone & owner link
    │   ├── ItemModal.tsx         # Item details, cooking notes, and quantity stepper
    │   └── Navbar.tsx            # Brand wordmark, concise links, and basket indicator
    └── pages/
        ├── AboutPage.tsx         # Sourcing story from British farms & fisheries
        ├── AdminPage.tsx         # Complete owner management dashboard (/admin)
        ├── ContactPage.tsx       # Hours, location, telephone & table enquiry form
        ├── HomePage.tsx          # Hero showcase, signature dishes & ordering CTAs
        ├── MenuPage.tsx          # Search, category filters, dietary tags & dish cards
        └── OrderTrackingPage.tsx # Live kitchen dispatch & delivery tracker
```

---

## 3. Database Schema Overview

The database uses Cloudflare D1 with foreign keys, indexes, and constraints:

1. **`restaurant_settings`**: Stores restaurant identity, phone, address, currency symbol, opening hours, delivery fee, minimum order amount, free delivery threshold, and service toggles (`delivery_enabled`, `pickup_enabled`).
2. **`menu_categories`**: Menu categories with custom slugs, display order, and active toggles.
3. **`menu_items`**: Food dishes with category associations, descriptions, prices, image URLs, dietary tags, in-stock/sold-out availability, and visibility flags.
4. **`orders`**: Customer orders with server-generated order numbers (`RS-YYYYMMDD-XXXX`), order type (`delivery` or `pickup`), customer name, phone, address, order notes, server-calculated subtotal, delivery fee, total, status, and payment method (`cash_on_delivery` or `pay_at_pickup`).
5. **`order_items`**: Order item snapshots capturing item name and price at checkout time, ensuring past order totals remain unchanged when menu prices are updated later.
6. **`owner_accounts`**: Owner accounts with salted PBKDF2 password hashes (100,000 iterations of SHA-256) and audit timestamps.
7. **`sessions`**: Cryptographically secure session tokens stored as SHA-256 hashes with automatic expiration dates.
8. **`auth_rate_limits`**: Automated brute-force protection locking out IPs after 5 failed login attempts for 15 minutes.

---

## 4. Cloudflare Deployment from Android Phone / Browser

You can deploy and run this entire application without needing a local terminal or laptop.

### Step 1: Create a GitHub Repository
1. Open [github.com](https://github.com) on your phone or browser.
2. Create a new private or public repository named `restaurant-starter`.
3. Push or upload this codebase to your repository.

### Step 2: Create Cloudflare D1 Database in the Cloudflare Dashboard
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. Go to **Storage & Databases** &gt; **D1 SQL Database**.
3. Tap **Create database** &gt; Choose **Dashboard**.
4. Set the Database Name to: `restaurant-starter-db`.
5. Tap **Create**.
6. Copy the generated **Database ID** (a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
7. In your GitHub repository, edit `wrangler.jsonc` and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with your real Database ID.

### Step 3: Run Database Migrations in the Browser (No CLI Needed!)
*Can be done directly inside the Cloudflare Mobile/Desktop browser dashboard:*
1. In Cloudflare Dashboard, open your D1 database (`restaurant-starter-db`).
2. Tap the **Console** tab.
3. Open `migrations/0001_initial_schema.sql` on GitHub, copy the full SQL text, paste it into the Cloudflare D1 Console, and tap **Execute**.
4. Next, open `migrations/0002_seed_data.sql`, copy the SQL, paste it into the Console, and tap **Execute**.
*Your database is now fully initialized with tables and initial menu items!*

### Step 4: Deploy with Cloudflare Workers Builds
1. In the Cloudflare Dashboard, go to **Workers & Pages** &gt; **Create application**.
2. Tap **Pages** or **Workers** &gt; **Connect to Git**.
3. Select your GitHub repository (`restaurant-starter`).
4. Configure Build Settings:
   - **Framework preset**: `None` or `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Under **Environment Variables**, add:
   - Variable name: `BOOTSTRAP_SECRET`
   - Value: `<Choose a strong secret phrase, e.g. MySecretKitchen2026>`
6. Tap **Save and Deploy**. Cloudflare builds and deploys your site to `https://restaurant-starter.<your-subdomain>.workers.dev`.

### Step 5: (Optional) Set up Cloudflare R2 for Image Uploads
1. In Cloudflare Dashboard, navigate to **Storage & Databases** &gt; **R2**.
2. Tap **Create bucket** and name it `restaurant-starter-images`.
3. In your Worker's **Settings** &gt; **Bindings**, add an R2 Bucket binding:
   - Variable name: `IMAGES`
   - R2 Bucket: `restaurant-starter-images`

---

## 5. Secure One-Time Owner Account Bootstrap

To ensure total security without hardcoding default passwords:

1. Once deployed, open `https://your-app-domain/#admin` in your browser.
2. The application detects that no owner exists yet and displays the **Initial Owner Bootstrap** screen.
3. Enter your desired **Username**, **Password** (min. 8 characters), and the **BOOTSTRAP_SECRET** you configured in Cloudflare environment variables.
4. Tap **Initialize Owner Account**.
5. The server hashes your password with PBKDF2 (100,000 iterations), stores the owner account, and logs you into the dashboard.
6. **Permanent Lockout**: Subsequent calls to `/api/auth/bootstrap` return `403 Forbidden` because an owner now exists. The bootstrap screen will never appear again.

---

## 6. Managing the Restaurant via Owner Dashboard

Access the dashboard at `/#admin` or click **Owner Administration** in the site footer:

- **Live Orders**: See incoming customer orders, contact numbers, delivery addresses, and customer notes. Use 1-tap buttons to update status (`Preparing` &rarr; `Out for Delivery` / `Ready for Pickup` &rarr; `Completed`).
- **Menu Items**: Add new dishes, edit descriptions and prices, upload photos, mark items **In Stock / Sold Out**, or hide them from the public menu.
- **Categories**: Reorder sections and add new menu groupings.
- **Restaurant Settings**: Update restaurant name, contact phone, opening hours, delivery fee, minimum order amount, and toggle Delivery or Pickup availability on/off.
- **Instant Preview**: Changes take effect immediately in the database without any redeployment.

---

## 7. Manual Testing Checklist

| Step | Action | Expected Result |
| :---: | :--- | :--- |
| **1** | Open customer website on mobile & desktop | Clean layout loads with English culinary branding, hero image, and navigation links. |
| **2** | Search dishes in Menu | Filters dishes in real time by name, ingredient, and category tabs. |
| **3** | Add dishes to basket with special notes | Basket count badge updates with accurate itemized quantity and subtotal. |
| **4** | Toggle Home Delivery vs Pickup | Delivery fee automatically recalculates; address field appears only for delivery. |
| **5** | Submit order with Cash on Delivery | Server generates order number (`RS-YYYYMMDD-XXXX`), redirects to order tracker. |
| **6** | Track order using order number | Real-time progress bar shows status: `Received` &rarr; `Preparing` &rarr; `Completed`. |
| **7** | Log into `/admin` dashboard | View the new order with item snapshots and customer details. |
| **8** | Mark an item "Sold Out" in admin | Customer menu immediately shows "Sold Out Today" and prevents adding to basket. |
| **9** | Test invalid login attempts | System displays warning and locks out after 5 consecutive failed attempts. |

---

## 8. License & Standards
Built with clean TypeScript and modern web standards. Free from proprietary vendor lock-in or paid third-party dependencies.
