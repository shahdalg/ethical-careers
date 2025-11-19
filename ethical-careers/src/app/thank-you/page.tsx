"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ThankYouPage() {
  const [pseudonym, setPseudonym] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPseudonym = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setPseudonym(data.pseudonym || null);
          }
        }
      } catch (error) {
        console.error("Error fetching pseudonym:", error);
      } finally {
        setLoading(false);
      }
    };

    // Wait a moment for auth to be ready
    const timer = setTimeout(fetchPseudonym, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-[#3D348B] mb-3">
          Thanks for signing up! 🎉
        </h1>
        <p className="text-gray-700 mb-6">
          Your email has been verified. Please return to your other tab
          to continue signing up.
        </p>
        
        {!loading && pseudonym && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">
              Your anonymous username is:
            </p>
            <p className="text-xl font-semibold text-[#3D348B]">
              {pseudonym}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This is how you'll appear on reviews and posts.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}


