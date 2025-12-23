# Removing Credentials from Git History

## ⚠️ CRITICAL: Your credentials were exposed in git history!

The following credentials were found in your git history:
- **Database Password**: `Mkalanga1994!@` (in `backend/create-env.ps1`)
- **JWT Secrets**: Various secrets in the same file
- **Railway PostgreSQL Password**: `dstsWeaAwnAayKOLodUCoqRbatzGfAkR` (in `RAILWAY_POSTGRES_VARIABLES.md`)

## Steps to Remove from Git History

### Option 1: Using BFG Repo-Cleaner (Recommended - Easier)

1. **Download BFG Repo-Cleaner**:
   - Download from: https://rtyley.github.io/bfg-repo-cleaner/
   - Or install via: `choco install bfg` (if you have Chocolatey)

2. **Create a passwords.txt file** with the credentials to remove:
   ```
   Mkalanga1994!@
   dstsWeaAwnAayKOLodUCoqRbatzGfAkR
   ```

3. **Run BFG**:
   ```bash
   cd C:\Users\Admin\Desktop\imas
   java -jar bfg.jar --replace-text passwords.txt
   ```

4. **Clean up**:
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

5. **Force push** (⚠️ WARNING: This rewrites history):
   ```bash
   git push origin --force --all
   ```

### Option 2: Using git filter-branch (Manual)

If you have Git Bash installed:

```bash
cd C:\Users\Admin\Desktop\imas

# Remove the password from history
git filter-branch --force --index-filter \
  "git checkout-index -f -a && \
   if [ -f backend/create-env.ps1 ]; then \
     sed -i 's/Mkalanga1994!@/your-database-password-here/g' backend/create-env.ps1; \
   fi" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

### Option 3: Nuclear Option - Start Fresh (If repository is not shared)

If this is a personal project and you haven't shared it widely:

1. **Create a new repository** without the history
2. **Push only the current clean state**

```bash
cd C:\Users\Admin\Desktop\imas
git checkout --orphan new-main
git add .
git commit -m "Initial commit (credentials removed)"
git branch -D main
git branch -m main
git push -f origin main
```

## ⚠️ IMPORTANT: After Removing from Git

### 1. Rotate ALL Exposed Credentials Immediately:

- **Database Password**: Change your PostgreSQL password
- **JWT Secrets**: Generate new JWT secrets (minimum 32 characters)
- **Railway PostgreSQL Password**: Regenerate in Railway dashboard
- **Any other exposed credentials**: Change them all

### 2. Verify .gitignore

Make sure `.gitignore` includes:
```
.env
.env.local
.env.*.local
*.env
```

### 3. Check for Other Exposed Files

Run this to check for any other potential credential leaks:
```bash
git log --all --full-history -p | grep -i "password\|secret\|api_key\|token"
```

### 4. Notify Team Members

If others have cloned the repository:
- They need to delete their local copies
- Re-clone after you've cleaned the history
- Or they can run: `git fetch origin && git reset --hard origin/main`

## Current Status

✅ Credentials have been removed from current files
✅ Files updated with placeholders
⏳ Git history still contains old credentials (needs cleanup)
⏳ Credentials need to be rotated

