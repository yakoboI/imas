# 🖱️ Vercel Deployment - Click-by-Click Guide

Follow these exact steps. Every click is explained.

---

## 🌐 PART 1: Deploy Web App (Main Frontend)

### STEP 1: Open Vercel
1. Open your web browser
2. Go to: **https://vercel.com**
3. **Click** the **"Log In"** button (top right)
4. **Click** **"Continue with GitHub"** (if you have GitHub account)
5. Authorize Vercel if prompted

### STEP 2: Start New Project
1. After logging in, you'll see the Vercel dashboard
2. **Click** the big **"Add New..."** button (top right, usually blue)
3. **Click** **"Project"** from the dropdown menu

**OR** go directly to: **https://vercel.com/new**

### STEP 3: Connect GitHub Repository
1. You'll see a page titled **"Import Git Repository"**
2. You'll see a search box that says **"Search repositories..."**
3. **Type:** `imas` in the search box
4. You should see **"yakoboI/imas"** appear in the list
5. **Click** on **"yakoboI/imas"**

### STEP 4: Configure Project - Project Name
1. After clicking the repo, you'll see a configuration page
2. At the top, you'll see **"Project Name"** field
3. **Click** inside the **"Project Name"** text box
4. **Delete** any existing text
5. **Type:** `imas-web-app`
6. **Press Tab** or click elsewhere

### STEP 5: Configure Root Directory
1. Scroll down or look for **"Root Directory"** section
2. You'll see a text field that might say **"Leave empty to use repository root"**
3. **Click** the **"Edit"** button or **"Configure"** link next to Root Directory
4. **Click** inside the Root Directory text box
5. **Type:** `frontend/web-app`
6. **Press Tab** or click elsewhere

### STEP 6: Configure Framework
1. Look for **"Framework Preset"** dropdown
2. **Click** the dropdown (it might say "Other" or "Auto-detect")
3. **Scroll down** and **Click** **"Vite"** from the list
4. The dropdown will close automatically

### STEP 7: Configure Build Settings
1. Look for **"Build and Output Settings"** section
2. **Click** **"Override"** or **"Edit"** next to Build Command
3. **Click** inside the **"Build Command"** text box
4. **Type:** `npm run build`
5. **Press Tab**

6. **Click** inside the **"Output Directory"** text box
7. **Type:** `dist`
8. **Press Tab**

9. **Click** inside the **"Install Command"** text box (if visible)
10. **Type:** `npm install`
11. **Press Tab**

### STEP 8: Add Environment Variable
1. Scroll down to find **"Environment Variables"** section
2. **Click** the **"Add"** button or **"Add Environment Variable"** link
3. A popup or form will appear

4. In the **"Key"** or **"Name"** field, **Type:** `VITE_API_URL`
5. **Press Tab**

6. In the **"Value"** field, **Type:** `https://YOUR-BACKEND.up.railway.app/api`
   - **IMPORTANT:** Replace `YOUR-BACKEND` with your actual Railway backend URL
   - Example: If your Railway URL is `https://imas-production.up.railway.app`, then type:
   - `https://imas-production.up.railway.app/api`

7. **Click** the **"Save"** button or **"Add"** button

### STEP 9: Deploy
1. Scroll to the bottom of the page
2. **Click** the big blue **"Deploy"** button
3. Wait for deployment (this takes 2-5 minutes)
4. You'll see a progress bar and logs

### STEP 10: Get Your Web App URL
1. After deployment completes, you'll see a success page
2. At the top, you'll see **"Congratulations! Your project has been deployed"**
3. You'll see a URL that looks like: **`https://imas-web-app-xxxxx.vercel.app`**
4. **Click** the **"Copy"** button next to the URL (or manually copy it)
5. **📋 SAVE THIS URL** - Write it down or copy to notepad
6. This is your **Web App URL**

---

## 🔐 PART 2: Deploy SuperAdmin Portal

### STEP 1: Go to New Project Again
1. In Vercel dashboard, **Click** **"Add New..."** button again (top right)
2. **Click** **"Project"**

**OR** go to: **https://vercel.com/new**

### STEP 2: Connect Same GitHub Repository
1. You'll see **"Import Git Repository"** page again
2. **Type:** `imas` in the search box
3. **Click** on **"yakoboI/imas"** again (same repo!)

### STEP 3: Configure Project Name
1. **Click** inside **"Project Name"** text box
2. **Delete** existing text
3. **Type:** `imas-superadmin`
4. **Press Tab**

### STEP 4: Configure Root Directory
1. **Click** **"Edit"** or **"Configure"** next to Root Directory
2. **Click** inside Root Directory text box
3. **Type:** `frontend/superadmin-portal`
4. **Press Tab**

### STEP 5: Configure Framework
1. **Click** Framework Preset dropdown
2. **Click** **"Vite"**

