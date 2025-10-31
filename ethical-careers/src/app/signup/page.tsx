"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // optional: can change display name if logged in
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }

      // create Firestore profile
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        displayName: displayName || "",
        bio: "",
        photoURL: cred.user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Unable to create account.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSignup} className="w-80 border p-6 rounded-lg shadow flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-center">Sign Up</h2>

        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input type="email" className="border p-2 rounded" required value={email} onChange={(e)=>setEmail(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input type="password" className="border p-2 rounded" required value={password} onChange={(e)=>setPassword(e.target.value)} />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="bg-[#3D348B] hover:bg-[#2E256E] text-white font-semibold py-2 px-4 rounded">
          Create Account
        </button>

        <p className="text-sm text-center mt-2">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Click here
          </a>
        </p>
      </form>

      
    </main>
  );
}
