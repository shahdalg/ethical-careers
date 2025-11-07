"use client";
import { useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GlobalPostSurveyModalProps {
  userId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function GlobalPostSurveyModal({ userId, onComplete, onDismiss }: GlobalPostSurveyModalProps) {

  // Overall evaluation section (same as previous post survey overall part)
  const [workersCommunities, setWorkersCommunities] = useState("");
  const [environmentalImpact, setEnvironmentalImpact] = useState("");
  const [transparency, setTransparency] = useState("");
  const [trustStatements, setTrustStatements] = useState("");
  const [ethicalConcerns, setEthicalConcerns] = useState("");
  const [lookedUpEthics, setLookedUpEthics] = useState("");
  const [summary, setSummary] = useState("");

  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workersCommunities || !environmentalImpact || !transparency || !trustStatements || !ethicalConcerns || !lookedUpEthics) {
      setError("Please finish the overall evaluation section.");
      return;
    }

    setLoading(true);
    try {
      // Fetch user doc to update companySurveys & global flag
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      // Save a single global post-survey response (overall only)
      await setDoc(doc(db, "globalPostSurveys", `${userId}_${Date.now()}`), {
        userId,
        summary,
        workersCommunities: Number(workersCommunities),
        environmentalImpact: Number(environmentalImpact),
        transparency: Number(transparency),
        trustStatements: Number(trustStatements),
        ethicalConcerns: Number(ethicalConcerns),
        lookedUpEthics,
        submittedAt: serverTimestamp(),
      });

      // Mark user as having completed global post-survey
      await setDoc(userRef, {
        submittedGlobalPostSurvey: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      onComplete();
    } catch (err) {
      console.error("Error submitting global post survey", err);
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10 flex justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#3D348B" }}>Global Post Survey</h2>
            <p className="text-sm text-gray-600 mt-2">It's been 7 days since you first viewed a company page. Please provide your feedback about each company page you've visited.</p>
          </div>
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="border-t pt-0">
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#3D348B" }}>Overall Evaluation</h3>

            <div className="mb-4">
              <label className="block font-medium mb-2">Summary of what you've learned from these company pages</label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                rows={4}
                className="w-full border p-3 rounded"
                placeholder="Summarize key impressions and information you gathered"
              />
            </div>

            {/* Workers & Communities */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">I consider how a company treats its workers and communities when I look at jobs.</label>
              <p className="text-xs text-gray-500 mb-2">(1 = Strongly disagree, 5 = Strongly agree)</p>
              <div className="flex gap-4">
                {[1,2,3,4,5].map(num => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workersCommunities"
                      value={num}
                      checked={workersCommunities === num.toString()}
                      onChange={e => setWorkersCommunities(e.target.value)}
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">I consider a company's environmental impact when I look at jobs.</label>
              <p className="text-xs text-gray-500 mb-2">(1 = Strongly disagree, 5 = Strongly agree)</p>
              <div className="flex gap-4">
                {[1,2,3,4,5].map(num => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="environmentalImpact"
                      value={num}
                      checked={environmentalImpact === num.toString()}
                      onChange={e => setEnvironmentalImpact(e.target.value)}
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Transparency */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">I look for transparency (reports, supply chains, etc.) before I apply.</label>
              <p className="text-xs text-gray-500 mb-2">(1 = Strongly disagree, 5 = Strongly agree)</p>
              <div className="flex gap-4">
                {[1,2,3,4,5].map(num => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transparency"
                      value={num}
                      checked={transparency === num.toString()}
                      onChange={e => setTransparency(e.target.value)}
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Trust Statements */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">I trust statements made by companies about their ethical practices.</label>
              <p className="text-xs text-gray-500 mb-2">(1 = Strongly disagree, 5 = Strongly agree)</p>
              <div className="flex gap-4">
                {[1,2,3,4,5].map(num => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trustStatements"
                      value={num}
                      checked={trustStatements === num.toString()}
                      onChange={e => setTrustStatements(e.target.value)}
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ethical Concerns */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">Ethical concerns have changed or could change the companies I'm willing to work for.</label>
              <p className="text-xs text-gray-500 mb-2">(1 = Strongly disagree, 5 = Strongly agree)</p>
              <div className="flex gap-4">
                {[1,2,3,4,5].map(num => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ethicalConcerns"
                      value={num}
                      checked={ethicalConcerns === num.toString()}
                      onChange={e => setEthicalConcerns(e.target.value)}
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Looked Up Ethics */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">In the last 12 months, I've looked up a company's ethics, sustainability, or human-rights record before applying.</label>
              <div className="flex flex-col gap-2">
                {["Yes","No","Not applicable (I have not looked for jobs in the last 12 months)"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="lookedUpEthics"
                      value={opt}
                      checked={lookedUpEthics === opt}
                      onChange={e => setLookedUpEthics(e.target.value)}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onDismiss} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded hover:bg-gray-50">Remind Me Later</button>
            <button type="submit" disabled={loading} className="flex-1 text-white font-semibold py-3 px-4 rounded" style={{ backgroundColor: "#3D348B" }}>
              {loading ? "Submitting..." : "Submit Global Post Survey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
