"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/lib/useUser";

export default function Navbar() {
  const { user, loading } = useUser();

  const initials = (() => {
    const e = user?.email ?? "";
    const left = e.split("@")[0] ?? "u";
    const parts = left.replace(/[^a-z0-9]+/gi, " ").trim().split(" ");
    return (parts[0]?.[0] ?? "U").toUpperCase();
  })();

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#44AF69] rounded rotate-6" />
          <Link href="/" className="font-semibold text-lg text-[#3D348B] tracking-tight">
            Ethical Careers 🌱
          </Link>
        </div>

        <nav className="hidden md:flex gap-8 text-sm items-center">
          <Link href="/#companies" className="hover:text-[#3D348B] transition">Companies</Link>
          <Link href="/#rankings" className="hover:text-[#3D348B] transition">Rankings</Link>
          <Link href="/#how" className="hover:text-[#3D348B] transition">How it works</Link>
          <Link href="/#contact" className="hover:text-[#3D348B] transition">Contact</Link>

          {/* Auth controls */}
          {!loading && !user && (
            <Link
              href="/login"
              className="bg-[#7678ED] text-white px-4 py-2 rounded-md shadow-md hover:brightness-110 transition"
            >
              Login
            </Link>
          )}

          {!loading && user && (
            <div className="relative group">
              <button
                title={user.email ?? "Profile"}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[#3D348B] text-white font-semibold shadow hover:opacity-90 transition"
              >
                {initials}
              </button>

              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  Profile
                </Link>
                <button
                  onClick={() => signOut(auth)}
                  className="w-full text-left px-4 py-2 text-[#3D348B] hover:bg-[#3D348B]/10 rounded-b-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}