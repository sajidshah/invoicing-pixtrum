# Gmail OAuth Integration Setup Guide

## Overview

This guide will walk you through setting up Gmail OAuth integration to send invoices via email using your users' Gmail accounts.

## Prerequisites

- Google Cloud Console account
- Railway account (for production deployment)
- Firebase project configured

---

## Step 1: Set Up Google Cloud Console OAuth

### 1.1 Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** > **Library**
4. Search for "Gmail API"
5. Click **Enable**

### 1.2 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in app name, user support email, developer contact
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Add test users (for testing phase)
4. Select **Web application** as application type
5. Add authorized redirect URIs:
   - **Local development**: `http://localhost:8080/gmail/callback`
   - **Production**: `https://YOUR-PDF-SERVICE.up.railway.app/gmail/callback`
6. Click **Create**
7. **Save** the Client ID and Client Secret

---

## Step 2: Update Environment Variables

### 2.1 Local Development

Edit `services/invoice-renderer/.env`:

```bash
# Add these new variables
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/gmail/callback
FRONTEND_URL=http://localhost:3000
```

### 2.2 Production (Railway)

Add environment variables to your **PDF Service** on Railway:

1. Go to Railway dashboard
2. Select your `invoice-renderer` service
3. Go to **Variables** tab
4. Add:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=https://YOUR-PDF-SERVICE.up.railway.app/gmail/callback
   FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
   ```

---

## Step 3: Update Firestore Security Rules

Add Gmail fields to your settings collection rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /settings/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Allow Gmail OAuth fields
      allow update: if request.auth != null
        && request.auth.uid == userId
        && request.resource.data.keys().hasAny(['gmailConnected', 'gmailEmail', 'gmailRefreshToken']);
    }
  }
}
```

---

## Step 4: Deploy Backend Changes

### 4.1 Commit and Push

```bash
cd /Users/shahx/Sites/invoicing-pixtrum

# Stage all changes
git add .

# Commit
git commit -m "Add Gmail OAuth integration for invoice email sending"

# Push to GitHub
git push origin frontend
```

### 4.2 Railway Auto-Deploy

Railway will automatically rebuild your PDF service with the new Gmail endpoints.

---

## Step 5: Test the Integration

### 5.1 Local Testing

1. Start both services:

   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - PDF Service
   npm run dev:service
   ```

2. Navigate to **Settings** page
3. Click **Connect Gmail**
4. Authorize the app with your Google account
5. You should be redirected back to Settings with "Gmail connected successfully"

### 5.2 Send Test Email

1. Go to **Invoices** page
2. Generate a PDF for an invoice
3. Click the **Send Email** button (you'll need to add this UI - see next section)
4. Enter recipient email, subject, and message
5. Send!

---

## Step 6: Add "Send Email" UI to Invoices (Next Task)

You'll need to create a modal/dialog component for composing the email with:

- Recipient email (pre-filled from client)
- Subject line (default: "Invoice #123 from Your Company")
- Message body (default: "Please find attached invoice...")
- Send button

This can be added to the invoice actions dropdown or as a separate button.

---

## Security Considerations

### Production Best Practices:

1. **Encrypt refresh tokens** - The current implementation stores refresh tokens in plain text. You should:
   - Use a KMS (Key Management Service) like Google Cloud KMS
   - Or use Firebase Functions with Secret Manager
2. **Rotate tokens** - Implement token rotation logic

3. **Rate limiting** - Add rate limits to email sending endpoints

4. **Audit logging** - Log all email sends for compliance

5. **User permissions** - Consider adding a "can send emails" permission check

---

## Troubleshooting

### Error: "No refresh token received"

- Make sure `prompt: 'consent'` is in the OAuth URL
- Make sure `access_type: 'offline'` is set
- Try revoking app access in Google Account settings and reconnecting

### Error: "Invalid redirect URI"

- Double-check the redirect URI matches exactly in Google Cloud Console
- No trailing slashes
- Use HTTPS in production

### Error: "Gmail API has not been used"

- Enable the Gmail API in Google Cloud Console
- Wait a few minutes for it to propagate

### Error: "Insufficient Permission"

- Check that all required scopes are added in OAuth consent screen
- User must authorize all scopes during connection

### Emails Going to Spam/Junk

If your invoice emails are landing in the recipient's spam folder, try these solutions:

1. **Warm up your sending**: Start by sending a few emails to yourself and mark them as "Not Spam"
2. **Ask recipients to whitelist**: Have clients add your email to their contacts
3. **SPF/DKIM Records**: Add proper email authentication (this requires domain setup)
4. **Avoid spam trigger words**: Don't use words like "Free", "Act Now", excessive capitals
5. **Send test emails first**: Send a regular email conversation with the client before sending invoice
6. **Use your actual company domain**: If possible, use a custom domain email instead of @gmail.com
7. **Reply-To header**: The app now includes a Reply-To header using your company email

**Note**: The app now includes proper email headers (Reply-To, X-Priority, Importance) to help reduce spam classification, but deliverability also depends on:

- Your sender reputation
- Email authentication (SPF, DKIM, DMARC)
- Recipient's spam filter settings

---

## What's Next?

1. ✅ Gmail OAuth flow implemented
2. ✅ Backend endpoints for auth and sending emails
3. ✅ Settings page with Connect/Disconnect UI
4. ✅ Create "Send Email" modal component
5. ✅ Add "Send Email" button to invoice actions
6. ✅ Add email sent indicator/timestamp to invoices list
7. 🔲 (Optional) Add email send history/logs
8. 🔲 (Optional) Implement SPF/DKIM for custom domain

---

## Files Modified

### Backend

- `services/invoice-renderer/src/server.ts` - Added Gmail OAuth endpoints and email sending
- `services/invoice-renderer/.env.example` - Added Gmail OAuth env vars
- `services/invoice-renderer/package.json` - Already has googleapis

### Frontend

- `app/composables/useGmail.ts` - Gmail OAuth composable
- `app/pages/settings.vue` - Gmail connection UI
- `app/lib/types.ts` - Added Gmail fields to UserSettings

---

## Need Help?

If you encounter issues, check:

1. Railway logs for the PDF service
2. Browser console for frontend errors
3. Firebase Firestore rules are updated
4. All environment variables are set correctly
