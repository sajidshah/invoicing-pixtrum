# Invoicing Pixtrum

A modern invoicing application built with Nuxt 3, Firebase, and serverless PDF generation.

## Architecture

- **Frontend**: Nuxt 3 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **PDF Service**: Node.js/Express on Cloud Run with Puppeteer

## Project Structure

```
/app/                           # Nuxt 3 front-end application
/services/invoice-renderer/     # Cloud Run PDF generation service
/firebase/                      # Firebase configuration and rules
```

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase account
- Google Cloud account (for Cloud Run deployment)

### Installation

1. **Install dependencies** (from root):

```bash
npm install
```

2. **Configure Firebase (Frontend)**:

```bash
cp app/.env.example app/.env
```

Edit `app/.env` with your Firebase project credentials:

```
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Configure Firebase (PDF Service)**:

```bash
cp services/invoice-renderer/.env.example services/invoice-renderer/.env
```

Edit `services/invoice-renderer/.env`:

```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
STORAGE_BUCKET=your_project.appspot.com
```

### Development

**Run Nuxt frontend**:

```bash
npm run dev:app
# or
npm run dev -w app
```

Frontend will be available at `http://localhost:3000`

**Run PDF service**:

```bash
npm run dev:service
# or
npm run dev -w invoice-renderer
```

Service will be available at `http://localhost:8080`

### Firebase Setup

1. **Initialize Firebase** (optional for hosting):

```bash
firebase login
firebase init
```

2. **Deploy Firestore rules**:

```bash
firebase deploy --only firestore:rules
```

3. **Deploy Storage rules**:

```bash
firebase deploy --only storage
```

### Deploy PDF Service to Cloud Run

1. **Build Docker image**:

```bash
cd services/invoice-renderer
docker build -t gcr.io/YOUR_PROJECT_ID/invoice-renderer .
```

2. **Push to Google Container Registry**:

```bash
docker push gcr.io/YOUR_PROJECT_ID/invoice-renderer
```

3. **Deploy to Cloud Run**:

```bash
gcloud run deploy invoice-renderer \
  --image gcr.io/YOUR_PROJECT_ID/invoice-renderer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your_project_id,STORAGE_BUCKET=your_bucket
```

4. **Update Frontend env** with Cloud Run URL:

```
NUXT_PUBLIC_PDF_SERVICE_URL=https://your-service-xxx.run.app
```

### Build for Production

**Frontend**:

```bash
npm run build:app
npm run preview -w app
```

**PDF Service**:

```bash
npm run build:service
npm run start -w invoice-renderer
```

## Features

- ✅ Email/password authentication
- ✅ Client management (CRUD)
- ✅ Invoice creation with line items
- ✅ Automatic calculations (subtotal, tax, total)
- ✅ PDF generation via Cloud Run
- ✅ Secure Firestore rules
- ✅ TypeScript throughout
- ✅ Tailwind CSS styling
- ✅ Zod validation

## Data Models

### User

```typescript
{
  email: string
  displayName?: string
  createdAt: Timestamp
}
```

### Client

```typescript
{
  ownedBy: string (uid)
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Invoice

```typescript
{
  ownedBy: string (uid)
  clientId: string
  number: string
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid'
  pdfUrl?: string
  createdAt: Timestamp
}
```

## Security

All Firestore collections are protected with security rules requiring authentication and ownership verification.

## License

MIT
