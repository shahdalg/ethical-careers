"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SignupSurvey from "@/components/SignupSurvey";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function SurveyPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 1️⃣ Try to get userId from query params (email link flow)
        const uidFromParams = searchParams.get("userId");

        if (uidFromParams) {
          // Verify this user exists and hasn't already submitted
          const userRef = doc(db, "users", uidFromParams);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            setError("User not found. Please sign up again.");
            setLoading(false);
            return;
          }

          const data = snap.data();

          // If already submitted, redirect to home
          if (data.submittedInitialSurvey) {
            router.push("/");
            return;
          }

          setUserId(uidFromParams);
          setEmail(data.email || "");
          setLoading(false);
          return;
        }

        // 2️⃣ Otherwise, check if there's a currently signed-in user
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            setError("User not found. Please sign up again.");
            setLoading(false);
            return;
          }

          const data = snap.data();

          // If already submitted, redirect to home
          if (data.submittedInitialSurvey) {
            router.push("/");
            return;
          }

          setUserId(currentUser.uid);
          setEmail(data.email || currentUser.email || "");
          setLoading(false);
          return;
        }

        // No userId in params and no signed-in user
        setError("No user session found. Please log in.");
        setLoading(false);
      } catch (err) {
        console.error("Error checking user:", err);
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    };

    checkUser();
  }, [searchParams, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-[#3D348B] hover:underline"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  if (!userId || !email) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">Invalid session.</p>
          <button
            onClick={() => router.push("/login")}
            className="text-[#3D348B] hover:underline"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <SignupSurvey userId={userId} email={email} />
    </main>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-4">
          <p className="text-gray-600">Loading...</p>
        </main>
      }
    >
      <SurveyPageContent />
    </Suspense>
  );
}
