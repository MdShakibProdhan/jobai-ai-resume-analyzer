export interface PersonalInfo {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'languages'
  | 'certifications'
  | 'custom';

export interface CVSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string[];
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  description: string[];
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface CustomItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string[];
}

export interface CVData {
  id: string;
  name: string;
  templateId: string;
  personalInfo: PersonalInfo;
  sections: CVSection[];
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
  customSections: Record<string, CustomItem[]>;
  createdAt: string;
  updatedAt: string;
}

export const SECTION_LABELS: Record<SectionType, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  languages: 'Languages',
  certifications: 'Certifications',
  custom: 'Custom Section',
};

export const DEFAULT_SECTIONS: CVSection[] = [
  { id: 's1', type: 'summary', title: 'Professional Summary', visible: true },
  { id: 's2', type: 'experience', title: 'Work Experience', visible: true },
  { id: 's3', type: 'education', title: 'Education', visible: true },
  { id: 's4', type: 'skills', title: 'Skills', visible: true },
  { id: 's5', type: 'projects', title: 'Projects', visible: true },
  { id: 's6', type: 'languages', title: 'Languages', visible: false },
  { id: 's7', type: 'certifications', title: 'Certifications', visible: false },
];

export const TEMPLATES = [
  { id: 'classic', name: 'Classic', description: 'Traditional and timeless', color: '#374151' },
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary', color: '#2563eb' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant', color: '#6b7280' },
  { id: 'professional', name: 'Professional', description: 'Corporate and structured', color: '#1e3a5f' },
  { id: 'creative', name: 'Creative', description: 'Bold two-column layout', color: '#0d9488' },
  { id: 'elegant', name: 'Elegant', description: 'Refined and sophisticated', color: '#92400e' },
] as const;

export type TemplateId = typeof TEMPLATES[number]['id'];
