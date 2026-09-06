# StudyVault AI – Private AI Learning Companion

StudyVault AI is a production-grade, privacy-first web application designed for students and self-learners. Powered by the Gemini API (`@google/genai`) and Cloud Firestore, it provides multi-turn academic dialogues, smart notes summarization, active-recall quiz generation, spaced-repetition study planning, and daily metacognitive journaling.

All user data (conversations, notes, quizzes, plans, and reflections) is strictly isolated using Firebase Authentication and hardened Firestore Security Rules.

---

## 1. Architecture & Threat Modeling

### The 5 Threat Zones & Countermeasures

| Threat Zone | Threat Scenario | Implemented Mitigation / Countermeasure |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious payloads in note text, large content buffer overflows, JSON injection. | Express middleware with 5MB strict limit; input length capping; strict schema parsing; client-side undefined stripping. |
| **2. Planning & Reasoning** | Prompt injection via student study material attempting to hijack Gemini system instructions. | Explicit role segregation (`contents: [{ role, parts }]`), separate `systemInstruction` parameters, defensive model prompts. |
| **3. Tool Execution / API** | Unauthorized API access, SSRF, Gemini API key leakage to browser. | 100% server-side API proxying (`/api/gemini/*`); zero client-side Gemini SDK references; API keys never exposed to browser. |
| **4. Memory & State** | Cross-user data leaks in Cloud Firestore, unauthorized reads/writes. | Strict Attribute-Based Access Control (ABAC) in `firestore.rules` checking `request.auth != null && request.auth.uid == userId`. |
| **5. Inter-System Comm** | Token interception, network eavesdropping during Gemini calls. | TLS encryption in transit; official `@google/genai` client using Google Cloud infrastructure and authenticated Secret Manager credentials. |

---

## 2. Prerequisites & Environment Setup

### Environment Variables (.env.example)

Firebase credentials are automatically read from `firebase-applet-config.json`. The only required operational secret is `GEMINI_API_KEY`:

```env
# Gemini API Key (Required for all AI capabilities: Study Chat, Smart Notes, Quizzes, Planner)
GEMINI_API_KEY=your_gemini_api_key
```

### Required Google Cloud APIs
Enable the following APIs in your Google Cloud Project:
- **Cloud Run Admin API** (`run.googleapis.com`)
- **Secret Manager API** (`secretmanager.googleapis.com`)
- **Cloud Firestore API** (`firestore.googleapis.com`)
- **Identity Toolkit API** (`identitytoolkit.googleapis.com`)

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 3. Secret Management Configuration

Never hardcode credentials or commit secrets to version control. Store `GEMINI_API_KEY` in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key value
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run compute service account permission to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Firestore Security Rules

Deploy the owner-bound security rules to ensure zero cross-user exposure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated user document path
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // User's private chat sessions
      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User's private smart notes
      match /notes/{noteId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User's practice quizzes and attempts
      match /quizzes/{quizId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User's study plans and schedule tasks
      match /studyPlans/{planId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // User's daily metacognitive reflections
      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Default-deny all unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Google Cloud Run Deployment

Build and deploy the application container to Google Cloud Run with the mandatory campaign verification label:

```bash
# Deploy to Cloud Run mounting the Secret Manager secret
gcloud run deploy studyvault-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest

# Apply the required campaign challenge verification label
gcloud run services update studyvault-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Local Development

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
