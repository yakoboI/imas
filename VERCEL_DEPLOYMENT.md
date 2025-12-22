# 🚀 Vercel Deployment Guide - Copy & Paste Ready

## 📋 Prerequisites
- ✅ GitHub repo: `https://github.com/yakoboI/imas`
- ✅ Railway backend URL: `https://YOUR-BACKEND.up.railway.app` (replace with your actual URL)
- ✅ Vercel account logged in

---

## 🌐 STEP 1: Deploy Web App (Main Frontend)

### 1.1 Go to Vercel Dashboard
```
https://vercel.com/new
```

### 1.2 Import GitHub Repository
- Click **"Import Git Repository"**
- Select: `yakoboI/imas`
- Click **"Import"**

### 1.3 Configure Project Settings

**Project Name:**
```
imas-web-app
```

**Root Directory:**
```
frontend/web-app
```

**Framework Preset:**
```
Vite
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

### 1.4 Environment Variables

Click **"Environment Variables"** and add:

**Variable Name:**
```
VITE_API_URL
```

**Value:**
```
https://YOUR-BACKEND.up.railway.app/api
```
*(Replace `YOUR-BACKEND` with your actual Railway backend URL)*

### 1.5 Deploy

Click **"Deploy"**

### 1.6 Copy Your Web App URL

After deployment, copy the URL (will look like):
```
https://imas-web-app.vercel.app
```

**📋 COPY THIS URL - You'll need it for Railway backend env vars!**

---

## 🔐 STEP 2: Deploy SuperAdmin Portal

### 2.1 Create New Project in Vercel

Go to:
```
https://vercel.com/new
```

### 2.2 Import Same GitHub Repository
- Click **"Import Git Repository"**
- Select: `yakoboI/imas` (same repo)
- Click **"Import"**

### 2.3 Configure Project Settings

**Project Name:**
```
imas-superadmin
```

**Root Directory:**
```
frontend/superadmin-portal
```

**Framework Preset:**
```
Vite
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

### 2.4 Environment Variables

Click **"Environment Variables"** and add:

**Variable Name:**
```
VITE_API_URL
```

**Value:**
```
https://YOUR-BACKEND.up.railway.app/api
```
*(Replace `YOUR-BACKEND` with your actual Railway backend URL)*

### 2.5 Deploy

Click **"Deploy"**

### 2.6 Copy Your SuperAdmin URL

After deployment, copy the URL (will look like):
```
https://imas-superadmin.vercel.app
```

**📋 COPY THIS URL - You'll need it for Railway backend env vars!**

---

## ⚙️ STEP 3: Update Railway Backend Environment Variables

### 3.1 Go to Railway Dashboard

Open your backend service in Railway.

### 3.2 Add/Update Environment Variables

Go to **"Variables"** tab and add/update:

**Variable Name:**
```
FRONTEND_URL
```

**Value:**
```
https://imas-web-app.vercel.app
```
*(Replace with your actual web app URL from Step 1.6)*

---

**Variable Name:**
```
SUPERADMIN_URL
```

**Value:**
```
https://imas-superadmin.vercel.app
```
*(Replace with your actual superadmin URL from Step 2.6)*

### 3.3 Redeploy Backend

After updating env vars, Railway will auto-redeploy. Wait for deployment to complete.

---

## ✅ STEP 4: Test Your Deployments

### 4.1 Test Web App
Open in browser:
```
https://imas-web-app.vercel.app
```

### 4.2 Test SuperAdmin Portal
Open in browser:
```
https://imas-superadmin.vercel.app
```

### 4.3 Test Backend Health
Open in browser:
```
https://YOUR-BACKEND.up.railway.app/health
```

---

## 📝 Quick Reference - All Your URLs

### Web App (Main Frontend)
```
https://imas-web-app.vercel.app
```

### SuperAdmin Portal
```
https://imas-superadmin.vercel.app
```

### Backend API
```
https://YOUR-BACKEND.up.railway.app/api
```

### Backend Health Check
```
https://YOUR-BACKEND.up.railway.app/health
```

---

## 🔄 Future Updates

After you push code to GitHub:
- **Vercel** will automatically redeploy both frontends
- **Railway** will automatically redeploy backend (if auto-deploy is enabled)

No manual steps needed! 🎉

---

## 🐛 Troubleshooting

### Frontend can't connect to backend?
1. Check `VITE_API_URL` in Vercel matches your Railway backend URL
2. Check Railway backend `FRONTEND_URL` and `SUPERADMIN_URL` match your Vercel URLs
3. Check Railway backend CORS settings in `server.js`

### Build fails on Vercel?
1. Check Root Directory is correct (`frontend/web-app` or `frontend/superadmin-portal`)
2. Check Build Command is `npm run build`
3. Check Output Directory is `dist`

### Backend not responding?
1. Check Railway service is running (not paused)
2. Check environment variables are set correctly
3. Check database connection in Railway logs

