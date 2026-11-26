# Bastiodon

Bastiodon helps parents keep their children safe while using the internet on computers and laptops. It blocks harmful websites, spots risky conversations in online chats or searches, and sends live updates to a private dashboard that only parents can control.

---

## What Does It Do?

- **Blocks Bad Websites:** Automatically stops adult sites, gambling, and time-wasting streaming or gaming sites during study hours.
- **Flags Risky Messages:** Scans text in web chats and search bars for dangerous topics, personal information requests, or cyberbullying, and alerts parents right away.
- **Parent Master PIN:** Kids cannot remove or bypass the extension without the 6-digit PIN set by the parent.
- **Incognito Lock:** Prevents kids from sneaking around filters through private browsing windows.
- **Live Activity Feed:** Shows what sites were visited or blocked in real time, plus a simple daily report of screen time and activity.
- **Google Sign-In:** Parents can easily log in using their regular Google account or standard email and password.

---

## Project Structure

This project is organized into simple parts:

- **`apps/web`**: The website and parent dashboard where you change rules and view activity reports (built with Next.js).
- **`apps/server`**: The backend that handles logins, saves rules, and delivers live notifications (built with Node.js and Express).
- **`apps/extension`**: The browser extension installed on your child's browser (Chrome, Edge, or Brave).
- **`packages/database`**: The database setup using Prisma to store account details, paired devices, and activity logs safely.

---

## Getting Started

### What You Need First
- [Node.js](https://nodejs.org/) (version 18 or newer)
- Google Chrome, Brave, or Microsoft Edge

---

### Step 1: Set Up the Backend Server

1. Open your terminal and go to the server folder:
   ```bash
   cd apps/server
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Make sure your `.env` file has your database and Google login details:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bastiodon?schema=public"
   JWT_SECRET=bastiodon_super_secret_jwt_key_2026
   FRONTEND_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *Your server will now run at `http://localhost:4000`.*

---

### Step 2: Set Up the Web Dashboard

1. Open a new terminal window and go to the web folder:
   ```bash
   cd apps/web
   ```
2. Install the packages:
   ```bash
   npm install
   ```
3. Check your `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   ```
4. Start the website:
   ```bash
   npm run dev
   ```
   *Open your browser and visit `http://localhost:3000`.*

---

### Step 3: Install the Browser Extension

1. Open Chrome, Edge, or Brave and navigate to `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (the toggle switch in the top right corner).
3. Click the button that says **Load unpacked**.
4. Select the `apps/extension` folder inside this repository.
5. Click **Details** on the Bastiodon extension card and turn on **Allow in Incognito** so protection works in private tabs as well.

---

## How to Test It

1. **Sign In as a Parent:**
   - Go to `http://localhost:3000/login` or `http://localhost:3000/register`.
   - Sign in using the **Continue with Google** button or type in your email, password, and a 6-digit Parent PIN.

2. **Add Your Child's Computer:**
   - On the parent dashboard, click the **+** (Add Device) button.
   - Type a name like *"Sam's Laptop"* and click **Generate Pairing Code**.
   - A 6-character code will appear on your screen (for example, `AB12CD`).

3. **Link the Browser Extension:**
   - Click the puzzle icon in your browser toolbar, then click the **Bastiodon** icon.
   - Type in the 6-character code from your dashboard and click **Pair Device**.
   - Your dashboard will immediately show the device as **Online**.

4. **Test Website Blocking:**
   - On your dashboard, make sure the **Block Adult Content** or **Block Streaming** switch is turned on.
   - In the child's browser, try opening a blocked site.
   - The browser will stop the page and show a clean lock screen explaining that the site is blocked.

5. **Test the Chat Scanner:**
   - On any webpage with a chat box or search field (such as a game chat or Google search), type an alert phrase like `"where do you live send address"`.
   - The parent dashboard will immediately flag the message and display an alert in the live activity feed.

6. **Unpairing or Changing Rules:**
   - If anyone tries to disable the extension, it will ask for the 6-digit Parent PIN. Without that PIN, the extension cannot be turned off.

---

## License

This project is built for child online safety. All rights reserved.
