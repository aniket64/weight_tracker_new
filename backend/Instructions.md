# Weight Tracker - Deployment Guide

This guide covers how to set up the Google Sheet database and deploy the website so you can use it on your phone.

---

## Part 1: The Database (Google Sheets)

1.  **Create Sheet**: Go to [sheets.new](https://sheets.new) and create a new Google Sheet.
2.  **Open Script Editor**: Click `Extensions` > `Apps Script`.

### Fix Permissions (Crucial Step)
*This step prevents the "App is Blocked" error.*
1.  In the Apps Script sidebar, click **Project Settings** (the Gear icon ⚙️).
2.  Check the box **"Show 'appsscript.json' manifest file in editor"**.
3.  Go back to the **Editor** (code icon `<>`).
4.  Click on `appsscript.json` in the left sidebar.
5.  **Delete everything** in that file and paste the content from `backend/appsscript.json` provided in this project.
6.  Save (Cmd+S / Ctrl+S).

### Add Code
1.  Click on `Code.gs` in the sidebar.
2.  **Delete everything** in `Code.gs` and paste the content from `backend/Code.js` provided in this project.
3.  Save.

### Run Initial Setup
1.  Select `initialSetup` from the function dropdown in the toolbar.
2.  Click **Run**.
3.  Accept permissions (Click Review -> Select Account -> Advanced -> Go to Project (Unsafe) -> Allow).
4.  Verify that `Users` and `Weight_Log` tabs appeared in your Google Sheet.

### Deploy API
1.  Click **Deploy** (blue button top right) > **New Deployment**.
2.  Click the Gear icon ⚙️ next to "Select type" > **Web app**.
3.  **Description**: `v1`
4.  **Execute as**: `Me` (your email).
5.  **Who has access**: **Anyone** (Must be 'Anyone' or the app won't work on mobile).
6.  Click **Deploy**.
7.  **COPY the Web App URL** (ends in `/exec`).

---

## Part 2: Connect the App

1.  Open `constants.ts` in this project.
2.  Paste the URL you just copied into `HARDCODED_API_URL`.
    ```typescript
    export const HARDCODED_API_URL: string = "https://script.google.com/macros/s/YOUR_ID_HERE/exec"; 
    ```
3.  Save the file.

---

## Part 3: Publish to the Internet

To use this on your phone, you need to host the website.

### Option A: Vercel (Recommended)
1.  Download this project to your computer.
2.  Upload the folder to a **GitHub** repository.
3.  Go to [Vercel.com](https://vercel.com) and sign up.
4.  Click **Add New Project** and select your GitHub repo.
5.  Click **Deploy**.
6.  Vercel will give you a domain (e.g., `weight-tracker.vercel.app`).

### Option B: Netlify Drop (No Account needed initially)
1.  Run `npm run build` on your computer to create a `dist` folder.
2.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3.  Drag and drop the `dist` folder onto the page.
4.  It will give you a live URL immediately.

**You can now open that URL on any device and it will automatically connect to your Google Sheet!**