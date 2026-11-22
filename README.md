# Bastiodon - Child Cyber Safety & Parental Monitoring SaaS Platform

Bastiodon is a full-stack, real-time parental control and child cyber safety platform designed to safeguard children's digital navigation, prevent exposure to adult content, monitor in-game and web chats for predatory grooming and self-harm, and lock down unauthorized Incognito browsing.

---

## 1. System Architecture

```
Bastiodon Monorepo
├── /apps/web            # Next.js 14+ (App Router), Tailwind CSS, Recharts, Socket.io-client
├── /apps/server         # Node.js, Express, Socket.io (WebSocket rooms), node-cron EOD aggregator
├── /apps/extension      # Manifest V3 Extension (Chrome / Edge / Brave), declarativeNetRequest
└── /packages/database   # Prisma ORM (SQLite / PostgreSQL) + Seed Data
```

### Color Palette Tokens (Strictly Applied)
- **Canvas / Page Background:** `#F3F4F4` (Soft Off-White)
- **Surface / Cards:** `#FFFFFF` (Pure White with subtle `#E0E2E2` borders)
- **Primary Brand & Navigation:** `#612D53` (Deep Plum)
- **Secondary Accent & CTAs:** `#853953` (Berry Rose)
- **Primary Text & Dark Containers:** `#2C2C2C` (Charcoal)
- **Semantic Status Accents:** Safe Green `#16A34A` and Alert Red `#D93848`

---

## 2. Prerequisites
- **Node.js**: v18.0.0+ (Tested on Node v24)
- **npm** or **pnpm**
- **Google Chrome, Microsoft Edge, or Brave Browser**

---

## 3. Quickstart & Local Setup

### Step A: Setup Database & Seed Initial Plans
```bash
cd packages/database
npm install
npx prisma db push
node seed.js
```

### Step B: Start SaaS Backend & Socket.io Server
```bash
cd apps/server
npm install
npm run dev
# Server listens on http://localhost:4000
```

### Step C: Start Next.js Parent Web Application
```bash
cd apps/web
npm install
npm run dev
# Web Portal accessible at http://localhost:3000
```

---

## 4. Loading the Child Browser Extension (Manifest V3)

1. Open your browser (`chrome://extensions` in Google Chrome or `edge://extensions` in Microsoft Edge).
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the folder: `c:\Users\HP\OneDrive\Documents\GitHub\Bastiodon\apps\extension`.
5. Under extension details, click **Details** and enable **"Allow in Incognito"** (if testing incognito blocking).

---

## 5. End-to-End Testing Walkthrough

1. **Parent Account Registration / Login:**
   - Go to `http://localhost:3000/register`.
   - Create a parent account with your name, email, password, and a **4-6 digit Tamper PIN** (e.g., `1234`).
   - Select your subscription tier (e.g., `Pro Guardian ₹499/mo`).

2. **Add a Child Device:**
   - On the Parent Dashboard (`/dashboard`), click the **"+"** button under Child Devices.
   - Enter your child's name (e.g. *"Aarav's School Laptop"*) and click **Generate Pairing Code**.
   - Note the 6-character code (e.g. `X7K92P`).

3. **Pair the Browser Extension:**
   - Click the Bastiodon shield icon in your browser toolbar to open the extension popup (`popup.html`).
   - Enter the 6-character Pairing Code.
   - Click **Link Device to Parent Portal**.
   - The device will link and appear **Online (Green)** on your Parent Dashboard.

4. **Verify Dynamic Website Blocking:**
   - Ensure the "Block Adult Websites" or "Block Streaming Platforms" toggle is enabled on your Parent Dashboard.
   - Attempt to navigate to `pornhub.com`, `xvideos.com`, or any blocked domain.
   - The browser automatically redirects to the custom `blocked.html` page and logs the event to the parent dashboard.

5. **Verify Real-Time Chat & Search Scanner:**
   - In any web chatbox or search input (e.g. Roblox, Poki, Google, or any text field), type a flagged keyword (e.g. `"are you home alone"`, `"what is your address"`, `"kill yourself"`).
   - An instant color-coded WebSocket alert appears on the Parent Dashboard Live Scanner Feed accompanied by an audio alert.

6. **Verify Tamper-Resistant PIN:**
   - Open the extension popup. Click **Unlock & Unpair Device**.
   - Entering an incorrect PIN will deny access. Only the parent's master PIN can unpair the device.

7. **Review End-of-Day (EOD) Summary:**
   - Click the **End-of-Day (EOD) Summary** tab to inspect daily screen time, domain breakdown bar charts, and safety distribution pie charts.

