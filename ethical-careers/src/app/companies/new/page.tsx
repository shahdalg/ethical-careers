"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCompany } from "@/lib/addCompany";
import Navbar from "@/app/components/page";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a company name");
      return;
    }

    try {
      setLoading(true);
      // Add to Firestore
      const slug = await addCompany(name, description, industry);

      alert("Company added successfully!");
      // Redirect user to that company’s review page
      router.push(`/companies/${slug}/review`);
    } catch (error) {
      console.error("Error adding company:", error);
      alert("There was an error adding the company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-gray-50 text-gray-800 min-h-screen">
      <Navbar />

      <div className="p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#3D348B" }}>
          Add a New Company
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-medium">
            Company Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1"
              placeholder="e.g. Patagonia"
            />
          </label>

          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1"
              placeholder="Briefly describe this company..."
              rows={3}
            />
          </label>

          <label className="block text-sm font-medium">
            Industry
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded mt-1"
              placeholder="e.g. Apparel, Technology, Energy"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="text-white px-4 py-2 rounded hover:opacity-90 mt-4 shadow-sm disabled:opacity-70"
            style={{ backgroundColor: "#3D348B" }}
          >
            {loading ? "Adding..." : "Add Company"}
          </button>
        </form>
      </div>
    </main>
  );
}
