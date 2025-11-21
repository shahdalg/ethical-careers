"use client"; // 👈 must be the very first line
import { auth } from "../../lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { resetPassword } from "../../lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect after successful login — respect `from` query param if present
      const from = searchParams?.get("from") ?? "/";
      router.push(from);
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-email"
      )
        setError("Incorrect email or password.");
      else setError("Could not sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetLoading(true);

    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        setResetSuccess(true);
        setResetEmail("");
      } else {
        setResetError(result.error || "Failed to send reset email.");
      }
    } catch (err) {
      setResetError("An unexpected error occurred.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800 w-80"
      >
        <h2 className="text-2xl font-semibold text-center mb-2 text-gray-900 dark:text-gray-100">Login</h2>

        <label className="flex flex-col text-gray-800 dark:text-gray-200 font-medium">
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded mt-1 focus:ring-2 focus:ring-[#3D348B] dark:focus:ring-[#7678ED] outline-none"
          />
        </label>

        <label className="flex flex-col text-gray-800 dark:text-gray-200 font-medium">
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded mt-1 focus:ring-2 focus:ring-[#3D348B] dark:focus:ring-[#7678ED] outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400 -mt-2">{error}</p>}

        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-[#3D348B] dark:text-[#7678ED] hover:underline text-left -mt-2 font-medium"
        >
          Forgot password?
        </button>

        <button
          type="submit"
          className="text-white font-semibold py-2 px-4 rounded transition-colors bg-[#3D348B] hover:bg-[#2E256E] dark:bg-[#7678ED] dark:hover:bg-[#5E4BB8]"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-2 text-gray-800 dark:text-gray-200">
          Don't have an account?{" "}
          <a href="/signup" className="text-[#3D348B] dark:text-[#7678ED] hover:underline font-semibold">
            Click here
          </a>
        </p>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetError(null);
                  setResetSuccess(false);
                  setResetEmail("");
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {resetSuccess ? (
              <div className="text-center py-4">
                <div className="text-green-600 dark:text-green-400 text-5xl mb-3">✓</div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Password reset email sent! Check your inbox for instructions (including your spam folder). 
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess(false);
                    setResetEmail("");
                  }}
                  className="text-white font-semibold py-2 px-6 rounded bg-[#3D348B] hover:bg-[#2E256E] dark:bg-[#7678ED] dark:hover:bg-[#5E4BB8]"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <label className="flex flex-col text-gray-800 dark:text-gray-200 font-medium">
                  Email:
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded mt-1 focus:ring-2 focus:ring-[#3D348B] dark:focus:ring-[#7678ED] outline-none"
                    placeholder="your@email.com"
                  />
                </label>

                {resetError && (
                  <p className="text-sm text-red-600 dark:text-red-400 -mt-2">{resetError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetError(null);
                      setResetEmail("");
                    }}
                    className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 text-white font-semibold py-2 px-4 rounded bg-[#3D348B] hover:bg-[#2E256E] dark:bg-[#7678ED] dark:hover:bg-[#5E4BB8] disabled:opacity-60"
                  >
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login page...</div>}>
      <LoginContent />
    </Suspense>
  );
}
