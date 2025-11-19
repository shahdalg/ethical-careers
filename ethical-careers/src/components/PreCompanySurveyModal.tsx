"use client";
import { useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCompanyName } from "@/lib/formatCompanyName";

interface PreCompanySurveyModalProps {
  userId: string;
  companyName: string;
  onComplete: () => void;
}

export default function PreCompanySurveyModal({
  userId,
  companyName,
  onComplete,
}: PreCompanySurveyModalProps) {
  const [overallEthical, setOverallEthical] = useState(""); // 1-5 rating
  const [considerWorking, setConsiderWorking] = useState(""); // 5 options
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!overallEthical || !considerWorking) {
      setError("Please answer all questions before continuing.");
      return;
    }

    setLoading(true);

    try {
      const now = new Date();

      // Save survey response to a dedicated collection
      await setDoc(
        doc(db, "companySurveys", `${userId}_${companyName}_pre`),
        {
          userId,
          companyName,
          surveyType: "pre",
          overallEthical: Number(overallEthical),
          considerWorking: considerWorking,
          submittedAt: serverTimestamp(),
        }
      );

      // First, get the current user document to preserve existing data
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      
      // Update companySurveys object properly
      const companySurveys = currentData.companySurveys || {};
      companySurveys[companyName] = {
        preSubmitted: true,
        postSubmitted: false,
        firstVisitDate: now.toISOString(),
      };

      // Update user document with the modified companySurveys object
      await setDoc(
        userDocRef,
        {
          companySurveys,
          firstCompanyVisitDate: currentData.firstCompanyVisitDate || serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('✅ Pre-survey saved for company:', companyName);
      onComplete();
    } catch (err) {
      console.error("Error submitting pre-company survey:", err);
      setError("Failed to submit survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <h2 className="text-2xl font-bold" style={{ color: "#3D348B" }}>
            Before You View: {formatCompanyName(companyName)}
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Please take a moment to answer the following two questions about this company. The information you provide will be used solely for internal data collection purposes and will not be shared externally.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Question 1: Overall Ethical Rating */}
          <div>
            <label className="block font-semibold mb-2 text-gray-800">
              Overall, how ethical do you think this company is?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              (1 = Not ethical at all, 5 = Very ethical)
            </p>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <label key={num} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="overallEthical"
                    value={num}
                    checked={overallEthical === num.toString()}
                    onChange={(e) => setOverallEthical(e.target.value)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">{num}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 2: Consider Working */}
          <div>
            <label className="block font-semibold mb-2 text-gray-800">
              Would you consider working here?
            </label>
            <div className="flex flex-col gap-2 mt-3">
              {[
                "Definitely not",
                "Probably not",
                "Unsure",
                "Probably yes",
                "Definitely yes"
              ].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="considerWorking"
                    value={option}
                    checked={considerWorking === option}
                    onChange={(e) => setConsiderWorking(e.target.value)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 px-4 rounded transition-colors"
            style={{ backgroundColor: "#3D348B" }}
          >
            {loading ? "Submitting..." : "Submit & View Company Reviews"}
          </button>
        </form>
      </div>
    </div>
  );
}
