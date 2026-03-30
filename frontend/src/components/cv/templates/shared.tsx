import { CVData, CVSection } from '@/types/cv';

export interface TemplateProps {
  data: CVData;
}

export const fullName = (d: CVData) =>
  [d.personalInfo.firstName, d.personalInfo.lastName].filter(Boolean).join(' ') || 'Your Name';

export const contactLine = (d: CVData) =>
  [d.personalInfo.email, d.personalInfo.phone, d.personalInfo.location]
    .filter(Boolean);

export const linksLine = (d: CVData) =>
  [d.personalInfo.linkedin, d.personalInfo.github, d.personalInfo.website]
    .filter(Boolean);

export const visibleSections = (d: CVData) =>
  d.sections.filter(s => s.visible);

export const hasContent = (d: CVData, s: CVSection): boolean => {
  switch (s.type) {
    case 'summary': return !!d.summary;
    case 'experience': return d.experience.length > 0;
    case 'education': return d.education.length > 0;
    case 'skills': return d.skills.length > 0;
    case 'projects': return d.projects.length > 0;
    case 'languages': return d.languages.length > 0;
    case 'certifications': return d.certifications.length > 0;
    case 'custom': return (d.customSections[s.id] || []).length > 0;
    default: return false;
  }
};

export const dateRange = (start: string, end: string, current?: boolean) => {
  if (!start && !end) return '';
  if (current) return `${start} — Present`;
  if (start && end) return `${start} — ${end}`;
  return start || end;
};

export const Bullets = ({ items, style }: { items: string[]; style?: React.CSSProperties }) => (
  <ul style={{ margin: '2px 0 0 16px', padding: 0, listStyle: 'disc', ...style }}>
    {items.filter(Boolean).map((b, i) => <li key={i} style={{ marginBottom: 1, lineHeight: 1.4 }}>{b}</li>)}
  </ul>
);
