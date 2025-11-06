"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Button from "@/components/Button";
import { withAuth } from "@/lib/withAuth";

interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  averageRating?: number;
}

function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const snapshot = await getDocs(collection(db, "companies"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !industryFilter || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading companies...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#3D348B]">Company Reviews</h1>
        <Link href="/companies/new">
          <Button style={{ backgroundColor: "#3D348B" }}>
            Submit New Company
          </Button>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search companies..."
          className="p-2 border rounded w-full max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="p-2 border rounded"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="">All Industries</option>
          {[...new Set(companies.map((c) => c.industry))].map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Link
            href={`/companies/${encodeURIComponent(company.id)}`}
            key={company.id}
            className="block p-6 border rounded-lg bg-white hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{company.name}</h2>
            <p className="text-gray-600 mb-2">{company.industry}</p>
            <p className="text-sm text-gray-500 mb-4">{company.description}</p>
            {company.averageRating && (
              <div className="flex items-center">
                <span className="text-yellow-500">★</span>
                <span className="ml-1">{company.averageRating.toFixed(1)}</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No companies found matching your criteria.</p>
      )}
      
    </main>
    
  );
  
}

export default withAuth(CompaniesPage);
