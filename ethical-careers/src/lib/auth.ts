import { auth } from './firebase';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';

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