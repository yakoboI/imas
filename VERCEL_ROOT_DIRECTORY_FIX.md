# 🔧 Vercel Root Directory Not Showing "frontend" - Fix Guide

## Problem
When setting Root Directory in Vercel, you only see:
- `backend`
- `deployment`  
- `docs`

But **NOT** `frontend` folder.

## ✅ Solution: Type It Manually

**Don't rely on the dropdown!** Just type the path directly.

### For Web App:
1. Click inside the **"Root Directory"** field
2. **Type exactly:** `frontend/web-app`
3. Press Tab or click elsewhere
4. Vercel will accept it even if it's not in the dropdown

### For SuperAdmin Portal:
1. Click inside the **"Root Directory"** field  
2. **Type exactly:** `frontend/superadmin-portal`
3. Press Tab or click elsewhere

---

## Why This Happens

Vercel's dropdown might:
- Only show folders with `package.json` at the root level
- Cache the folder list
- Need time to sync with GitHub

But typing the path manually **always works** because Vercel reads directly from your GitHub repo.

---

## Verify It's Correct

After typing the path, Vercel should:
1. Show a checkmark ✅
2. Detect Framework as "Vite" automatically
3. Show Build Command as "vite build" or "npm run build"

If you see errors, check:
- ✅ No typos (exactly `frontend/web-app`, not `frontend/webapp`)
- ✅ No trailing slash (not `frontend/web-app/`)
- ✅ Case sensitive (lowercase `frontend`, not `Frontend`)

---

## Quick Checklist

### Web App Project:
- [ ] Root Directory: `frontend/web-app`
- [ ] Framework: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### SuperAdmin Project:
- [ ] Root Directory: `frontend/superadmin-portal`
- [ ] Framework: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

---

## Still Not Working?

1. **Check GitHub:** Go to https://github.com/yakoboI/imas
   - Do you see the `frontend` folder?
   - If NO → The folder isn't in git (we need to commit it)
   - If YES → Continue to step 2

2. **Disconnect and Reconnect:**
   - Vercel Dashboard → Your Project → Settings → Git
   - Click "Disconnect"
   - Click "Connect Git Repository" again
   - Select `yakoboI/imas`
   - Try typing the path again

3. **Check for Typos:**
   - Make sure it's exactly: `frontend/web-app` (with hyphen, not underscore)
   - Not: `frontend/webapp` or `Frontend/web-app`

---

## Confirmation

After typing the path, you should see:
- ✅ Framework detected: "Vite"
- ✅ Build settings auto-filled
- ✅ No error messages

If you see all of this, you're good to go! 🎉

