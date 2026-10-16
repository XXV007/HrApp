export type Candidate = {
  id: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  current_title?: string;
  current_company?: string;
  role?: string;
  seniority?: string;
  years_experience?: number;
  location?: { city?: string; state?: string; country?: string };
  open_to_work?: boolean;
  skills?: string[];
  experiences?: Experience[];
  education?: Education[];
  languages?: string[];
  [key: string]: unknown;
};
export type Experience = {
  title?: string;
  company?: string;
  company_type?: string;
  start_year?: number;
  end_year?: number | null;
  description?: string;
};
export type Education = {
  school?: string;
  degree?: string;
  field?: string;
  [key: string]: unknown;
};
export type SearchFilters = {
  role?: string;
  city?: string;
  skill?: string[];
  seniority?: string;
  open_to_work?: boolean;
  company_type?: string;
  education?: string;
  school?: string;
  language?: string;
};
export type SearchResult = {
  id: string;
  candidate: Candidate;
  score: number;
  highlights: string[];
};
