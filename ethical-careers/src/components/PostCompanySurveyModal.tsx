"use client";
import { useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface PostCompanySurveyModalProps {
  userId: string;
  companyName: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function PostCompanySurveyModal({
  userId,
  companyName,
  onComplete,
  onDismiss,
}: PostCompanySurveyModalProps) {
  // Company-specific questions
  const [summary, setSummary] = useState("");
  const [overallEthical, setOverallEthical] = useState("");
  const [considerWorking, setConsiderWorking] = useState("");
  
  // Overall evaluation questions
  const [workersCommunities, setWorkersCommunities] = useState("");
  const [environmentalImpact, setEnvironmentalImpact] = useState("");
  const [transparency, setTransparency] = useState("");
  const [trustStatements, setTrustStatements] = useState("");
  const [ethicalConcerns, setEthicalConcerns] = useState("");
  const [lookedUpEthics, setLookedUpEthics] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!summary || !overallEthical || !considerWorking || !workersCommunities || 
        !environmentalImpact || !transparency || !trustStatements || 
        !ethicalConcerns || !lookedUpEthics) {
      setError("Please answer all questions before continuing.");
      return;
    }

    setLoading(true);

    try {
      // Save survey response to a dedicated collection
      await setDoc(
        doc(db, "companySurveys", `${userId}_${companyName}_post`),
        {
          userId,
          companyName,
          surveyType: "post",
          summary,
          overallEthical: Number(overallEthical),
          considerWorking,
          workersCommunities: Number(workersCommunities),
          environmentalImpact: Number(environmentalImpact),
          transparency: Number(transparency),
          trustStatements: Number(trustStatements),
          ethicalConcerns: Number(ethicalConcerns),
          lookedUpEthics,
          submittedAt: serverTimestamp(),
        }
      );

      // Get current user document to preserve existing data
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      const currentData = userDoc.exists() ? userDoc.data() : {};
      
      // Update companySurveys object properly
      const companySurveys = currentData.companySurveys || {};
      if (companySurveys[companyName]) {
        companySurveys[companyName].postSubmitted = true;
      }

      // Update user document
      await setDoc(
        userDocRef,
        {
          companySurveys,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('✅ Post-survey saved for company:', companyName);
      onComplete();
    } catch (err) {
      console.error("Error submitting post-company survey:", err);
      setError("Failed to submit survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "#3D348B" }}>
                Post-Company Survey: {companyName}
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                It's been 7 days since you first viewed this company. Please provide your feedback.
              </p>
              <Link 
                href={`/companies/${encodeURIComponent(companyName)}`}
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                target="_blank"
              >
                View {companyName}'s page →
              </Link>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700 text-2xl ml-4"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <label className="block font-semibold mb-2 text-gray-800">
              Please summarize what information you've learned about this company from their page
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded mt-1"
              rows={4}
              placeholder="What did you learn about this company?"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#3D348B" }}>
              About {companyName}
            </h3>

            {/* Overall Ethical Rating */}
            <div className="mb-6">
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

            {/* Consider Working */}
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
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#3D348B" }}>
              Overall Evaluation
            </h3>

            {/* Workers & Communities */}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-800">
                I consider how a company treats its workers and communities when I look at jobs.
              </label>
              <p className="text-xs text-gray-500 mb-3">
                (1 = Strongly disagree, 5 = Strongly agree)
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workersCommunities"
                      value={num}
                      checked={workersCommunities === num.toString()}
                      onChange={(e) => setWorkersCommunities(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-800">
                I consider a company's environmental impact when I look at jobs.
              </label>
              <p className="text-xs text-gray-500 mb-3">
                (1 = Strongly disagree, 5 = Strongly agree)
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="environmentalImpact"
                      value={num}
                      checked={environmentalImpact === num.toString()}
                      onChange={(e) => setEnvironmentalImpact(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Transparency */}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-800">
                I look for transparency (reports, supply chains, etc.) before I apply.
              </label>
              <p className="text-xs text-gray-500 mb-3">
                (1 = Strongly disagree, 5 = Strongly agree)
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transparency"
                      value={num}
                      checked={transparency === num.toString()}
                      onChange={(e) => setTransparency(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Trust Statements */}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-800">
                I trust statements made by companies about their ethical practices.
              </label>
              <p className="text-xs text-gray-500 mb-3">
                (1 = Strongly disagree, 5 = Strongly agree)
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trustStatements"
                      value={num}
                      checked={trustStatements === num.toString()}
                      onChange={(e) => setTrustStatements(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ethical Concerns */}
            <div className="mb-6">
              <label className="block font-semibold mb-2 text-gray-800">
                Ethical concerns have changed or could change the companies I'm willing to work for.
              </label>
              <p className="text-xs text-gray-500 mb-3">
                (1 = Strongly disagree, 5 = Strongly agree)
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ethicalConcerns"
                      value={num}
                      checked={ethicalConcerns === num.toString()}
                      onChange={(e) => setEthicalConcerns(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Looked Up Ethics */}
            <div>
              <label className="block font-semibold mb-2 text-gray-800">
                In the last 12 months, I've looked up a company's ethics, sustainability, or human-rights record before applying.
              </label>
              <div className="flex flex-col gap-2 mt-3">
                {[
                  "Yes",
                  "No",
                  "Not applicable (I have not looked for jobs in the last 12 months)"
                ].map((option) => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="lookedUpEthics"
                      value={option}
                      checked={lookedUpEthics === option}
                      onChange={(e) => setLookedUpEthics(e.target.value)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded hover:bg-gray-50"
            >
              Remind Me Later
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-semibold py-3 px-4 rounded transition-colors"
              style={{ backgroundColor: "#3D348B" }}
            >
              {loading ? "Submitting..." : "Submit Survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
