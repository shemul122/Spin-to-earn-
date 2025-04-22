import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from "firebase/auth";
import { apiRequest } from "./queryClient";
import firebaseApp from "./firebaseInit";

// Use the authentication from Firebase initialized in firebaseInit.ts
const provider = new GoogleAuthProvider();
const auth = getAuth(firebaseApp);

// Check if we're on a mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Handle redirect result when the page loads
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      
      if (!user.email) {
        throw new Error("No email found in Google account");
      }
      
      // Send user data to our backend
      const response = await apiRequest("POST", "/api/auth/google", {
        googleId: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        profilePic: user.photoURL,
      });
      
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Google redirect result error:", error);
    throw error;
  }
}

export async function signInWithGoogle() {
  try {
    // On mobile devices, use redirect flow instead of popup
    if (isMobile()) {
      await signInWithRedirect(auth, provider);
      // The redirect will happen here, and the result will be handled in handleRedirectResult
      return null;
    } else {
      // On desktop, use popup flow
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user.email) {
        throw new Error("No email found in Google account");
      }
      
      // Send user data to our backend
      const response = await apiRequest("POST", "/api/auth/google", {
        googleId: user.uid,
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        profilePic: user.photoURL,
      });
      
      return await response.json();
    }
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    await auth.signOut();
    await apiRequest("POST", "/api/auth/logout");
    return true;
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

export function getCurrentUser() {
  return auth.currentUser;
}
