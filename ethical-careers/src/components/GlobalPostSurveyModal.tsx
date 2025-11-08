"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GlobalPostSurveyModalProps {
  userId: string;
  onComplete: () => void;
  onDismiss: () => void;
}

interface CompanyResponse {
  summary: string;
  overallEthical: string;
  considerWorking: string;
}

export default function GlobalPostSurveyModal({ userId, onComplete, onDismiss }: GlobalPostSurveyModalProps) {
  const [visitedCompanies, setVisitedCompanies] = useState<string[]>([]);
  const [companyResponses, setCompanyResponses] = useState<Record<string, CompanyResponse>>({});

  // Overall evaluation section (same as previous post survey overall part)
  const [workersCommunities, setWorkersCommunities] = useState("");
  const [environmentalImpact, setEnvironmentalImpact] = useState("");
  const [transparency, setTransparency] = useState("");
  const [trustStatements, setTrustStatements] = useState("");
  const [ethicalConcerns, setEthicalConcerns] = useState("");
  const [lookedUpEthics, setLookedUpEthics] = useState("");

  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch visited companies on mount
  useEffect(() => {
    const fetchVisitedCompanies = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const companies = Object.keys(data.companySurveys || {});
          setVisitedCompanies(companies);
          // Initialize responses for each company
          const initialResponses: Record<string, CompanyResponse> = {};
          companies.forEach(company => {
            initialResponses[company] = { summary: "", overallEthical: "", considerWorking: "" };
          });
          setCompanyResponses(initialResponses);
        }
      } catch (err) {
        console.error("Error fetching visited companies:", err);
      }
    };
    fetchVisitedCompanies();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate all companies have responses
    for (const company of visitedCompanies) {
      if (!companyResponses[company]?.summary || !companyResponses[company]?.overallEthical || !companyResponses[company]?.considerWorking) {
        setError(`Please answer all questions for ${company}.`);
        return;
      }
    }
    
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
        companyResponses,
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
          {/* Company-specific questions */}
          {visitedCompanies.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4" style={{ color: "#3D348B" }}>
                Companies You've Visited
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Please answer the following questions for each company you've viewed.
              </p>

              {visitedCompanies.map((company) => (
                <div key={company} className="mb-8 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-md mb-4" style={{ color: "#3D348B" }}>
                    {company}
                  </h4>

                  {/* Summary textbox */}
                  <div className="mb-6">
                    <label className="block font-semibold mb-2 text-gray-800">
                      Summarize what you've read on this company's page
                    </label>
                    <textarea
                      value={companyResponses[company]?.summary || ""}
                      onChange={(e) => setCompanyResponses({
                        ...companyResponses,
                        [company]: {
                          ...companyResponses[company],
                          summary: e.target.value
                        }
                      })}
                      rows={3}
                      className="w-full border p-3 rounded"
                      placeholder="Describe what you learned about this company..."
                    />
                  </div>

                  {/* Question 1: Overall Ethical Rating */}
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
                            name={`${company}_overallEthical`}
                            value={num}
                            checked={companyResponses[company]?.overallEthical === num.toString()}
                            onChange={(e) => setCompanyResponses({
                              ...companyResponses,
                              [company]: {
                                ...companyResponses[company],
                                overallEthical: e.target.value
                              }
                            })}
                            className="cursor-pointer"
                          />
                          <span className="text-sm">{num}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 2: Consider Working */}
                  <div className="mb-4">
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
                            name={`${company}_considerWorking`}
                            value={option}
                            checked={companyResponses[company]?.considerWorking === option}
                            onChange={(e) => setCompanyResponses({
                              ...companyResponses,
                              [company]: {
                                ...companyResponses[company],
                                considerWorking: e.target.value
                              }
                            })}
                            className="cursor-pointer"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: "#3D348B" }}>Overall Evaluation</h3>

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
