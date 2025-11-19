"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCompanyName } from "@/lib/formatCompanyName";

type Post = {
  id: string;
  authorId: string;
  companyName?: string;
  companySlug?: string;
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
  reviewId: string;
  text?: string;
  createdAt?: Timestamp;
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params?.userId as string;

  const [pseudonym, setPseudonym] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Fetch user's pseudonym
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setPseudonym(userDoc.data().pseudonym || "Anonymous");
        } else {
          setPseudonym("Anonymous");
        }

        // Fetch user's posts
        const postsQ = query(
          collection(db, "posts"),
          where("authorId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const postsSnap = await getDocs(postsQ);
        const postsData: Post[] = postsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setPosts(postsData);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <main className="bg-gray-50 text-gray-800 min-h-screen">
        <div className="p-8">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 text-gray-800 min-h-screen">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: "#3D348B" }}
          >
            {(pseudonym?.[0] || "A").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#3D348B]">{pseudonym || "Anonymous"}</h1>
            <p className="text-sm text-gray-600">{posts.length} reviews</p>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
            {posts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No reviews yet.
              </div>
            )}
            {posts.map((post) => {
              const slug = post.companySlug || "";
              const link = slug ? `/companies/${slug}#review-${post.id}` : "#";
              return (
                <article
                  key={post.id}
                  className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Link
                        href={link}
                        className="font-semibold text-[#3D348B] hover:underline"
                      >
                        {formatCompanyName(post.companyName)}
                      </Link>
                      {post.selfIdentify && (
                        <p className="text-xs text-gray-600 italic mt-1">
                          {post.selfIdentify === 'currentlyWork' ? 'I currently work here' :
                           post.selfIdentify === 'usedToWork' ? 'I used to work here' :
                           post.selfIdentify === 'neverWorked' ? 'I have never worked here' :
                           post.selfIdentify}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {post.createdAt
                        ? new Date(post.createdAt.toDate()).toLocaleDateString()
                        : "Unknown date"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    {post.peopleText && (
                      <p>
                        <span className="font-medium">People:</span> {post.peopleText.slice(0, 100)}
                        {post.peopleText.length > 100 && "..."}
                      </p>
                    )}
                    {post.planetText && (
                      <p>
                        <span className="font-medium">Planet:</span> {post.planetText.slice(0, 100)}
                        {post.planetText.length > 100 && "..."}
                      </p>
                    )}
                    {post.transparencyText && (
                      <p>
                        <span className="font-medium">Transparency:</span>{" "}
                        {post.transparencyText.slice(0, 100)}
                        {post.transparencyText.length > 100 && "..."}
                      </p>
                    )}
                  </div>
                  <Link
                    href={link}
                    className="text-xs text-[#3D348B] hover:underline mt-3 inline-block"
                  >
                    View full review →
                  </Link>
                </article>
              );
            })}
          </div>
      </div>
    </main>
  );
}
