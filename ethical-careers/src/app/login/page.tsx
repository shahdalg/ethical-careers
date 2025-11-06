"use client"; // 👈 must be the very first line
import { auth } from "../../lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
  await signInWithEmailAndPassword(auth, email, password);
  // Redirect after successful login — respect `from` query param if present
  const from = searchParams?.get('from') ?? '/';
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

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 border p-6 rounded-lg shadow w-80"
      >
        <h2 className="text-2xl font-semibold text-center mb-2">Login</h2>

        <label className="flex flex-col">
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col">
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border p-2 rounded"
          />
        </label>

        {error && <p className="text-sm text-red-600 -mt-2">{error}</p>}

        <button
          type="submit"
          className="text-white font-semibold py-2 px-4 rounded transition-colors"
          style={{ backgroundColor: "#3D348B" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#2E256E")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#5E4BB8")
          }
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-2">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Click here
          </a>
        </p>
      </form>
    </main>
  );
}