### STEP 6: Configure Build Settings
1. **Click** **"Override"** next to Build Command
2. **Type:** `npm run build` in Build Command
3. **Type:** `dist` in Output Directory
4. **Type:** `npm install` in Install Command (if visible)

### STEP 7: Add Environment Variable
1. Scroll to **"Environment Variables"**
2. **Click** **"Add"** button
3. **Type:** `VITE_API_URL` in Key field
4. **Type:** `https://YOUR-BACKEND.up.railway.app/api` in Value field
   - (Same Railway URL as before!)
5. **Click** **"Save"**

### STEP 8: Deploy
1. Scroll to bottom
2. **Click** **"Deploy"** button
3. Wait for deployment (2-5 minutes)

### STEP 9: Get Your SuperAdmin URL
1. After deployment, copy the URL
2. It will look like: **`https://imas-superadmin-xxxxx.vercel.app`**
3. **📋 SAVE THIS URL** - Write it down

---

## ⚙️ PART 3: Update Railway Backend

### STEP 1: Open Railway Dashboard
1. Go to: **https://railway.app**
2. **Click** **"Log In"** if needed
3. You'll see your projects

### STEP 2: Open Your Backend Service
1. **Click** on your project (the one with your backend)
2. **Click** on your **backend service** (the Node.js service)

### STEP 3: Open Variables Tab
1. At the top, you'll see tabs: **"Deployments"**, **"Variables"**, **"Settings"**, etc.
2. **Click** the **"Variables"** tab

### STEP 4: Add FRONTEND_URL
1. **Click** the **"New Variable"** button (usually top right)
2. In **"Key"** field, **Type:** `FRONTEND_URL`
3. In **"Value"** field, **Paste** your Web App URL from Part 1, Step 10
   - Example: `https://imas-web-app-xxxxx.vercel.app`
4. **Click** **"Add"** or **"Save"**

### STEP 5: Add SUPERADMIN_URL
1. **Click** **"New Variable"** button again
2. In **"Key"** field, **Type:** `SUPERADMIN_URL`
3. In **"Value"** field, **Paste** your SuperAdmin URL from Part 2, Step 9
   - Example: `https://imas-superadmin-xxxxx.vercel.app`
4. **Click** **"Add"** or **"Save"**

### STEP 6: Wait for Redeploy
1. Railway will automatically redeploy when you add variables
2. Wait 1-2 minutes for redeploy to complete
3. Check the **"Deployments"** tab to see progress

---

## ✅ PART 4: Test Everything

### Test 1: Web App
1. Open a new browser tab
2. Go to your Web App URL (from Part 1, Step 10)
3. You should see your login page
4. ✅ If you see the login page, it's working!

### Test 2: SuperAdmin Portal
1. Open a new browser tab
2. Go to your SuperAdmin URL (from Part 2, Step 9)
3. You should see the superadmin login page
4. ✅ If you see the login page, it's working!

### Test 3: Backend Health
1. Open a new browser tab
2. Go to: `https://YOUR-BACKEND.up.railway.app/health`
   - Replace `YOUR-BACKEND` with your actual Railway backend URL
3. You should see JSON like: `{"status":"ok","database":"connected"}`
4. ✅ If you see this, backend is working!

---

## 🎯 Quick Checklist

Before starting, make sure you have:
- [ ] Railway backend URL (looks like `https://xxxxx.up.railway.app`)
- [ ] Vercel account logged in
- [ ] GitHub repo `yakoboI/imas` is accessible

After deployment, you should have:
- [ ] Web App URL (from Vercel)
- [ ] SuperAdmin URL (from Vercel)
- [ ] Both URLs added to Railway backend variables
- [ ] All three URLs tested and working

---

## 🆘 If Something Goes Wrong

### Problem: Can't find repository in Vercel
**Solution:**
1. Make sure you're logged into Vercel with the same GitHub account
2. Go to Vercel Settings → GitHub
3. Make sure `yakoboI/imas` repo is authorized

### Problem: Build fails on Vercel
**Solution:**
1. Check Root Directory is exactly: `frontend/web-app` or `frontend/superadmin-portal`
2. Check Build Command is exactly: `npm run build`
3. Check Output Directory is exactly: `dist`
4. Look at build logs in Vercel to see the error

### Problem: Frontend shows blank page
**Solution:**
1. Check `VITE_API_URL` environment variable is set correctly
2. Make sure Railway backend URL is correct (ends with `/api`)
3. Check browser console (F12) for errors

### Problem: Can't connect to backend
**Solution:**
1. Check Railway backend is running (not paused)
2. Check `FRONTEND_URL` and `SUPERADMIN_URL` in Railway match your Vercel URLs
3. Check Railway backend CORS settings allow your Vercel domains

---

## 📞 Need More Help?

If you're stuck at any step:
1. Take a screenshot of where you are
2. Note which step number you're on
3. Check the error message (if any)
4. Look at the build logs in Vercel

---

**🎉 You're Done!** Your app should now be live on the internet!

