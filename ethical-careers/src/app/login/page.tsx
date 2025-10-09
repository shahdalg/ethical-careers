"use client"; // 👈 must be the very first line

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Welcome, ${email}!`);
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

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded"
        >
          Log In
        </button>
      </form>
    </main>
  );
}
