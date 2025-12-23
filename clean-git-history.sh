#!/bin/bash
# Script to remove credentials from git history

export FILTER_BRANCH_SQUELCH_WARNING=1

echo "Starting git history rewrite to remove credentials..."
echo "This may take a few minutes..."

git filter-branch -f --tree-filter '
if [ -f backend/create-env.ps1 ]; then
    sed -i "s/Mkalanga1994!@/your-database-password-here/g" backend/create-env.ps1
    sed -i "s/your_super_secret_jwt_key_change_in_production_12345/your-super-secret-jwt-key-change-in-production-minimum-32-characters/g" backend/create-env.ps1
    sed -i "s/your_refresh_token_secret_12345/your-refresh-token-secret-minimum-32-characters/g" backend/create-env.ps1
fi
' --prune-empty --tag-name-filter cat -- --all

echo ""
echo "Cleaning up git references..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleaned!"
echo ""
echo "⚠️  IMPORTANT: You need to force push to update the remote:"
echo "   git push origin --force --all"
echo ""
echo "⚠️  Also remember to:"
echo "   1. Rotate all exposed credentials (database password, JWT secrets, etc.)"
echo "   2. Notify team members to re-clone the repository"

