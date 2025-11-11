"use client";

import Link from "next/link";

export default function ThankYouPage() {
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
      </div>
    </main>
  );
}


