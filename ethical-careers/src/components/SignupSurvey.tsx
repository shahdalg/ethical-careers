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
    "Curious", "Brave", "Bright", "Calm", "Witty", "Kind", "Bold", "Quiet",
    "Swift", "Clever", "Gentle", "Noble", "Wise", "Fierce", "Humble", "Loyal",
    "Daring", "Serene", "Vibrant", "Eager", "Honest", "Graceful", "Mighty", "Peaceful",
    "Radiant", "Shrewd", "Spirited", "Steady", "Thoughtful", "Valiant", "Warm", "Zesty",
    "Agile", "Creative", "Focused", "Inventive", "Mindful", "Patient", "Resilient", "Skilled",
    "Adventurous", "Ambitious", "Artistic", "Cheerful", "Confident", "Cosmic", "Dazzling", "Dynamic",
    "Elegant", "Energetic", "Fearless", "Free", "Friendly", "Harmonious", "Independent", "Joyful",
    "Keen", "Lively", "Lucky", "Magical", "Mysterious", "Optimistic", "Playful", "Proud",
    "Quick", "Reliable", "Royal", "Sassy", "Sharp", "Silent", "Sleek", "Smart",
    "Stellar", "Strong", "Sunny", "Talented", "Tranquil", "Trusty", "Vivid", "Wild"
  ];
  const nouns = [
    "Otter", "Falcon", "Fox", "Panda", "Dolphin", "Hawk", "Sparrow", "Lynx",
    "Wolf", "Eagle", "Bear", "Owl", "Deer", "Tiger", "Raven", "Phoenix",
    "Dragon", "Leopard", "Crane", "Swan", "Turtle", "Jaguar", "Penguin", "Raccoon",
    "Badger", "Bison", "Cheetah", "Coyote", "Heron", "Koala", "Moose", "Platypus",
    "Puffin", "Salamander", "Seal", "Squirrel", "Starling", "Walrus", "Wombat", "Zebra",
    "Albatross", "Antelope", "Armadillo", "Bat", "Beaver", "Butterfly", "Camel", "Cardinal",
    "Chameleon", "Cobra", "Condor", "Cougar", "Crab", "Cricket", "Crow", "Dragonfly",
    "Elephant", "Elk", "Ferret", "Flamingo", "Frog", "Gazelle", "Gecko", "Giraffe",
    "Gorilla", "Hamster", "Hedgehog", "Hummingbird", "Iguana", "Jellyfish", "Kangaroo", "Kestrel",
    "Lion", "Llama", "Lobster", "Lynx", "Meerkat", "Narwhal", "Newt", "Octopus",
    "Opossum", "Ostrich", "Panther", "Parrot", "Pelican", "Python", "Quail", "Rhino"
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
  }, [userId, email, pseudonym]);

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
      className="w-full max-w-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col gap-5"
    >
      <h2 className="text-2xl font-semibold text-center mb-1 text-gray-900 dark:text-gray-100">
        Before you start, a few questions 🌱
      </h2>

      {pseudonym && (
        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-2">
          Your anonymous name on the platform is{" "}
          <span className="font-semibold text-[#3D348B] dark:text-[#7678ED]">
            {pseudonym}
          </span>
          .
        </p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
        These questions help us understand how people think about ethics and
        careers. Your responses are stored separately from anything public.
      </p>

      <ScaleQuestion
        label="I consider how a company treats its workers and communities when I look at jobs."
        value={q1}
        onChange={setQ1}
      />
      <ScaleQuestion
        label="I consider a company's environmental impact when I look at jobs."
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
        label="A company's ethics affect my career choices."
        value={q5}
        onChange={setQ5}
      />

      <YesNoQuestion
        label="In the last 12 months, have you looked up a company's ethical practices before applying or accepting a job?"
        value={q6}
        onChange={setQ6}
      />

      {surveyError && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">{surveyError}</p>
      )}

      <button
        type="submit"
        disabled={surveyLoading}
        className="bg-[#3D348B] hover:bg-[#2E256E] dark:bg-[#7678ED] dark:hover:bg-[#5E4BB8] disabled:opacity-60 text-white font-semibold py-3 px-6 rounded transition-colors"
      >
        {surveyLoading ? "Submitting..." : "Continue to Platform"}
      </button>
    </form>
  );
}

// Helper component: 1-5 scale
function ScaleQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
      <p className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">{label}</p>
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((num) => (
          <label
            key={num}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <input
              type="radio"
              name={`scale-${label}`}
              value={num.toString()}
              checked={value === num.toString()}
              onChange={(e) => onChange(e.target.value)}
              className="cursor-pointer"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">{num}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );
}

// Helper component: Yes/No
function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
      <p className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">{label}</p>
      <div className="flex gap-4">
        {["Yes", "No"].map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={`yesno-${label}`}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              className="cursor-pointer"
            />
            <span className="text-sm text-gray-800 dark:text-gray-200">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
