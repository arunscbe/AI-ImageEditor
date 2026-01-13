# 🔧 Fix Account Permission Issue

## Problem
You created Firebase project with `syedsadiq201415@gmail.com` but gcloud is using `syedsadiq@royalcyber.com`.

## Solution - Choose ONE:

### Option 1: Login with Firebase Account (Recommended)

```powershell
# Login with the Firebase account
gcloud auth login syedsadiq201415@gmail.com

# Set it as active
gcloud config set account syedsadiq201415@gmail.com

# Set the project
gcloud config set project threeddd-design-editor

# Verify
gcloud config list

# Now deploy
gcloud builds submit --config cloudbuild.yaml
```

### Option 2: Add Your RoyalCyber Account to Firebase Project

1. Go to Firebase Console: https://console.firebase.google.com/project/threeddd-design-editor/settings/iam

2. Click **"Add member"**

3. Add email: `syedsadiq@royalcyber.com`

4. Select role: **"Editor"** or **"Owner"**

5. Click **"Add"**

6. Then in terminal:
```powershell
gcloud config set project threeddd-design-editor
gcloud builds submit --config cloudbuild.yaml
```

### Option 3: Use Existing plausiblesadiq@gmail.com Account

```powershell
# Switch to the plausiblesadiq account (already logged in)
gcloud config set account plausiblesadiq@gmail.com

# Add this account to Firebase project first (via Firebase Console)
# Then:
gcloud config set project threeddd-design-editor
gcloud builds submit --config cloudbuild.yaml
```

## Quick Fix (Try This First!)

```powershell
# Login with syedsadiq201415@gmail.com
gcloud auth login

# When browser opens, login with: syedsadiq201415@gmail.com

# After successful login:
gcloud config set account syedsadiq201415@gmail.com
gcloud config set project threeddd-design-editor

# Verify it worked
gcloud projects describe threeddd-design-editor

# Deploy!
gcloud builds submit --config cloudbuild.yaml
```

## Troubleshooting

If you get "The caller does not have permission":
- Make sure you're using the same email that created the Firebase project
- OR add your current email to the project via Firebase Console

If you can't remember which email created the project:
- Check Firebase Console in your browser
- Look at top-right corner for logged-in email
- Use that email for gcloud


