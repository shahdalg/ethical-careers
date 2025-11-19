/**
 * Format company names with proper capitalization
 * Handles common patterns like "google" -> "Google", "ibm" -> "IBM"
 */
export function formatCompanyName(name: string | undefined | null): string {
  if (!name) return "Unknown Company";
  
  // List of known acronyms that should be all caps
  const acronyms = new Set([
    'IBM', 'HP', 'SAP', 'AWS', 'NASA', 'FBI', 'CIA', 'NSA', 'NVIDIA',
    'AMD', 'AT&T', 'BMW', 'CNN', 'BBC', 'NFL', 'NBA', 'MLB', 'NHL',
    'IKEA', 'HSBC', 'UPS', 'FedEx', 'API', 'USA', 'UK', 'EU', 'UN',
    'MIT', 'UCLA', 'USC', 'NYU', 'KPMG', 'PwC', 'EY', 'GM', 'GE',
    'J&J', 'P&G', 'M&M', 'R&D', 'IT', 'AI', 'ML', 'AR', 'VR'
  ]);

  // Words that should be lowercase (unless first word)
  const lowercaseWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in',
    'nor', 'of', 'on', 'or', 'the', 'to', 'with', 'via', 'per'
  ]);

  // Clean up the input
  const cleaned = name.trim();
  
  // Check if it's a known acronym
  const upper = cleaned.toUpperCase();
  if (acronyms.has(upper)) {
    return upper;
  }

  // Split on spaces, hyphens, and preserve them
  const parts = cleaned.split(/(\s+|-)/);
  
  const formatted = parts.map((part, index) => {
    // Keep whitespace and hyphens as-is
    if (/^\s+$/.test(part) || part === '-') {
      return part;
    }

    const upperPart = part.toUpperCase();
    
    // Check if it's an acronym
    if (acronyms.has(upperPart)) {
      return upperPart;
    }

    // Check if it should be lowercase (but not if it's the first word)
    if (index > 0 && lowercaseWords.has(part.toLowerCase())) {
      return part.toLowerCase();
    }

    // Standard title case: capitalize first letter, lowercase rest
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  });

  return formatted.join('');
}
