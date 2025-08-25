"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Session duration (1 week)
const SESSION_DURATION = 60 * 60 * 24 * 7;

// Set session cookie
export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  // Create session cookie
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION * 1000, // milliseconds
  });

  // Set cookie in the browser
  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    // check if user exists in db
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in.",
      };

    // save user to db
    await db.collection("users").doc(uid).set({
      name,
      email,
      // profileURL,
      // resumeURL,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle Firebase specific errors
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord)
      return {
        success: false,
        message: "User does not exist. Create an account.",
      };

    // Decode token to detect provider (google.com, password, etc.)
    let signInProvider: string | undefined;
    try {
      const decoded = await auth.verifyIdToken(idToken);
      // e.g., decoded.firebase.sign_in_provider === 'google.com'
      signInProvider = (decoded as any)?.firebase?.sign_in_provider;
    } catch {}

    // Ensure a Firestore user document exists and sync Google avatar if applicable
    const userRef = db.collection("users").doc(userRecord.uid);
    const existingDoc = await userRef.get();

    if (!existingDoc.exists) {
      await userRef.set({
        name: userRecord.displayName || "",
        email: userRecord.email || email,
        profileURL: userRecord.photoURL || "",
      });
    } else if (signInProvider === "google.com") {
      // Keep the profile photo in sync with Google on Google sign-in
      const payload: Record<string, any> = {};
      if (userRecord.displayName) payload.name = userRecord.displayName;
      if (userRecord.email) payload.email = userRecord.email;
      if (userRecord.photoURL) payload.profileURL = userRecord.photoURL;
      if (Object.keys(payload).length) {
        await userRef.set(payload, { merge: true });
      }
    }

    await setSessionCookie(idToken);

    return { success: true };
  } catch (error: any) {
    console.log("");

    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

// Sign out user by clearing the session cookie
export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}

// Get current user from session cookie
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // get user info from db
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();
    if (!userRecord.exists) return null;

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error) {
    console.log(error);

    // Invalid or expired session
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

// Update current user's profile (name, profileURL)
export async function updateUserProfile(data: { name?: string; profileURL?: string }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie)
    return { success: false, message: "Not authenticated" } as const;

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const payload: Record<string, any> = {};
    if (typeof data.name === "string") payload.name = data.name;
    if (typeof data.profileURL === "string") payload.profileURL = data.profileURL;
    if (Object.keys(payload).length === 0)
      return { success: false, message: "No changes provided" } as const;

    await db.collection("users").doc(decoded.uid).set(payload, { merge: true });
    return { success: true } as const;
  } catch (error) {
    console.error("updateUserProfile error", error);
    return { success: false, message: "Failed to update profile" } as const;
  }
}
