"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// 🔹 Random pseudonym generator
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

export default function SignupPage() {
  const router = useRouter();

  // signup form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // verification flow state
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  // 🔹 Handle signup: create user, save profile, send verification email
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerificationError(null);
    setVerificationSent(false);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const pseudonym = generatePseudonym();

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // base user doc (pseudonym stored here)
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email,
          displayName: displayName || "",
          pseudonym,
          bio: "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          companySurveys: {},
          signupDate: serverTimestamp(),
          submittedInitialSurvey: false,
        },
        { merge: true }
      );

      setNewUserId(user.uid);

      // 🔹 Verification link:
      // - Firebase shows its success page
      // - "Continue" button goes to home page
      const verifyUrl = window.location.origin + "/thank-you";


await sendEmailVerification(user, {
  url: verifyUrl,
  handleCodeInApp: false,
});


      setVerificationSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 "I've verified" button: check emailVerified & then send to survey
  const handleCheckVerified = async () => {
    setVerificationError(null);
    setVerificationChecking(true);

    try {
      const current = auth.currentUser;
      if (!current) {
        setVerificationError("Session expired. Please sign in again.");
        return;
      }

      await current.reload();

      if (current.emailVerified) {
        router.push(`/signup/survey?userId=${current.uid}`);
      } else {
        setVerificationError(
          "We haven’t detected verification yet. Please click the link in your email, then try again."
        );
      }
    } catch (err: any) {
      console.error(err);
      setVerificationError("Error checking verification status. Try again.");
    } finally {
      setVerificationChecking(false);
    }
  };

  // 🔹 Resend verification email — does NOT start survey, just resends
  const handleResendVerification = async () => {
    setVerificationError(null);

    try {
      const current = auth.currentUser;
      if (!current || !newUserId) {
        setVerificationError("Please create your account first.");
        return;
      }

      const verifyUrl = window.location.origin + "/thank-you";

      await sendEmailVerification(current, {
        url: verifyUrl,
        handleCodeInApp: false,
      });

      setVerificationSent(true);
      setVerificationError(
        "Verification email resent. Please check your inbox (and spam)."
      );
    } catch (err: any) {
      console.error(err);
      setVerificationError("Failed to resend verification email.");
    }
  };

  // ---------- UI ----------
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col gap-4"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100">
          Create your account
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          You'll be assigned an anonymous username used for posts & reviews.
        </p>

        <label className="flex flex-col gap-1 text-gray-800 dark:text-gray-200 font-medium">
          <span>Email</span>
          <input
            type="email"
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded focus:ring-2 focus:ring-[#3D348B] dark:focus:ring-[#7678ED] outline-none disabled:opacity-60"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={verificationSent} // lock after sending
          />
        </label>

        <label className="flex flex-col gap-1 text-gray-800 dark:text-gray-200 font-medium">
          <span>Password</span>
          <input
            type="password"
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded focus:ring-2 focus:ring-[#3D348B] dark:focus:ring-[#7678ED] outline-none disabled:opacity-60"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={verificationSent}
          />
        </label>

        {/* Optional display name, if you want it later
        <label className="flex flex-col gap-1">
          <span>Display name (optional)</span>
          <input
            type="text"
            className="border p-2 rounded"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={verificationSent}
          />
        </label>
        */}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Initial create button (before verification email is sent) */}
        {!verificationSent && (
          <button
            type="submit"
            disabled={loading}
            className="bg-[#3D348B] hover:bg-[#2E256E] dark:bg-[#7678ED] dark:hover:bg-[#5E4BB8] disabled:opacity-60 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        )}

        {/* After email is sent */}
        {verificationSent && (
          <div className="mt-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200 flex flex-col gap-2">
            <p>
              We've sent a verification link to{" "}
              <span className="font-semibold">{email}</span>. Click the link in
              your email to verify your account. Please check your spam folder.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Return here after verifying and click {" "}
                <strong>"I've verified"</strong> to continue.
              </li>
            </ul>

            {verificationError && (
              <p className="text-red-600 dark:text-red-400">{verificationError}</p>
            )}

            <div className="flex gap-2 items-center mt-1">
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={verificationChecking}
                className="bg-[#3D348B] hover:bg-[#2E256E] dark:bg-[#7678ED] dark:hover:bg-[#5E4BB8] text-white px-3 py-1 rounded text-xs disabled:opacity-60"
              >
                {verificationChecking ? "Checking..." : "I've verified"}
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="text-[#3D348B] dark:text-[#7678ED] text-xs underline hover:no-underline"
              >
                Resend email
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-center mt-2 text-gray-800 dark:text-gray-200">
          Already have an account?{" "}
          <a href="/login" className="text-[#3D348B] dark:text-[#7678ED] hover:underline font-semibold">
            Click here
          </a>
        </p>
      </form>
    </main>
  );
}
