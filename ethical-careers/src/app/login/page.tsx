"use client"; // 👈 must be the very first line
import { auth } from "../../lib/firebase"; // import from central file

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
          className="text-white font-semibold py-2 px-4 rounded transition-colors"
          style={{ backgroundColor: "#3D348B" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2E256E")} // darker on hover
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#5E4BB8")} // back to original
        >
          Submit
        </button>
      </form>
    </main>
  );
}
