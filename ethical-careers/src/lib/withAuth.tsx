import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export function withAuth(Component: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
      // Wait for Firebase to initialize the auth state before deciding
      // whether to redirect. This avoids false redirects while the SDK
      // is restoring the user's session.
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setChecked(true);
          router.replace('/login');
          return;
        }

        // 🔹 Check if user has submitted initial signup survey
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            
            // If user hasn't submitted initial survey and not already on survey page, redirect
            if (!data.submittedInitialSurvey && !pathname.includes('/signup/survey')) {
              router.replace(`/signup/survey?userId=${user.uid}`);
              return;
            }
          }
        } catch (err) {
          console.error('Error checking survey status:', err);
        }

        setChecked(true);
      });

      return () => unsubscribe();
    }, [router, pathname]);

    // While we don't yet know the auth state, render nothing (or a loader)
    if (!checked) return null;

    return <Component {...props} />;
  };
}