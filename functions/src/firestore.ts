import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// In Cloud Functions, the default app uses the function's service account
// automatically — no service-account JSON or env vars required.
if (!getApps().length) initializeApp();

export const db = getFirestore();
