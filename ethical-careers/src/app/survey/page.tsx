"use client";

import { useState } from "react";
// ⬇️ Import the shared navbar (no login button on this page)
import Navbar from "@/app/components/page"; // if '@' alias isn't set, use: ../../components/Navbar

// ⬇️ Use your client/web Firebase here
// If you have firebaseClient.ts:  import { db } from "@/lib/firebaseClient";
import { db } from "../../lib/firebase"; // keep if this is already your client SDK
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function SurveyPage() {
  // People
  const [peopleText, setPeopleText] = useState("");
  const [peopleRating, setPeopleRating] = useState("");

  // Principles
  const [principlesText, setPrinciplesText] = useState("");
  const [principlesRating, setPrinciplesRating] = useState("");

  // Transparency
  const [transparencyText, setTransparencyText] = useState("");
  const [transparencyRating, setTransparencyRating] = useState("");

  // Overall recommendation
  const [recommend, setRecommend] = useState("");

    // References
  const [RefText, setRefText] = useState("");



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "posts"), {
        peopleText,
        peopleRating: Number(peopleRating) || null,
        principlesText,
        principlesRating: Number(principlesRating) || null,
        transparencyText,
        transparencyRating: Number(transparencyRating) || null,
        recommend,
        createdAt: Timestamp.now(),
      });
      alert("Post submitted!");

      // clear all states
      setPeopleText(""); setPeopleRating("");
      setPrinciplesText(""); setPrinciplesRating("");
      setTransparencyText(""); setTransparencyRating("");
      setRecommend("");
    } catch (err) {
      console.error(err);
      alert("Error submitting post");
    }
  };

  const RatingRadios = ({
    value, setValue, name,
  }: { value: string; setValue: (v: string) => void; name: string }) => (
    <div className="flex gap-3 mt-1">
      {[1 , 2, 3, 4, 5].map((num) => (
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

  const YesNoRadios = ({
    value, setValue, name,
  }: { value: string; setValue: (v: string) => void; name: string }) => (
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
      {/* 🔝 Reused top bar, no Login button */}
      <Navbar showLogin={false} />

      <div className="p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#3D348B" }}>
          Submit Your Review
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-lg">
          {/* People */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">People</h2>
            <label className="block mb-2 text-sm">
              How do you feel about the company's team and culture?
              <textarea
                value={peopleText}
                onChange={(e) => setPeopleText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
                rows={3}
              />
            </label>
            <label className="block mt-2 text-sm">Rate the company in terms of People:</label>
            <RatingRadios value={peopleRating} setValue={setPeopleRating} name="peopleRating" />
          </section>

          {/* Principles */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Principles</h2>
            <label className="block mb-2 text-sm">
              Does the company follow ethical business practices?
              <textarea
                value={principlesText}
                onChange={(e) => setPrinciplesText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
                rows={3}
              />
            </label>
            <label className="block mt-2 text-sm">Rate the company in terms of Principles:</label>
            <RatingRadios value={principlesRating} setValue={setPrinciplesRating} name="principlesRating" />
          </section>

          {/* Transparency */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Transparency</h2>
            <label className="block mb-2 text-sm">
              How transparent is the company about its practices?
              <textarea
                value={transparencyText}
                onChange={(e) => setTransparencyText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
                rows={3}
              />
            </label>
            <label className="block mt-2 text-sm">Rate the company in terms of Transparency:</label>
            <RatingRadios value={transparencyRating} setValue={setTransparencyRating} name="transparencyRating" />
          </section>

          {/* Overall Recommendation */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Overall Recommendation</h2>
            <label className="block mt-2 text-sm">Would you recommend this company to a friend?</label>
            <YesNoRadios value={recommend} setValue={setRecommend} name="overallRecommend" />
          </section>

            {/* References */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">References</h2>
            <label className="block mb-2 text-sm">
              Please provide references (links, online documents) that support your statements and findings. This helps others research further!
              <textarea
                value={RefText}
                onChange={(e) => setRefText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
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
