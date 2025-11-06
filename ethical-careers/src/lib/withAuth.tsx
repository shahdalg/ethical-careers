import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export function withAuth(Component: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
      // Wait for Firebase to initialize the auth state before deciding
      // whether to redirect. This avoids false redirects while the SDK
      // is restoring the user's session.
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setChecked(true);
        if (!user) {
          router.replace('/login');
        }
      });

      return () => unsubscribe();
    }, [router]);

    // While we don't yet know the auth state, render nothing (or a loader)
    if (!checked) return null;

    return <Component {...props} />;
  };
}