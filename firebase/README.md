# Firebase Configuration

This directory contains all Firebase configuration files for the project.

## Files

- **firestore.rules**: Security rules for Firestore database
- **firestore.indexes.json**: Composite indexes for optimized queries
- **storage.rules**: Security rules for Cloud Storage
- **firebase.json**: Firebase project configuration
- **.firebaserc**: Firebase project aliases

## Setup

1. **Initialize Firebase** (if not already done):

```bash
firebase login
firebase init
```

2. **Update .firebaserc** with your project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

3. **Deploy Firestore rules**:

```bash
firebase deploy --only firestore:rules
```

4. **Deploy Firestore indexes**:

```bash
firebase deploy --only firestore:indexes
```

5. **Deploy Storage rules**:

```bash
firebase deploy --only storage
```

6. **Deploy all at once**:

```bash
firebase deploy
```

## Security Rules Overview

### Firestore Rules

- Users can only read/write their own user document
- Clients and invoices are protected by ownership (ownedBy field)
- All operations require authentication

### Storage Rules

- Invoice PDFs are publicly readable (adjust if needed)
- Backend service has admin access via service account

## Indexes

Composite indexes are defined for:

- Clients by owner and creation date
- Invoices by owner and creation date
- Invoices by client and creation date
- Invoices by owner, status, and creation date

These indexes are automatically created when deployed.
