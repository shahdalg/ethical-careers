/**
 * Format company names with proper capitalization
 * Handles common patterns like "google" -> "Google", "ibm" -> "IBM"
 * Preserves mixed case like "SpaceX", "LinkedIn", "YouTube"
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

  // Known mixed-case brand names
  const mixedCaseBrands = new Map([
    ['spacex', 'SpaceX'],
    ['linkedin', 'LinkedIn'],
    ['youtube', 'YouTube'],
    ['paypal', 'PayPal'],
    ['iphone', 'iPhone'],
    ['ipad', 'iPad'],
    ['imac', 'iMac'],
    ['macbook', 'MacBook'],
    ['deloitte', 'Deloitte'],
    ['accenture', 'Accenture'],
    ['salesforce', 'Salesforce'],
    ['servicenow', 'ServiceNow'],
    ['linkedin', 'LinkedIn'],
    ['mckinsey & company', 'McKinsey & Company'],
    ['mckinsey and company', 'McKinsey & Company'],
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

  // Check if it's a known mixed-case brand
  const lower = cleaned.toLowerCase();
  if (mixedCaseBrands.has(lower)) {
    return mixedCaseBrands.get(lower)!;
  }

  // Check if the name has mixed case (e.g., "SpaceX", "LinkedIn")
  // If it has uppercase letters after the first character, preserve it
  const hasInternalCaps = /[a-z][A-Z]/.test(cleaned);
  if (hasInternalCaps) {
    // Just capitalize the first letter if it isn't already
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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
