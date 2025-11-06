"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ProfilePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      setEmail(user.email || "");
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data() as any;
        setDisplayName(d.displayName || "");
        setBio(d.bio || "");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const save = async () => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), {
      displayName,
      bio,
      updatedAt: serverTimestamp(),
    });
    alert("Profile saved!");
  };

  if (loading) return null;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-[28rem] border p-6 rounded-lg shadow flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Your Profile</h2>
        <p className="text-sm text-gray-600">Email: {email}</p>

        <label className="flex flex-col gap-1">
          <span>Display Name</span>
          <input className="border p-2 rounded" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1">
          <span>Bio</span>
          <textarea className="border p-2 rounded" rows={4} value={bio} onChange={(e)=>setBio(e.target.value)} />
        </label>

        <button onClick={save} className="bg-[#3D348B] hover:bg-[#2E256E] text-white font-semibold py-2 px-4 rounded">
          Save
        </button>
      </div>
    </main>
  );
}
