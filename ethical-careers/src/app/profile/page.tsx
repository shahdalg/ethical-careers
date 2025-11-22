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
  getDoc,
  doc,
  orderBy,
  query,
  where,
  Timestamp,
  limit,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { formatCompanyName } from "@/lib/formatCompanyName";
import { withAuth } from "@/lib/withAuth";

type Post = {
  id: string;
  authorId: string;
  authorEmail?: string;
  title?: string;
  content?: string;
  companyId?: string;
  companyName?: string;
  companySlug?: string;
  // Review fields
  selfIdentify?: string;
  positionDetails?: string;
  peopleText?: string;
  peopleRating?: number;
  planetText?: string;
  planetRating?: number;
  transparencyText?: string;
  transparencyRating?: number;
  recommend?: string;
  references?: string;
  createdAt?: Timestamp;
};

type Comment = {
  id: string;
  authorId: string;
  authorEmail?: string;
  reviewId: string;
  text?: string;
  createdAt?: Timestamp;
};

function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pseudonym, setPseudonym] = useState<string | null>(null);

  // data
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviewMeta, setReviewMeta] = useState<Record<string, { companySlug?: string }>>({}); // map reviewId -> meta
  const [loadingData, setLoadingData] = useState(true);
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const initials = useMemo(() => {
    const e = user?.email ?? "";
    const left = e.split("@")[0] ?? "u";
    const parts = left.replace(/[^a-z0-9]+/gi, " ").trim().split(" ");
    return (parts[0]?.[0] ?? "U").toUpperCase();
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoadingAuth(false);
      
      // Fetch pseudonym from Firestore
      if (u) {
        try {
          const userDocRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("User data:", data);
            console.log("Pseudonym:", data.pseudonym);
            setPseudonym(data.pseudonym || null);
          } else {
            console.log("User document does not exist");
          }
        } catch (error) {
          console.error("Error fetching pseudonym:", error);
        }
      } else {
        setPseudonym(null);
      }
    });
    return () => unsub();
  }, []);

  // Refetch function - exposed for refreshing after actions
  useEffect(() => {
    const loadProfileData = async () => {
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

        // Build reviewId -> companySlug map for deep linking (comments may reference reviews not authored by user)
        const uniqueReviewIds = Array.from(
          new Set(commentsData.map(c => c.reviewId).filter(Boolean))
        ).filter(id => !reviewMeta[id]);
        if (uniqueReviewIds.length) {
          const metaEntries: [string, { companySlug?: string }][] = [];
          await Promise.all(
            uniqueReviewIds.map(async (rid) => {
              try {
                const docRef = doc(db, "posts", rid);
                const rDoc = await getDoc(docRef);
                if (rDoc.exists()) {
                  const data = rDoc.data() as any;
                  metaEntries.push([rid, { companySlug: data.companySlug }]);
                }
              } catch (e) {
                // ignore failures
              }
            })
          );
          if (metaEntries.length) {
            setReviewMeta(prev => ({ ...prev, ...Object.fromEntries(metaEntries) }));
          }
        }
      } catch (e) {
        console.error("Failed to load profile data", e);
      } finally {
        setLoadingData(false);
      }
    };

    // Only load after auth status known
    if (!loadingAuth) loadProfileData();
  }, [user, loadingAuth]);

  // Refresh data when page becomes visible (after navigating back)
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      setLoadingData(true);
      try {
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && !loadingAuth) {
        loadProfileData();
      }
    };

    const handleFocus = () => {
      if (user && !loadingAuth) {
        loadProfileData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(postId);
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete review. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(commentId);
    try {
      await deleteDoc(doc(db, "comments", commentId));
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // -------------------- UI --------------------
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">

      {/* Profile header */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3D348B] text-white font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#3D348B]">
              {loadingAuth ? "Loading..." : (pseudonym || "Your Profile")}
            </h1>
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
            Reviews ({posts.length})
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
                You haven't posted any reviews yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
                {posts.map((p) => {
                  // Determine if this is a review (has review fields) or a regular post
                  const isReview = p.peopleText || p.planetText || p.transparencyText;
                  const displayCompanyName = formatCompanyName(p.companyName);
                  const reviewPreview = [
                    p.peopleText,
                    p.planetText,
                    p.transparencyText
                  ].filter(Boolean).join(' • ').slice(0, 200);
                  
                  return (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isReview ? `Review: ${displayCompanyName}` : (p.title || "Untitled Post")}
                        </h3>
                        <span className="text-xs text-gray-500">{fmt(p.createdAt)}</span>
                      </div>
                      {p.companyName && (
                        <p className="mt-1 text-sm text-[#3D348B]">
                          Company: {displayCompanyName}
                        </p>
                      )}
                      {isReview && p.selfIdentify && (
                        <p className="mt-1 text-xs text-gray-600 italic">
                          {p.selfIdentify === 'currentlyWork' ? 'I currently work here' :
                           p.selfIdentify === 'usedToWork' ? 'I used to work here' :
                           p.selfIdentify === 'neverWorked' ? 'I have never worked here' :
                           p.selfIdentify}
                        </p>
                      )}
                      {isReview && p.recommend && (
                        <p className="mt-2 text-sm font-medium" style={{ color: p.recommend === 'Yes' ? '#44AF69' : '#F77F00' }}>
                          Recommendation: {p.recommend}
                        </p>
                      )}
                      {isReview ? (
                        <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-4">
                          {reviewPreview}...
                        </p>
                      ) : (
                        p.content && (
                          <p className="mt-3 text-sm text-gray-700 leading-relaxed line-clamp-4">
                            {p.content}
                          </p>
                        )
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          {isReview && p.companySlug ? (
                            <Link
                              href={`/companies/${p.companySlug}#review-${p.id}`}
                              className="text-sm text-[#3D348B] hover:opacity-80"
                            >
                              View review →
                            </Link>
                          ) : (
                            <Link
                              href={`/posts/${p.id}`}
                              className="text-sm text-[#3D348B] hover:opacity-80"
                            >
                              View post →
                            </Link>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          disabled={deletingId === p.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                        >
                          {deletingId === p.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!loadingAuth && !loadingData && tab === "comments" && (
          <>
            {comments.length === 0 ? (
              <div className="mt-10 text-center text-gray-600">
                You haven't written any comments yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
                {comments.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#F7B801] flex items-center justify-center text-white text-xs font-semibold">
                          💬
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            Comment on Review
                          </h3>
                          <span className="text-xs text-gray-500">{fmt(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pl-10">
                      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 border-[#44AF69]">
                        "{c.text || ""}"
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          href={reviewMeta[c.reviewId]?.companySlug
                            ? `/companies/${reviewMeta[c.reviewId]!.companySlug}#review-${c.reviewId}`
                            : `#`}
                          className="text-sm text-[#3D348B] hover:opacity-80 font-medium inline-flex items-center gap-1 disabled:opacity-40"
                        >
                          View review →
                        </Link>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={deletingId === c.id}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                        >
                          {deletingId === c.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
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

export default withAuth(ProfilePage);

