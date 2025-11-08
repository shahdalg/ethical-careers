"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SignupSurvey from "@/components/SignupSurvey";

function SurveyContent() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const email = params.get("email") || "";

  if (!uid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow text-center max-w-md">
          <h1 className="text-lg font-semibold text-[#3D348B] mb-2">
            Link incomplete
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            We couldn&apos;t identify your account from this link.
          </p>
          <a
            href="/login"
            className="inline-block bg-[#3D348B] text-white px-4 py-2 rounded text-sm hover:bg-[#2E256E]"
          >
            Go to Login
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <SignupSurvey userId={uid} email={email} />
    </main>
  );
}

export default function SignupSurveyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-[#3D348B]">Loading...</div>
      </main>
    }>
      <SurveyContent />
    </Suspense>
  );
}
