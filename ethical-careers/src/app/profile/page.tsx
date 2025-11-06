// app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
  limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Post = {
  id: string;
  authorId: string;
  authorEmail?: string;
  title?: string;
  content?: string;
  companyId?: string;
  companyName?: string;
  createdAt?: Timestamp;
};

type Comment = {
  id: string;
  authorId: string;
  authorEmail?: string;
  postId: string;
  text?: string;
  createdAt?: Timestamp;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // data
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const initials = useMemo(() => {
    const e = user?.email ?? "";
    const left = e.split("@")[0] ?? "u";
    const parts = left.replace(/[^a-z0-9]+/gi, " ").trim().split(" ");
    return (parts[0]?.[0] ?? "U").toUpperCase();
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setPosts([]);
        setComments([]);
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      try {
        // Fetch user's posts
        const postsQ = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const postsSnap = await getDocs(postsQ);
        const postsData: Post[] = postsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // Fetch user's comments
        const commentsQ = query(
          collection(db, "comments"),
          where("authorId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const commentsSnap = await getDocs(commentsQ);
        const commentsData: Comment[] = commentsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setPosts(postsData);
        setComments(commentsData);
      } catch (e) {
        console.error("Failed to load profile data", e);
      } finally {
        setLoadingData(false);
      }
    };
    // Only load after auth status known
    if (!loadingAuth) load();
  }, [user, loadingAuth]);

  useEffect(() => {
    // If auth resolved and no user -> go to login
    if (!loadingAuth && !user) router.push("/login");
  }, [loadingAuth, user, router]);

  const fmt = (ts?: Timestamp) => {
    if (!ts) return "";
    const d = ts.toDate();
    return d.toLocaleString();
  };

  // -------------------- UI --------------------
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Logged-in navbar with profile dropdown (Home + Logout) */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="h-8 w-8 bg-[#44AF69] rounded rotate-6" />
            <span className="text-lg font-semibold text-[#3D348B] tracking-tight">
              Ethical Careers 🌱
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <Link href="/#companies" className="hover:text-[#3D348B] transition">
                Companies
              </Link>
              <Link href="/#how" className="hover:text-[#3D348B] transition">
                How it works
              </Link>
              <Link href="/#contact" className="hover:text-[#3D348B] transition">
                Contact
              </Link>

              {/* Profile dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[#3D348B] text-white font-semibold shadow hover:opacity-90 transition"
                  title={user.email ?? "Profile"}
                >
                  {initials}
                </button>
                <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-lg opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                  <Link
                    href="/"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    Home
                  </Link>
                  <button
                    onClick={() => signOut(auth)}
                    className="w-full text-left px-4 py-2 text-[#3D348B] hover:bg-[#3D348B]/10 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Profile header */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3D348B] text-white font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#3D348B]">Your Profile</h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setTab("posts")}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === "posts"
                ? "bg-[#F7B801] text-gray-900"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === "comments"
                ? "bg-[#F7B801] text-gray-900"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Comments ({comments.length})
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {(loadingAuth || loadingData) && (
          <div className="mt-10 text-center text-gray-600">Loading your activity…</div>
        )}

        {!loadingAuth && !loadingData && tab === "posts" && (
          <>
            {posts.length === 0 ? (
              <div className="mt-10 text-center text-gray-600">
                You haven’t posted yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
                {posts.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {p.title || "Untitled Post"}
                      </h3>
                      <span className="text-xs text-gray-500">{fmt(p.createdAt)}</span>
                    </div>
                    {p.companyName && (
                      <p className="mt-1 text-sm text-[#3D348B]">
                        Company: {p.companyName}
                      </p>
                    )}
                    {p.content && (
                      <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-4">
                        {p.content}
                      </p>
                    )}
                    <div className="mt-4">
                      <Link
                        href={`/posts/${p.id}`}
                        className="text-sm text-[#3D348B] hover:opacity-80"
                      >
                        View post →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {!loadingAuth && !loadingData && tab === "comments" && (
          <>
            {comments.length === 0 ? (
              <div className="mt-10 text-center text-gray-600">
                You haven’t written any comments yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
                {comments.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Comment on{" "}
                        <Link
                          href={`/posts/${c.postId}`}
                          className="text-[#3D348B] hover:opacity-80"
                        >
                          post
                        </Link>
                      </h3>
                      <span className="text-xs text-gray-500">{fmt(c.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                      {c.text || ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

