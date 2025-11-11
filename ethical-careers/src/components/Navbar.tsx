"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/lib/useUser";

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Redirect to landing page
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
          <Link href="/" className="font-semibold text-lg text-[#3D348B] tracking-tight">
            Ethical Careers 🌱
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 text-sm items-center">
          <Link href="/#companies" className="text-gray-700 hover:text-[#3D348B] transition font-medium">Companies</Link>
          <Link href="/#rankings" className="text-gray-700 hover:text-[#3D348B] transition font-medium">Rankings</Link>
          <Link href="/#how" className="text-gray-700 hover:text-[#3D348B] transition font-medium">How it works</Link>
          <Link href="/#contact" className="text-gray-700 hover:text-[#3D348B] transition font-medium">Contact</Link>

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
            <div className="relative" ref={dropdownRef}>
              <button
                title={user.email ?? "Profile"}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-[#3D348B] text-white font-semibold shadow hover:opacity-90 transition"
              >
                {initials}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <Link
                    href="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-[#3D348B] hover:bg-[#3D348B]/10 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 w-8 h-8 justify-center items-center"
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-0.5 bg-[#3D348B] transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-[#3D348B] transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-6 h-0.5 bg-[#3D348B] transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col px-8 py-4 gap-3">
            <Link 
              href="/#companies" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-[#3D348B] transition font-medium py-2"
            >
              Companies
            </Link>
            <Link 
              href="/#rankings" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-[#3D348B] transition font-medium py-2"
            >
              Rankings
            </Link>
            <Link 
              href="/#how" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-[#3D348B] transition font-medium py-2"
            >
              How it works
            </Link>
            <Link 
              href="/#contact" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-[#3D348B] transition font-medium py-2"
            >
              Contact
            </Link>

            {!loading && !user && (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-[#7678ED] text-white px-4 py-2 rounded-md shadow-md hover:brightness-110 transition text-center mt-2"
              >
                Login
              </Link>
            )}

            {!loading && user && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-[#3D348B] transition font-medium py-2 border-t border-gray-200 mt-2 pt-4"
                >
                  Profile ({user.email})
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-[#3D348B] hover:bg-[#3D348B]/10 font-medium py-2 rounded"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}