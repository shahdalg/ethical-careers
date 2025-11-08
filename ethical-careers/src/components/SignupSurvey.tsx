"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

type SignupSurveyProps = {
  userId: string;
  email: string;
};

// 🔹 Same pseudonym generator as signup
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
  return `${adj}${noun}${num}`;
}

export default function SignupSurvey({ userId, email }: SignupSurveyProps) {
  const router = useRouter();

  // pseudonym we show to user
  const [pseudonym, setPseudonym] = useState<string | null>(null);

  // survey state
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");
  const [q5, setQ5] = useState("");
  const [q6, setQ6] = useState("");
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);

  // ✅ Ensure user doc exists and has a pseudonym
  useEffect(() => {
    const ensurePseudonym = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          if (data.pseudonym) {
            setPseudonym(data.pseudonym);
            return;
          }
        }

        // No user doc or no pseudonym → create/patch one
        const newPseudo = generatePseudonym();
        await setDoc(
          userRef,
          {
            uid: userId,
            email,
            pseudonym: newPseudo,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setPseudonym(newPseudo);
      } catch (err) {
        console.error("Error ensuring pseudonym:", err);
        // Fallback just for display; we still continue
        if (!pseudonym) setPseudonym(generatePseudonym());
      }
    };

    if (userId) {
      ensurePseudonym();
    }
  }, [userId, email]);

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSurveyError(null);

    if (!q1 || !q2 || !q3 || !q4 || !q5 || !q6) {
      setSurveyError("Please answer all questions before continuing.");
      return;
    }

    try {
      setSurveyLoading(true);

      // Save survey answers
      await setDoc(
        doc(db, "signupSurvey", userId),
        {
          uid: userId,
          email,
          pseudonym: pseudonym || null,
          workerCommunity: Number(q1),
          environmentImpact: Number(q2),
          transparency: Number(q3),
          trustCompanyStatements: Number(q4),
          ethicsAffectChoices: Number(q5),
          lookedUpEthicsLast12mo: q6,
          submittedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Mark survey complete on user
      await setDoc(
        doc(db, "users", userId),
        {
          submittedInitialSurvey: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ Redirect:
      // If they're signed in in this browser, go to home (logged-in UI will pick up).
      // If not (e.g., they clicked email on another device), send them to login.
      const current = auth.currentUser;
      if (current && current.uid === userId) {
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      console.error(err);
      setSurveyError(
        "Something went wrong saving your responses. Please try again."
      );
    } finally {
      setSurveyLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSurveySubmit}
      className="w-full max-w-2xl border bg-white p-6 rounded-lg shadow flex flex-col gap-5"
    >
      <h2 className="text-2xl font-semibold text-center mb-1">
        Before you start, a few questions 🌱
      </h2>

      {pseudonym && (
        <p className="text-sm text-center text-gray-600 mb-2">
          Your anonymous name on the platform is{" "}
          <span className="font-semibold text-[#3D348B]">
            {pseudonym}
          </span>
          .
        </p>
      )}

      <p className="text-xs text-gray-500 text-center mb-4">
        These questions help us understand how people think about ethics and
        careers. Your responses are stored separately from anything public.
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
            <label key={opt.value} className="inline-flex items-center gap-2">
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
  );
}

// 1–5 Likert
function ScaleQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const name = label.slice(0, 20).replace(/\s+/g, "_");

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
