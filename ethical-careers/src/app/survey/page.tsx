"use client";

import { useState } from "react";
// ⬇️ Import the shared navbar (no login button on this page)
import Navbar from "@/app/components/page"; // if '@' alias isn't set, use: ../../components/Navbar

// ⬇️ Use your client/web Firebase here
// If you have firebaseClient.ts:  import { db } from "@/lib/firebaseClient";
import { db } from "../../lib/firebase"; // keep if this is already your client SDK
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function SurveyPage() {
  //Company Name
  const [companyText, setCompanyText] = useState("");

  //Self Identify - multiple choice 
  //I used to work here
  //I currently work here
  //I have never worked here - option to expand
  const [selfIdentify, setSelfIdentify] = useState("");

  // People
  const [peopleText, setPeopleText] = useState("");
  const [peopleRating, setPeopleRating] = useState("");

  // Planet
  const [planetText, setPlanetText] = useState("");
  const [planetRating, setPlanetRating] = useState("");

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
        companyText,
        peopleText,
        peopleRating: Number(peopleRating) || null,
        planetText,
        planetRating: Number(planetRating) || null,
        transparencyText,
        transparencyRating: Number(transparencyRating) || null,
        recommend,
        createdAt: Timestamp.now(),
      });
      alert("Post submitted!");

      // clear all states
      setCompanyText("");
      setSelfIdentify("");
      setPeopleText(""); setPeopleRating("");
      setPlanetText(""); setPlanetRating("");
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
          {/* Company Name */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Company Name</h2>
            <label className="block mb-2 text-sm">
              Enter the name of the company you are reviewing:
              <input
                type="text"
                value={companyText}
                onChange={(e) => setCompanyText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
              />
            </label>
          </section>

           {/* Self Identify */}
<section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
  <h2 className="font-semibold mb-2 text-[#3D348B]">Self Identify</h2>
  <label className="block mb-2 text-sm">
    What is your current status at this company?
    <select
      value={selfIdentify}
      onChange={(e) => setSelfIdentify(e.target.value)}
      className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
    >
      <option value="">Select an option</option>
      <option value="currentlyWork">I currently work here</option>
      <option value="usedToWork">I used to work here</option>
      <option value="neverWorked">I have never worked here</option>
    </select>
  </label>

  {/* Follow-up questions — rendered conditionally */}
  {selfIdentify === "currentlyWork" && (
    <div className="mt-3">
      <label className="block mb-2 text-sm">
        When did you start working here?
        <input
          type="month"
          className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
        />
      </label>
    </div>
  )}

  {selfIdentify === "usedToWork" && (
    <div className="mt-3">
      <label className="block mb-2 text-sm">
        When did you start?
        <input
          type="month"
          className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
        />
      </label>
      <label className="block mb-2 text-sm">
        When did you leave?
        <input
          type="month"
          className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
        />
      </label>
    </div>
  )}

  {selfIdentify === "neverWorked" && (
    <div className="mt-3">
      <label className="block mb-2 text-sm">
        Please expand on why you’re reviewing this company:
        <textarea
          className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
          rows={3}
        />
      </label>
    </div>
  )}
</section>
          
          {/* People */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">People</h2>
            <label className="block mb-2 text-sm">
              How do you feel about this company’s culture and ethical treatment of its employees?
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

          {/* Planet */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Planet</h2>
            <label className="block mb-2 text-sm">
              How do you feel about this company’s environmental sustainability and commitment to reducing its impact on the planet?
              <textarea
                value={planetText}
                onChange={(e) => setPlanetText(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-[#44AF69]"
                rows={3}
              />
            </label>
            <label className="block mt-2 text-sm">Rate the company in terms of Planet:</label>
            <RatingRadios value={planetRating} setValue={setPlanetRating} name="planetRating" />
          </section>

          {/* Transparency */}
          <section className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="font-semibold mb-2 text-[#3D348B]">Transparency</h2>
            <label className="block mb-2 text-sm">
              How do you feel about this company’s transparency in its business practices and alignments?
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
