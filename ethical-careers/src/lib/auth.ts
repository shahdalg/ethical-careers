import { auth } from './firebase';
import { onAuthStateChanged, getIdToken, sendPasswordResetEmail } from 'firebase/auth';

// Function to send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return { 
      success: false, 
      error: error.code === 'auth/user-not-found' 
        ? 'No account found with this email address.' 
        : 'Failed to send reset email. Please try again.'
    };
  }
};

// Function to manage auth state
export const initAuth = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          const token = await user.getIdToken();
          // Store the token in sessionStorage for client-side access
          sessionStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      } else {
        // User is signed out
        sessionStorage.removeItem('authToken');
      }
      resolve(user);
    });

    return unsubscribe;
  });
};

// Function to get current auth state
export const getAuthState = () => {
  return !!auth.currentUser;
};

// Function to check if route is protected
export const isProtectedRoute = (path: string) => {
  const publicRoutes = ['/login', '/signup'];
  return !publicRoutes.includes(path);
};