export type DegreeLevel = "undergraduate" | "masters" | "phd" | "any";

export interface Scholarship {
  id: string;
  title: string;
  country: string;
  field: string;
  degree_level: DegreeLevel;
  deadline: string; // ISO date string
  link: string;
  description: string | null;
  eligibility: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  countries: string[];
  fields: string[];
  degree_levels: DegreeLevel[];
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
