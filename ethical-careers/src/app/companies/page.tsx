'use client';

import { useState } from 'react';
import Link from 'next/link';

// Sample company data type
interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  rating: number;
}

// Sample companies data (in a real app, this would come from an API/database)
const sampleCompanies: Company[] = [
  {
    id: '1',
    name: 'EcoTech Solutions',
    industry: 'Renewable Energy',
    description: 'Leading provider of sustainable energy solutions',
    rating: 4.5
  },
  {
    id: '2',
    name: 'Green Innovations',
    industry: 'Environmental Technology',
    description: 'Developing eco-friendly technologies',
    rating: 4.2
  },
  // Add more companies as needed
];

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const filteredCompanies = sampleCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !industryFilter || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Ethical Companies Directory</h1>
      
      {/* Search and Filter Section */}
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
          <option value="Renewable Energy">Renewable Energy</option>
          <option value="Environmental Technology">Environmental Technology</option>
          {/* Add more industry options */}
        </select>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(company => (
          <Link
            href={`/companies/${company.id}`}
            key={company.id}
            className="block p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{company.name}</h2>
            <p className="text-gray-600 mb-2">{company.industry}</p>
            <p className="text-sm text-gray-500 mb-4">{company.description}</p>
            <div className="flex items-center">
              <span className="text-yellow-500">★</span>
              <span className="ml-1">{company.rating.toFixed(1)}</span>
            </div>
          </Link>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          No companies found matching your criteria.
        </p>
      )}
    </main>
  );
}