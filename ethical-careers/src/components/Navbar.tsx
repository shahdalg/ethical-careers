import Link from "next/link";

export default function Navbar() {
  const showLogin = true;
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#44AF69] rounded rotate-6" />
          <Link href="/" className="font-semibold text-lg text-[#3D348B] tracking-tight">
            Ethical Careers 🌱
          </Link>
        </div>

        <nav className="hidden md:flex gap-8 text-sm">
          {/* Use absolute routes for cross-page links */}
          <Link href="/#companies" className="hover:text-[#3D348B] transition">Companies</Link>
          <Link href="/#rankings" className="hover:text-[#3D348B] transition">Rankings</Link>
          <Link href="/#how" className="hover:text-[#3D348B] transition">How it works</Link>
          <Link href="/#contact" className="hover:text-[#3D348B] transition">Contact</Link>

          {showLogin && (
            <Link
              href="/login"
              className="bg-[#7678ED] text-white px-4 py-2 rounded-md shadow-md hover:brightness-110 transition"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}