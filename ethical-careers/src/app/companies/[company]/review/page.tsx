"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase"; // adjust path if needed
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function CompanyReviewForm() {
  const router = useRouter();
  const { company } = useParams(); // dynamic URL param (e.g. /companies/google/review)
  const [companyName, setCompanyName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPseudonym, setUserPseudonym] = useState<string | null>(null);
  const [showExample, setShowExample] = useState<boolean>(false);

  // Self Identify 4
  const [selfIdentify, setSelfIdentify] = useState("");

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

  // Fetch proper company name from Firestore
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!company) return;
      
      try {
        const companySlug = company.toString();
        const companyDocRef = doc(db, "companies", companySlug);
        const companyDoc = await getDoc(companyDocRef);
        
        if (companyDoc.exists()) {
          setCompanyName(companyDoc.data().name);
        } else {
          // Fallback to decoded slug with hyphens replaced
          setCompanyName(decodeURIComponent(companySlug).replace(/-/g, " "));
        }
      } catch (err) {
        console.error("Error fetching company name:", err);
        setCompanyName(decodeURIComponent(company.toString()).replace(/-/g, " "));
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

      // If all checks pass, submit the review
      await addDoc(collection(db, "posts"), {
        // User information
        authorId: userId,
        authorEmail: userEmail,
        pseudonym: userPseudonym,
        // Store both slug and name for robust querying
        companyName: companyName,
        companySlug: company?.toString() || "",
        // Keep legacy field for backward compatibility
        company: companyName,
        overallText,
        selfIdentify,
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

      alert("Review submitted!");
      router.push(`/companies/${company}`); // redirect back to company page
    } catch (err) {
      console.error(err);
      alert("Error submitting review");
    }
  };

  // Rating Radios
  const RatingRadios = ({
    value,
    setValue,
    name,
  }: {
    value: string;
    setValue: (v: string) => void;
    name: string;
  }) => (
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

      <div className="p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#3D348B" }}>
          Submit a Review for {companyName || "Loading..."}
        </h1>

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
          </section>

          {/* People */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">People</h2>
            <label className="block mb-2 text-sm">
              How do you feel about this company’s culture and ethics for its employees?
              <textarea
                value={peopleText}
                onChange={(e) => setPeopleText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1"
                rows={3}
              />
            </label>
            <RatingRadios value={peopleRating} setValue={setPeopleRating} name="peopleRating" />
          </section>

          {/* Planet */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Planet</h2>
            <label className="block mb-2 text-sm">
              How do you feel about this company’s sustainability and environmental practices?
              <textarea
                value={planetText}
                onChange={(e) => setPlanetText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1"
                rows={3}
              />
            </label>
            <RatingRadios value={planetRating} setValue={setPlanetRating} name="planetRating" />
          </section>

          {/* Transparency */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Transparency</h2>
            <label className="block mb-2 text-sm">
              How transparent are this company’s external practices and communications?
              <textarea
                value={transparencyText}
                onChange={(e) => setTransparencyText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1"
                rows={3}
              />
            </label>
            <RatingRadios value={transparencyRating} setValue={setTransparencyRating} name="transparencyRating" />
          </section>

          {/* Overall */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Overall</h2>
            <label className="block mb-2 text-sm">
              Share an overall summary of your experience with this company.
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
