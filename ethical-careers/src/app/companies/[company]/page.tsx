'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Comment, { CommentData } from "@/components/Comment";
import PreCompanySurveyModal from "@/components/PreCompanySurveyModal";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from "firebase/firestore";
import { getUserSurveyData, needsPreSurvey } from "@/lib/surveyHelpers";
import { onAuthStateChanged } from "firebase/auth";
import { formatCompanyName } from "@/lib/formatCompanyName";
import { withAuth } from "@/lib/withAuth";

interface Review {
  id: string;
  pseudonym?: string;
  authorId?: string; // Add this for profile linking
  selfIdentify: string;
  positionDetails?: string;
  overallText?: string;
  peopleText: string;
  peopleRating: number;
  planetText: string;
  planetRating: number;
  transparencyText: string;
  transparencyRating: number;
  recommend: string;
  references: string;
  createdAt: any;
  updatedAt?: any;
  likes?: number;
  likedBy?: string[];
}

function CompanyPage() {
  const router = useRouter();
  const { company } = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentData[]>>({});
  const [companyName, setCompanyName] = useState<string>("");
  const [showGuidance, setShowGuidance] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }
    
    if (!userId) {
      alert('Please sign in to delete reviews');
      return;
    }

    setDeletingId(reviewId);
    try {
      await deleteDoc(doc(db, "posts", reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    } finally {
      setDeletingId(null);
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
          <h1 className="text-2xl font-bold">{formatCompanyName(companyName) || "Loading..."}</h1>
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
                  <img
          src="/images/Squiggle2.png"
          alt="Blob graphic"
          aria-hidden="true"
          className="pointer-events-none select-none absolute top-50 left-2 sm:left-1 w-[15vw] min-w-[80px] max-w-[224px] opacity-70"
        />

          <img
          src="/images/Squiggle2.png"
          alt="Blob graphic"
          aria-hidden="true"
          className="pointer-events-none select-none absolute top-50 right-2 sm:right-1 w-[15vw] min-w-[80px] max-w-[224px] opacity-70"
        />




          {/* Overall Rating - Large and Prominent */}
          <div className="mb-8 pb-6 border-b border-gray-200 text-center">
            <h3 className="text-2xl font-bold mb-3 text-[#3D348B]">Overall Rating</h3>
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const avgRating = (averageRating('peopleRating') + averageRating('planetRating') + averageRating('transparencyRating')) / 3;
                return (
                  <span
                    key={star}
                    className={`text-4xl ${star <= avgRating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                );
              })}
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {((averageRating('peopleRating') + averageRating('planetRating') + averageRating('transparencyRating')) / 3).toFixed(1)}
            </span>
            <span className="text-lg text-gray-600"> / 5.0</span>
          </div>

          {/* Category Ratings */}
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
          <img
          src="/images/Squiggle4.png"
          alt="Blob graphic"
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-50 right-1 w-[20vw] min-w-[160px] max-w-[224px] opacity-70 rotate-45"
        />

          {/* Guidance panel: visible regardless of review count */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowGuidance(v => !v)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-between shadow-sm"
              aria-expanded={showGuidance}
            >
              <span className="font-semibold text-[#3D348B]">What to include in a review</span>
              <span className="text-sm text-gray-600">{showGuidance ? 'Hide' : 'Show'}</span>
            </button>
            {showGuidance && (
              <div className="mt-3 border border-gray-200 rounded-xl bg-white p-5 text-sm text-gray-800 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-[#3D348B] mb-2">People</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      <li>Does the company offer fair compensation and benefits? Are working conditions safe and supportive?</li>
                      <li>What is their standing on DEI initiatives?</li>
                      <li>How ethical/fair is the company with their employees (maternity/paternity leave, gender pay gap)?</li>
                      <li>How does the company hold leadership accountable for ethical (mis)conduct?</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#3D348B] mb-2">Planet</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      <li>What metrics does the company use to track its environmental impact (e.g., carbon footprint, waste), and how are these tracked and reported?</li>
                      <li>Has the company set clear, measurable, and time-bound targets for reducing its environmental impact?</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#3D348B] mb-2">Transparency</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      <li>What partners or organizations do they work with or get funded by?</li>
                      <li>Is the company involved in any recent ethical scandals or breakthroughs?</li>
                      <li>Are the company’s core values accessible to employees and consistently communicated?</li>
                      <li>Is the company transparent about its operations, supply chain, and ethical practices?</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-5 p-4 rounded-lg border border-dashed border-gray-300 bg-white">
                  <div className="flex justify-between mb-2">
                    <p className="font-medium text-[#3D348B]">Example snippet</p>
                    <span className="text-xs text-gray-500">Guidance only</span>
                  </div>
                  <p className="text-sm text-gray-700"><span className="font-medium">Overall:</span> The company fosters a supportive environment and is making steady progress on sustainability. Transparency around supplier practices could improve.</p>
                  <p className="text-sm text-gray-700 mt-2"><span className="font-medium">People:</span> Team leads prioritize psychological safety and fair workloads. Growth conversations happen quarterly and feedback is actionable.</p>
                  <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Planet:</span> There’s an annual emissions report and SBTi-aligned goals, with ongoing work to reduce Scope 3 emissions.</p>
                  <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Transparency:</span> External reporting is improving, but supplier audits and remediation plans should be clearer.</p>
                  <p className="text-xs text-gray-500 mt-2">This example is not counted in ratings or totals.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {reviews.map((review) => (
              <article
                id={`review-${review.id}`}
                key={review.id}
                className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm"
              >
                <div className="flex justify-between mb-4">
                  <div>
                    {/* Pseudonym with link to profile */}
                    {review.authorId ? (
                      <Link 
                        href={review.authorId === userId ? '/profile' : `/profile/${review.authorId}`}
                        className="font-semibold text-[#3D348B] hover:underline"
                      >
                        {review.pseudonym || "AnonymousUser"}
                      </Link>
                    ) : (
                      <p className="font-semibold text-[#3D348B]">
                        {review.pseudonym || "AnonymousUser"}
                      </p>
                    )}
                    <span className="text-sm text-gray-600 ml-2">
                      {review.selfIdentify === 'currentlyWork'
                        ? 'Current Employee'
                        : review.selfIdentify === 'usedToWork'
                          ? 'Former Employee'
                          : 'External Reviewer'}
                    </span>
                    {review.positionDetails && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {review.positionDetails}
                      </p>
                    )}
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
                    {review.updatedAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Edited: {new Date(review.updatedAt.toDate()).toLocaleDateString()})
                      </span>
                    )}
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
                    {userId === review.authorId && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingId === review.id}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50"
                      >
                        {deletingId === review.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
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
              <div className="py-8 text-center text-gray-500">No reviews yet. Be the first to review this company!</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default withAuth(CompanyPage);
