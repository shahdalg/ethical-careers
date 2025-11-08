'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Comment, { CommentData } from "@/components/Comment";
import PreCompanySurveyModal from "@/components/PreCompanySurveyModal";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { getUserSurveyData, needsPreSurvey } from "@/lib/surveyHelpers";
import { onAuthStateChanged } from "firebase/auth";

interface Review {
  id: string;
  pseudonym?: string; // 👈 added
  selfIdentify: string;
  peopleText: string;
  peopleRating: number;
  planetText: string;
  planetRating: number;
  transparencyText: string;
  transparencyRating: number;
  recommend: string;
  references: string;
  createdAt: any;
  likes?: number;
  likedBy?: string[];
}

export default function CompanyPage() {
  const router = useRouter();
  const { company } = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentData[]>>({});
  const [companyName, setCompanyName] = useState<string>("");

  // Survey state
  const [userId, setUserId] = useState<string | null>(null);
  const [showPreSurvey, setShowPreSurvey] = useState(false);
  const [surveyCheckComplete, setSurveyCheckComplete] = useState(false);

  const fetchComments = async (reviewId: string) => {
    try {
      const q = query(collection(db, "comments"), where("reviewId", "==", reviewId));
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentData[];

      setCommentsMap(prev => ({
        ...prev,
        [reviewId]: comments
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLikeReview = async (reviewId: string, currentLikedBy: string[] = []) => {
    if (!userId) {
      alert('Please sign in to like reviews');
      return;
    }

    try {
      const reviewRef = doc(db, "posts", reviewId);
      const isLiked = currentLikedBy.includes(userId);

      if (isLiked) {
        await updateDoc(reviewRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(reviewRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId)
        });
      }

      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId
            ? {
                ...r,
                likes: (r.likes || 0) + (isLiked ? -1 : 1),
                likedBy: isLiked
                  ? (r.likedBy || []).filter(id => id !== userId)
                  : [...(r.likedBy || []), userId]
              }
            : r
        )
      );
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && company && companyName) {
        setUserId(user.uid);
        const surveyData = await getUserSurveyData(user.uid);
        
        console.log('📊 Survey data:', surveyData);
        console.log('📋 Company surveys:', surveyData?.companySurveys);
        
        // Check if user needs pre-survey
        if (needsPreSurvey(surveyData, companyName)) {
          console.log('❌ Pre-survey needed for:', companyName);
          setShowPreSurvey(true);
        } else {
          console.log('✅ Pre-survey already completed for:', companyName);
        }
        
        setSurveyCheckComplete(true);
      } else setSurveyCheckComplete(true);
    });
    return () => unsubscribe();
  }, [company, companyName]);

  const averageRating = (field: 'peopleRating' | 'planetRating' | 'transparencyRating') => {
    const validRatings = reviews.filter(r => r[field]).map(r => r[field]);
    if (!validRatings.length) return 0;
    return validRatings.reduce((a, b) => a + b, 0) / validRatings.length;
  };

  const recommendationPercentage = () => {
    const recommendations = reviews.filter(r => r.recommend === 'Yes').length;
    return reviews.length ? Math.round((recommendations / reviews.length) * 100) : 0;
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!company) return;

      try {
        const companySlug = company.toString();
        const companyDocRef = doc(db, "companies", companySlug);
        const companyDoc = await getDoc(companyDocRef);
        
        let resolvedName = "";
        if (companyDoc.exists()) {
          resolvedName = companyDoc.data().name as string;
          setCompanyName(resolvedName);
        } else {
          // Fallback to decoded slug with hyphens replaced
          resolvedName = decodeURIComponent(companySlug).replace(/-/g, " ");
          setCompanyName(resolvedName);
        }

        // Collect candidates for legacy records (some saved slug into 'company', some saved name)
        const candidates = Array.from(new Set([
          resolvedName,
          decodeURIComponent(companySlug),
          decodeURIComponent(companySlug).replace(/-/g, " ")
        ].filter(Boolean)));

        // Query by new schema (companySlug) and legacy (company in candidates)
        const postsCol = collection(db, "posts");
        const qSlug = query(postsCol, where("companySlug", "==", companySlug));
        const qLegacy = query(postsCol, where("company", "in", candidates));

        const [snapSlug, snapLegacy] = await Promise.all([
          getDocs(qSlug),
          getDocs(qLegacy)
        ]);

        // Merge unique docs by id
        const byId = new Map<string, any>();
        snapSlug.forEach(d => byId.set(d.id, { id: d.id, ...d.data() }));
        snapLegacy.forEach(d => byId.set(d.id, { id: d.id, ...d.data() }));

        const reviewsData = Array.from(byId.values()) as Review[];

        setReviews(reviewsData);
        reviewsData.forEach(review => fetchComments(review.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [company]);


  const RatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm">({rating.toFixed(1)})</span>
    </div>
  );

  if (loading || !surveyCheckComplete) {
    return (
      <main className="bg-gray-50 text-gray-800 min-h-screen">
        <div className="p-8">Loading...</div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 text-gray-800 min-h-screen">
      {showPreSurvey && userId && companyName && (
        <PreCompanySurveyModal
          userId={userId}
          companyName={companyName}
          onComplete={() => setShowPreSurvey(false)}
        />
      )}

      {/* Post survey now handled globally on home page */}

      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{companyName || "Loading..."}</h1>
          <Link
            href={`/companies/${company}/review`}
            className="text-white px-4 py-2 rounded hover:opacity-90 shadow-sm"
            style={{ backgroundColor: "#3D348B" }}
          >
            Write a Review
          </Link>
        </div>

        {/* Overview */}
        <section className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#3D348B]">Company Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium mb-2">People Rating</h3>
              <RatingDisplay rating={averageRating('peopleRating')} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Planet Rating</h3>
              <RatingDisplay rating={averageRating('planetRating')} />
            </div>
            <div>
              <h3 className="font-medium mb-2">Transparency Rating</h3>
              <RatingDisplay rating={averageRating('transparencyRating')} />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-2">Would Recommend</h3>
            <div className="text-lg font-semibold text-[#44AF69]">
              {recommendationPercentage()}% of reviewers
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-[#3D348B]">
            Reviews ({reviews.length})
          </h2>

          <div className="space-y-6">
            {reviews.map((review) => (
              <article
                id={`review-${review.id}`}
                key={review.id}
                className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm"
              >
                <div className="flex justify-between mb-4">
                  <div>
                    {/* 👇 Added pseudonym + self-identification */}
                    <p className="font-semibold text-[#3D348B]">
                      {review.pseudonym || "AnonymousUser"}
                    </p>
                    <span className="text-sm text-gray-600">
                      {review.selfIdentify === 'currentlyWork'
                        ? 'Current Employee'
                        : review.selfIdentify === 'usedToWork'
                          ? 'Former Employee'
                          : 'External Reviewer'}
                    </span>
                    <div className="mt-1">
                      <RatingDisplay
                        rating={
                          (review.peopleRating +
                            review.planetRating +
                            review.transparencyRating) /
                          3
                        }
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(review.createdAt.toDate()).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-4">
                  {review.peopleText && (
                    <div>
                      <h3 className="font-medium text-[#3D348B] mb-1">People</h3>
                      <p className="text-sm">{review.peopleText}</p>
                    </div>
                  )}
                  {review.planetText && (
                    <div>
                      <h3 className="font-medium text-[#3D348B] mb-1">Planet</h3>
                      <p className="text-sm">{review.planetText}</p>
                    </div>
                  )}
                  {review.transparencyText && (
                    <div>
                      <h3 className="font-medium text-[#3D348B] mb-1">Transparency</h3>
                      <p className="text-sm">{review.transparencyText}</p>
                    </div>
                  )}
                  {review.references && (
                    <div className="text-sm text-gray-600 pt-2">
                      <strong>References:</strong> {review.references}
                    </div>
                  )}

                  {/* Like Button */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleLikeReview(review.id, review.likedBy)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                        review.likedBy?.includes(userId || '')
                          ? 'bg-[#3D348B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>👍</span>
                      <span>{review.likes || 0}</span>
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-[#3D348B] mb-2">Comments</h3>
                    <Comment
                      reviewId={review.id}
                      comments={commentsMap[review.id] || []}
                      onCommentAdded={() => fetchComments(review.id)}
                    />
                  </div>
                </div>
              </article>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No reviews yet. Be the first to review this company!
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
