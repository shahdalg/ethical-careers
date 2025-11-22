"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase"; // adjust path if needed
import { collection, addDoc, Timestamp, doc, getDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { formatCompanyName } from "@/lib/formatCompanyName";
import { withAuth } from "@/lib/withAuth";

function CompanyReviewForm() {
  const router = useRouter();
  const { company } = useParams(); // dynamic URL param (e.g. /companies/google/review)
  const [companyName, setCompanyName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPseudonym, setUserPseudonym] = useState<string | null>(null);
  const [showExample, setShowExample] = useState<boolean>(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Self Identify 4
  const [selfIdentify, setSelfIdentify] = useState("");
  const [positionDetails, setPositionDetails] = useState("");

  // People
  const [peopleText, setPeopleText] = useState("");
  const [peopleRating, setPeopleRating] = useState("");
  
  // Planet
  const [planetText, setPlanetText] = useState("");
  const [planetRating, setPlanetRating] = useState("");

  // Transparency
  const [transparencyText, setTransparencyText] = useState("");
  const [transparencyRating, setTransparencyRating] = useState("");

  // Overall
  const [overallText, setOverallText] = useState("");

  // Overall recommendation
  const [recommend, setRecommend] = useState("");

  // References
  const [RefText, setRefText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!company) return;

      try {
        const companySlug = company.toString();
        const companyDocRef = doc(db, "companies", companySlug);
        const companyDoc = await getDoc(companyDocRef);

        if (companyDoc.exists()) {
          setCompanyName(formatCompanyName(companyDoc.data().name));
        } else {
          // Fallback to decoded slug with hyphens replaced
          const fallbackName = decodeURIComponent(companySlug).replace(/-/g, " ");
          setCompanyName(formatCompanyName(fallbackName));
        }
      } catch (err) {
        console.error("Error fetching company name:", err);
        const fallbackName = decodeURIComponent(company.toString()).replace(/-/g, " ");
        setCompanyName(formatCompanyName(fallbackName));
      }
    };

    fetchCompanyName();
  }, [company]);

  // Get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        
        // Fetch pseudonym from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserPseudonym(userDoc.data().pseudonym || null);
          }
        } catch (error) {
          console.error("Error fetching pseudonym:", error);
        }
      } else {
        // Redirect to login if not authenticated
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Check for existing review and load it if found
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!userId || !companyName) return;

      try {
        const reviewsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", userId),
          where("companyName", "==", companyName)
        );
        const snapshot = await getDocs(reviewsQuery);

        if (!snapshot.empty) {
          const existingReview = snapshot.docs[0];
          const data = existingReview.data();
          
          // Load existing review data
          setExistingReviewId(existingReview.id);
          setIsEditMode(true);
          setSelfIdentify(data.selfIdentify || "");
          setPositionDetails(data.positionDetails || "");
          setPeopleText(data.peopleText || "");
          setPeopleRating(data.peopleRating?.toString() || "");
          setPlanetText(data.planetText || "");
          setPlanetRating(data.planetRating?.toString() || "");
          setTransparencyText(data.transparencyText || "");
          setTransparencyRating(data.transparencyRating?.toString() || "");
          setOverallText(data.overallText || "");
          setRecommend(data.recommend || "");
          setRefText(data.references || "");
        }
      } catch (error) {
        console.error("Error checking for existing review:", error);
      }
    };

    checkExistingReview();
  }, [userId, companyName]);

  // Helper function to check text with Perspective API
  const checkTextModeration = async (text: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/perspective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      
      if (!result.allowed) {
        setError(result.message || 'Your content contains inappropriate language.');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Moderation check failed:', err);
      // Allow submission if moderation check fails (fallback behavior)
      return true;
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return alert("Invalid company URL");
    if (!userId) return alert("You must be logged in to submit a review");

    setError(null);

    try {
      // Combine all text fields to check for inappropriate content
      const textsToCheck = [
        overallText,
        peopleText,
        planetText,
        transparencyText,
        RefText,
      ].filter(text => text.trim().length > 0);

      // Check each text field with Perspective API
      for (const text of textsToCheck) {
        const isAllowed = await checkTextModeration(text);
        if (!isAllowed) {
          // Error message already set by checkTextModeration
          return;
        }
      }

      // If editing existing review, update it
      if (isEditMode && existingReviewId) {
        await updateDoc(doc(db, "posts", existingReviewId), {
          overallText,
          selfIdentify,
          positionDetails,
          peopleText,
          peopleRating: Number(peopleRating) || null,
          planetText,
          planetRating: Number(planetRating) || null,
          transparencyText,
          transparencyRating: Number(transparencyRating) || null,
          recommend,
          references: RefText,
          updatedAt: Timestamp.now(),
        });

        setIsUpdate(true);
        setShowSuccessModal(true);
      } else {
        // If all checks pass, submit new review
        await addDoc(collection(db, "posts"), {
          // User information
          authorId: userId,
          authorEmail: userEmail,
          pseudonym: userPseudonym,
          // Store both slug and name for robust querying
          companyName: companyName,
          companySlug: company?.toString() || "",
          overallText,
          selfIdentify,
          positionDetails,
          peopleText,
          peopleRating: Number(peopleRating) || null,
          planetText,
          planetRating: Number(planetRating) || null,
          transparencyText,
          transparencyRating: Number(transparencyRating) || null,
          recommend,
          references: RefText,
          createdAt: Timestamp.now(),
        });

        setIsUpdate(false);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting review");
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push(`/companies/${company}`);
  };

  // Rating Radios
  const RatingRadios = ({
    value,
    setValue,
    name,
    labels,
  }: {
    value: string;
    setValue: (v: string) => void;
    name: string;
    labels?: string[];
  }) => {
    // If labels provided, render each radio with its description to the right
    if (labels && labels.length === 5) {
      return (
        <div className="mt-2 space-y-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <label key={num} className="flex items-start gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-[48px]">
                <input
                  type="radio"
                  name={name}
                  value={num.toString()}
                  checked={value === num.toString()}
                  onChange={(e) => setValue(e.target.value)}
                />
                <span className="font-medium">{num}</span>
              </div>
              <span className="text-xs text-gray-600">{labels[num - 1]}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="flex gap-3 mt-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name={name}
              value={num.toString()}
              checked={value === num.toString()}
              onChange={(e) => setValue(e.target.value)}
            />
            {num}
          </label>
        ))}
      </div>
    );
  };

  // Yes/No Radios
  const YesNoRadios = ({
    value,
    setValue,
    name,
  }: {
    value: string;
    setValue: (v: string) => void;
    name: string;
  }) => (
    <div className="flex gap-6 mt-1">
      {["Yes", "No"].map((option) => (
        <label key={option} className="flex items-center gap-1 text-sm">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={(e) => setValue(e.target.value)}
          />
          {option}
        </label>
      ))}
    </div>
  );

  return (
    <main className="bg-gray-50 text-gray-800 min-h-screen">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* Confetti */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 opacity-0"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  backgroundColor: ['#3D348B', '#7678ED', '#44AF69', '#F77F00', '#FCA311'][Math.floor(Math.random() * 5)],
                  animation: `confetti-fall ${2 + Math.random() * 3}s linear forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in relative z-10">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-2xl font-bold text-[#3D348B] mb-3">
              {isUpdate ? "Review Updated!" : "Thank You for Your Contribution!"}
            </h2>
            <p className="text-gray-700 mb-2">
              {isUpdate 
                ? "Your updated insights help keep our community informed with the latest information."
                : "Your review is now live and helping others make more informed, ethical career decisions."}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              By sharing your experience, you're building a more transparent workplace community. 
              Every review matters in creating a better future of work. 💚
            </p>
            <button
              onClick={handleCloseSuccessModal}
              className="bg-[#3D348B] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2E256E] transition-colors w-full"
            >
              View All Reviews
            </button>
          </div>
          
          <style jsx>{`
            @keyframes confetti-fall {
              to {
                transform: translateY(100vh) rotate(720deg);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      <div className="p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#3D348B" }}>
          {isEditMode ? "Edit Your Review for" : "Submit a Review for"} {companyName || "Loading..."}
        </h1>
        {isEditMode && (
          <p className="text-sm text-gray-600 mb-4">
            You have already submitted a review for this company. You can edit it below.
          </p>
        )}

        {/* Example guidance (read-only, not part of the form, won't affect numbers) */}
                {/* Example guidance (read-only, not part of the form, won't affect numbers) */}
        <div className="w-full max-w-lg mb-4">
          <button
            type="button"
            onClick={() => setShowExample(v => !v)}
            className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-between shadow-sm"
            aria-expanded={showExample}
          >
            <span className="font-semibold text-[#3D348B]">What to include in your review</span>
            <span className="text-sm text-gray-600">{showExample ? 'Hide' : 'Show'}</span>
          </button>
          {showExample && (
            <div className="mt-3 border border-gray-200 rounded-xl bg-white p-5 text-sm text-gray-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-medium text-[#3D348B] mb-1">People</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs">
                  <li>Does the company offer fair compensation and benefits? Are working conditions safe and supportive?</li>
                  <li>What is their standing on DEI initiatives?</li>
                  <li>How ethical/fair is the company with their employees (maternity/paternity leave, gender pay gap)?</li>
                  <li>How does the company hold leadership accountable for ethical (mis)conduct?</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-[#3D348B] mb-1">Planet</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs">
                  <li>What metrics does the company use to track its environmental impact (e.g., carbon footprint, waste), and how are these tracked and reported?</li>
                  <li>Has the company set clear, measurable, and time-bound targets for reducing its environmental impact?</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-[#3D348B] mb-1">Transparency</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 text-xs">
                  <li>What partners or organizations do they work with or get funded by?</li>
                  <li>Is the company involved in any recent ethical scandals or breakthroughs?</li>
                  <li>Are the company's core values accessible to employees and consistently communicated?</li>
                  <li>Is the company transparent about its operations, supply chain, and ethical practices?</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border border-dashed border-gray-300 bg-white">
                <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Overall:</span> The company fosters a supportive environment and is making steady progress on sustainability. Transparency around supplier practices could improve.</p>
                <p className="text-sm text-gray-700 mb-2"><span className="font-medium">People:</span> Team leads prioritize psychological safety and fair workloads. Growth conversations happen quarterly.</p>
                <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Planet:</span> Annual emissions report and SBTi-aligned goals; ongoing Scope 3 reduction work.</p>
                <p className="text-sm text-gray-700"><span className="font-medium">Transparency:</span> External reporting is improving, but supplier audits and remediation plans should be clearer.</p>
                <p className="text-xs text-gray-500 mt-2">This example is for guidance only and will not be submitted or counted.</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="w-full max-w-lg mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Content Moderation Alert</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-lg">
          {/* Self Identify */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Self Identify</h2>
            <label className="block mb-2 text-sm">
              What is your current status at this company?
              <select
                value={selfIdentify}
                onChange={(e) => setSelfIdentify(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
              >
                <option value="">Select an option</option>
                <option value="currentlyWork">I currently work here</option>
                <option value="usedToWork">I used to work here</option>
                <option value="neverWorked">I have never worked here</option>
              </select>
            </label>
            
            <label className="block mt-3 text-sm">
              {selfIdentify === "currentlyWork" || selfIdentify === "usedToWork" 
                ? "Please describe your position/role (e.g., Software Engineer, Marketing Manager, Intern)" 
                : selfIdentify === "neverWorked"
                ? "Why are you reviewing this company? (e.g., applied here, researching employers, heard about their practices)"
                : "Additional details (optional)"}
              <textarea
                value={positionDetails}
                onChange={(e) => setPositionDetails(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
                rows={2}
                placeholder={selfIdentify === "currentlyWork" || selfIdentify === "usedToWork" 
                  ? "e.g., Senior Data Analyst, worked in Product team" 
                  : selfIdentify === "neverWorked"
                  ? "e.g., I applied here and want to share what I learned during the process"
                  : ""}
              />
            </label>
          </section>


{/* People */}
<section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
  <h2 className="font-semibold mb-2 text-[#3D348B]">People</h2>
    <p className="text-xs text-gray-600 mb-2">
    Please rate this company’s culture and employee treatment.
  </p>

  {/* Rating scale WITH the radios + descriptions */}
  <div className="mb-4">
    <p className="text-xs text-gray-600 font-medium mb-1">Rating Scale</p>

    <RatingRadios
      value={peopleRating}
      setValue={setPeopleRating}
      name="peopleRating"
      labels={[
        'Harmful / exploitative',
        'Below expectations',
        'Mixed / acceptable but imperfect',
        'Positive / generally ethical',
        'Excellent / values-driven',
      ]}
    />
  </div>

  {/* Question */}
  <label className="block mb-2 text-sm">
    How do you feel about this company’s culture and ethics for its employees?
    <textarea
      value={peopleText}
      onChange={(e) => setPeopleText(e.target.value)}
      className="w-full border border-gray-300 p-2 rounded mt-1"
      rows={3}
    />
  </label>
</section>







{/* Planet */}
<section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
  <h2 className="font-semibold mb-2 text-[#3D348B]">Planet</h2>

  <p className="text-xs text-gray-600 mb-2">
    Please rate this company’s environmental impact.
  </p>

  <div className="mb-4">
    <p className="text-xs text-gray-600 font-medium mb-1">Rating Scale</p>

    <RatingRadios
      value={planetRating}
      setValue={setPlanetRating}
      name="planetRating"
      labels={[
        'Actively harmful to the environment',
        'Below expectations / minimal effort',
        'Average / mixed practices',
        'Positive / proactive sustainability',
        'Leading in environmental stewardship',
      ]}
    />
  </div>

  <label className="block mb-2 text-sm">
    How do you feel about this company’s sustainability and environmental
    practices?
    <textarea
      value={planetText}
      onChange={(e) => setPlanetText(e.target.value)}
      className="w-full border border-gray-300 p-2 rounded mt-1"
      rows={3}
      //placeholder="Share examples (e.g., sustainability reports, waste reduction efforts, greenwashing concerns, or community environmental impact)."
    />
  </label>
</section>

{/* Transparency */}
<section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
  <h2 className="font-semibold mb-2 text-[#3D348B]">Transparency</h2>

  <p className="text-xs text-gray-600 mb-2">
    Please rate how openly this company communicates its values, operations,
    and decision-making.
  </p>
  <div className="mb-4">
    <p className="text-xs text-gray-600 font-medium mb-1">Rating Scale</p>

    <RatingRadios
      value={transparencyRating}
      setValue={setTransparencyRating}
      name="transparencyRating"
      labels={[
        'Misleading / opaque',
        'Minimal disclosure',
        'Some transparency but limited detail',
        'Clear / open reporting',
        'Fully transparent',
      ]}
    />
  </div>

  <label className="block mb-2 text-sm">
    How transparent are this company’s external practices and communications?
    <textarea
      value={transparencyText}
      onChange={(e) => setTransparencyText(e.target.value)}
      className="w-full border border-gray-300 p-2 rounded mt-1"
      rows={3}
      //placeholder="Include notes on clarity in reporting, honesty in advertising, or accessibility of company data."
    />
  </label>
</section>





          {/* Overall */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Overall</h2>
            <label className="block mb-2 text-sm">
              Share an overall summary of your experience with or findings about this company.
              <textarea
                value={overallText}
                onChange={(e) => setOverallText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1"
                rows={3}
              />
            </label>
          </section>

          {/* Recommendation */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Overall Recommendation</h2>
            <label className="block mt-2 text-sm">Would you recommend this company?</label>
            <YesNoRadios value={recommend} setValue={setRecommend} name="overallRecommend" />
          </section>

          {/* References */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">References</h2>
            <label className="block mb-2 text-sm">
              Provide links or sources that support your statements:
              <textarea
                value={RefText}
                onChange={(e) => setRefText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1"
                rows={3}
              />
            </label>
          </section>

          <button
            type="submit"
            className="text-white px-4 py-2 rounded hover:opacity-90 mt-4 shadow-sm"
            style={{ backgroundColor: "#3D348B" }}
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}

export default withAuth(CompanyReviewForm);
