"use client";

import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function PostPage() {
  // People
  const [peopleText, setPeopleText] = useState("");
  const [peopleRating, setPeopleRating] = useState("");
  const [peopleRecommend, setPeopleRecommend] = useState("");

  // Principles
  const [principlesText, setPrinciplesText] = useState("");
  const [principlesRating, setPrinciplesRating] = useState("");
  const [principlesRecommend, setPrinciplesRecommend] = useState("");

  // Transparency
  const [transparencyText, setTransparencyText] = useState("");
  const [transparencyRating, setTransparencyRating] = useState("");
  const [transparencyRecommend, setTransparencyRecommend] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "posts"), {
        peopleText,
        peopleRating,
        peopleRecommend,
        principlesText,
        principlesRating,
        principlesRecommend,
        transparencyText,
        transparencyRating,
        transparencyRecommend,
        createdAt: Timestamp.now(),
      });
      alert("Post submitted!");
      // clear all states
      setPeopleText(""); setPeopleRating(""); setPeopleRecommend("");
      setPrinciplesText(""); setPrinciplesRating(""); setPrinciplesRecommend("");
      setTransparencyText(""); setTransparencyRating(""); setTransparencyRecommend("");
    } catch (err) {
      console.error(err);
      alert("Error submitting post");
    }
  };

  const RatingRadios = ({ value, setValue, name }: { value: string; setValue: (v: string) => void; name: string }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <label key={num} className="flex items-center gap-1">
          <input type="radio" name={name} value={num.toString()} checked={value === num.toString()} onChange={(e) => setValue(e.target.value)} />
          {num}
        </label>
      ))}
    </div>
  );

  const YesNoRadios = ({ value, setValue, name }: { value: string; setValue: (v: string) => void; name: string }) => (
    <div className="flex gap-4">
      {["Yes", "No"].map((option) => (
        <label key={option} className="flex items-center gap-1">
          <input type="radio" name={name} value={option} checked={value === option} onChange={(e) => setValue(e.target.value)} />
          {option}
        </label>
      ))}
    </div>
  );

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#3D348B" }}>Submit Your Review</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-lg">

        {/* People Section */}
        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">People</h2>
          <label className="block mb-2">
            How do you feel about the company's team and culture?
            <textarea value={peopleText} onChange={(e) => setPeopleText(e.target.value)} className="w-full border p-2 rounded mt-1" rows={3} />
          </label>

          <label className="block mt-2">Rate the company in terms of People:</label>
          <RatingRadios value={peopleRating} setValue={setPeopleRating} name="peopleRating" />

          <label className="block mt-2">Would you recommend this company to a friend?</label>
          <YesNoRadios value={peopleRecommend} setValue={setPeopleRecommend} name="peopleRecommend" />
        </section>

        {/* Principles Section */}
        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Principles</h2>
          <label className="block mb-2">
            Does the company follow ethical business practices?
            <textarea value={principlesText} onChange={(e) => setPrinciplesText(e.target.value)} className="w-full border p-2 rounded mt-1" rows={3} />
          </label>

          <label className="block mt-2">Rate the company in terms of Principles:</label>
          <RatingRadios value={principlesRating} setValue={setPrinciplesRating} name="principlesRating" />

          <label className="block mt-2">Would you recommend this company to a friend?</label>
          <YesNoRadios value={principlesRecommend} setValue={setPrinciplesRecommend} name="principlesRecommend" />
        </section>

        {/* Transparency Section */}
        <section className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Transparency</h2>
          <label className="block mb-2">
            How transparent is the company about its practices?
            <textarea value={transparencyText} onChange={(e) => setTransparencyText(e.target.value)} className="w-full border p-2 rounded mt-1" rows={3} />
          </label>

          <label className="block mt-2">Rate the company in terms of Transparency:</label>
          <RatingRadios value={transparencyRating} setValue={setTransparencyRating} name="transparencyRating" />

          <label className="block mt-2">Would you recommend this company to a friend?</label>
          <YesNoRadios value={transparencyRecommend} setValue={setTransparencyRecommend} name="transparencyRecommend" />
        </section>

        <button type="submit" className="text-white px-4 py-2 rounded hover:opacity-90 mt-4" style={{ backgroundColor: "#3D348B" }}>
          Submit
        </button>
      </form>
    </main>
  );
}
