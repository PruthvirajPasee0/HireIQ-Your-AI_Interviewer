#!/usr/bin/env node
/**
 * Creates (or updates) a demo recruiter account so you can sign in
 * immediately without going through the sign-up flow.
 *
 * Usage:
 *   node scripts/seed-demo-recruiter.mjs
 *
 * Reads Firebase Admin creds from the same .env.local the Next.js app uses.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnv(path) {
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.+?)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

try {
  loadEnv(envPath);
} catch (e) {
  console.error(`Could not read ${envPath}:`, e.message);
  process.exit(1);
}

const REQUIRED = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
for (const k of REQUIRED) {
  if (!process.env[k]) {
    console.error(`Missing env: ${k}`);
    process.exit(1);
  }
}

const DEMO = {
  email: "demo-recruiter@hireiq.ai",
  password: "Recruiter#2026",
  name: "Demo Recruiter",
};

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const auth = admin.auth();
const db = admin.firestore();

async function ensureUser() {
  let user;
  try {
    user = await auth.getUserByEmail(DEMO.email);
    await auth.updateUser(user.uid, {
      password: DEMO.password,
      displayName: DEMO.name,
      emailVerified: true,
    });
    console.log(`Updated existing demo recruiter (uid=${user.uid})`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      user = await auth.createUser({
        email: DEMO.email,
        password: DEMO.password,
        displayName: DEMO.name,
        emailVerified: true,
      });
      console.log(`Created demo recruiter (uid=${user.uid})`);
    } else {
      throw err;
    }
  }
  await db.collection("users").doc(user.uid).set(
    {
      name: DEMO.name,
      email: DEMO.email,
      role: "recruiter",
    },
    { merge: true }
  );
  return user;
}

ensureUser()
  .then(() => {
    console.log("\n=== DEMO RECRUITER READY ===");
    console.log(`URL:      http://localhost:3000/sign-in`);
    console.log(`Email:    ${DEMO.email}`);
    console.log(`Password: ${DEMO.password}`);
    console.log("Role:     recruiter");
    console.log("============================\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
