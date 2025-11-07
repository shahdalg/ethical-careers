"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// ✅ Random pseudonym generator
function generatePseudonym() {
  const adjectives = [
    "Curious",
    "Brave",
    "Bright",
    "Calm",
    "Witty",
    "Kind",
    "Bold",
    "Quiet",
  ];
  const nouns = [
    "Otter",
    "Falcon",
    "Fox",
    "Panda",
    "Dolphin",
    "Hawk",
    "Sparrow",
    "Lynx",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900 + 100); // 100–999
  return `${adj}${noun}${num}`; // e.g., BrightOtter392
}

export default function SignupPage() {
  const router = useRouter();

  // signup form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // flow
  const [step, setStep] = useState<"signup" | "survey">("signup");
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [assignedPseudonym, setAssignedPseudonym] = useState<string | null>(null);

  // survey state
  const [q1, setQ1] = useState(""); // 1–5
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");
  const [q5, setQ5] = useState("");
  const [q6, setQ6] = useState(""); // yes/no/na
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);

  // 🔹 Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const pseudonym = generatePseudonym();

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // basic user profile doc (keep as-is but include pseudonym)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName: displayName || "",
        pseudonym, // 👈 store here
        bio: "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // move to survey step
      setNewUserId(user.uid);
      setAssignedPseudonym(pseudonym);
      setStep("survey");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle survey submit → save to "signupSurvey" collection
  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSurveyError(null);

    if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6) {
      setSurveyError("Please answer all questions before continuing.");
      return;
    }
    if (!newUserId) {
      router.push("/");
      return;
    }

    try {
      setSurveyLoading(true);

      // one doc per user:
      // /signupSurvey/{uid}
      await setDoc(
        doc(db, "signupSurvey", newUserId),
        {
          uid: newUserId,
          email, // optional; you can remove if you want it more anonymized
          pseudonym: assignedPseudonym || null,
          workerCommunity: Number(q1),
          environmentImpact: Number(q2),
          transparency: Number(q3),
          trustCompanyStatements: Number(q4),
          ethicsAffectChoices: Number(q5),
          lookedUpEthicsLast12mo: q6, // "yes" | "no" | "na"
          submittedAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setSurveyError(
        "Something went wrong saving your responses. Please try again."
      );
    } finally {
      setSurveyLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      {step === "signup" && (
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md border bg-white p-6 rounded-lg shadow flex flex-col gap-4"
        >
          <h2 className="text-2xl font-semibold text-center">
            Create your account
          </h2>
          <p className="text-xs text-gray-500 text-center">
            You’ll be assigned an anonymous pseudonym used for posts & reviews.
          </p>

          <label className="flex flex-col gap-1">
            <span>Email</span>
            <input
              type="email"
              className="border p-2 rounded"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Password</span>
            <input
              type="password"
              className="border p-2 rounded"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {/* optional display name input if you want later
          <label className="flex flex-col gap-1">
            <span>Display name (optional)</span>
            <input
              type="text"
              className="border p-2 rounded"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          */}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#3D348B] hover:bg-[#2E256E] disabled:opacity-60 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-sm text-center mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Click here
            </a>
          </p>
        </form>
      )}

      {step === "survey" && (
        <form
          onSubmit={handleSurveySubmit}
          className="w-full max-w-2xl border bg-white p-6 rounded-lg shadow flex flex-col gap-5"
        >
          <h2 className="text-2xl font-semibold text-center mb-1">
            Before you start, a quick snapshot 🌱
          </h2>
          {assignedPseudonym && (
            <p className="text-sm text-center text-gray-600 mb-2">
              Your anonymous name on the platform is{" "}
              <span className="font-semibold text-[#3D348B]">
                {assignedPseudonym}
              </span>
              .
            </p>
          )}
          <p className="text-xs text-gray-500 text-center mb-4">
            These questions help us understand how people think about ethics and
            careers. Responses are stored separately so we can analyze trends.
          </p>

          <ScaleQuestion
            label="I consider how a company treats its workers and communities when I look at jobs."
            value={q1}
            onChange={setQ1}
          />
          <ScaleQuestion
            label="I consider a company’s environmental impact when I look at jobs."
            value={q2}
            onChange={setQ2}
          />
          <ScaleQuestion
            label="I look for transparency (reports, supply chains, etc) before I apply."
            value={q3}
            onChange={setQ3}
          />
          <ScaleQuestion
            label="I trust statements made by companies about their ethical practices."
            value={q4}
            onChange={setQ4}
          />
          <ScaleQuestion
            label="Ethical concerns have changed or could change the companies I’m willing to work for."
            value={q5}
            onChange={setQ5}
          />

          {/* Q6 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-800">
              In the last 12 months, I’ve looked up a company’s ethics,
              sustainability, or human-rights record before applying.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
                {
                  label:
                    "Not applicable (I have not looked for jobs in the last 12 months)",
                  value: "na",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="inline-flex items-center gap-2"
                >
                  <input
                    type="radio"
                    name="q6"
                    value={opt.value}
                    checked={q6 === opt.value}
                    onChange={(e) => setQ6(e.target.value)}
                    className="accent-[#3D348B]"
                    required
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {surveyError && (
            <p className="text-sm text-red-600 mt-1">{surveyError}</p>
          )}

          <button
            type="submit"
            disabled={surveyLoading}
            className="mt-4 bg-[#3D348B] hover:bg-[#2E256E] disabled:opacity-60 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {surveyLoading ? "Saving responses..." : "Finish & continue"}
          </button>
        </form>
      )}
    </main>
  );
}

/**
 * 1–5 Likert question component
 */
function ScaleQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const name = label.slice(0, 20).replace(/\s+/g, "_"); // ensure unique-ish name

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-800">{label}</p>
      <div className="flex gap-4 mt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === String(n)}
              onChange={(e) => onChange(e.target.value)}
              className="accent-[#3D348B]"
              required={!value}
            />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-4 text-[10px] text-gray-500 mt-1">
        <span>1 = Strongly disagree</span>
        <span>5 = Strongly agree</span>
      </div>
    </div>
  );
}
