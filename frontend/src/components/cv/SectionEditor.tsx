import { useState } from 'react';
import { useCVStore } from '@/store/cvStore';
import { CVSection, SectionType } from '@/types/cv';
import { ChevronDown, ChevronUp, GripVertical, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react';

/* ── tiny helpers ───────────────────────────────────────── */
const Input = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="mb-2">
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const BulletEditor = ({ items, onUpdate, onAdd, onRemove }: { items: string[]; onUpdate: (i: number, t: string) => void; onAdd: () => void; onRemove: (i: number) => void }) => (
  <div className="mt-1">
    {items.map((b, i) => (
      <div key={i} className="flex gap-1 mb-1 items-start">
        <span className="text-gray-400 mt-1.5 text-xs">•</span>
        <input className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm" value={b} onChange={e => onUpdate(i, e.target.value)} placeholder="Bullet point..." />
        <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 mt-1"><X className="h-3.5 w-3.5" /></button>
      </div>
    ))}
    <button onClick={onAdd} className="text-xs text-brand-600 hover:underline mt-1 flex items-center gap-1"><Plus className="h-3 w-3" /> Add bullet</button>
  </div>
);

const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-gray-300" />
    {label}
  </label>
);

/* ── Personal Info ──────────────────────────────────────── */
export const PersonalInfoEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const update = useCVStore(s => s.updatePersonal);
  if (!cv) return null;
  const p = cv.personalInfo;

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-2">
        <Input label="First Name" value={p.firstName} onChange={v => update({ firstName: v })} placeholder="John" />
        <Input label="Last Name" value={p.lastName} onChange={v => update({ lastName: v })} placeholder="Doe" />
      </div>
      <Input label="Job Title" value={p.title} onChange={v => update({ title: v })} placeholder="Software Engineer" />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Email" value={p.email} onChange={v => update({ email: v })} placeholder="john@example.com" />
        <Input label="Phone" value={p.phone} onChange={v => update({ phone: v })} placeholder="+1 234 567 890" />
      </div>
      <Input label="Location" value={p.location} onChange={v => update({ location: v })} placeholder="New York, NY" />
      <Input label="LinkedIn" value={p.linkedin} onChange={v => update({ linkedin: v })} placeholder="linkedin.com/in/johndoe" />
      <Input label="GitHub" value={p.github} onChange={v => update({ github: v })} placeholder="github.com/johndoe" />
      <Input label="Website" value={p.website} onChange={v => update({ website: v })} placeholder="johndoe.com" />
    </div>
  );
};

/* ── Section content editors ─────────────────────────────── */
const SummaryEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const updateSummary = useCVStore(s => s.updateSummary);
  return (
    <textarea
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
      rows={4}
      value={cv?.summary || ''}
      onChange={e => updateSummary(e.target.value)}
      placeholder="A brief professional summary..."
    />
  );
};

const ExperienceEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const store = useCVStore();
  if (!cv) return null;
  return (
    <div className="space-y-3">
      {cv.experience.map(e => (
        <div key={e.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-500">{e.role || 'New Position'}</span>
            <button onClick={() => store.removeExperience(e.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Job Title" value={e.role} onChange={v => store.updateExperience(e.id, { role: v })} />
            <Input label="Company" value={e.company} onChange={v => store.updateExperience(e.id, { company: v })} />
            <Input label="Location" value={e.location} onChange={v => store.updateExperience(e.id, { location: v })} />
            <Input label="Start Date" value={e.startDate} onChange={v => store.updateExperience(e.id, { startDate: v })} placeholder="Jan 2023" />
          </div>
          <div className="flex items-center gap-4 mt-1">
            <Checkbox label="Currently working here" checked={e.current} onChange={v => store.updateExperience(e.id, { current: v })} />
            {!e.current && <div className="flex-1"><Input label="End Date" value={e.endDate} onChange={v => store.updateExperience(e.id, { endDate: v })} placeholder="Dec 2024" /></div>}
          </div>
          <label className="block text-xs font-medium text-gray-500 mt-2 mb-1">Key Achievements</label>
          <BulletEditor items={e.description} onUpdate={(i, t) => store.updateExpBullet(e.id, i, t)} onAdd={() => store.addExpBullet(e.id)} onRemove={i => store.removeExpBullet(e.id, i)} />
        </div>
      ))}
      <button onClick={() => store.addExperience()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add Experience
      </button>
    </div>
  );
};

const EducationEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const store = useCVStore();
  if (!cv) return null;
  return (
    <div className="space-y-3">
      {cv.education.map(e => (
        <div key={e.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-500">{e.degree || 'New Education'}</span>
            <button onClick={() => store.removeEducation(e.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Degree" value={e.degree} onChange={v => store.updateEducation(e.id, { degree: v })} />
            <Input label="Institution" value={e.institution} onChange={v => store.updateEducation(e.id, { institution: v })} />
            <Input label="Location" value={e.location} onChange={v => store.updateEducation(e.id, { location: v })} />
            <Input label="GPA" value={e.gpa} onChange={v => store.updateEducation(e.id, { gpa: v })} placeholder="3.8/4.0" />
            <Input label="Start Date" value={e.startDate} onChange={v => store.updateEducation(e.id, { startDate: v })} placeholder="2019" />
            <Input label="End Date" value={e.endDate} onChange={v => store.updateEducation(e.id, { endDate: v })} placeholder="2023" />
          </div>
          <label className="block text-xs font-medium text-gray-500 mt-2 mb-1">Details</label>
          <BulletEditor items={e.description} onUpdate={(i, t) => store.updateEduBullet(e.id, i, t)} onAdd={() => store.addEduBullet(e.id)} onRemove={i => store.removeEduBullet(e.id, i)} />
        </div>
      ))}
      <button onClick={() => store.addEducation()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add Education
      </button>
    </div>
  );
};

const SkillsEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const store = useCVStore();
  if (!cv) return null;
  return (
    <div className="space-y-3">
      {cv.skills.map(sk => (
        <div key={sk.id} className="flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Input label="Category" value={sk.category} onChange={v => store.updateSkillCategory(sk.id, { category: v })} placeholder="Programming" />
            <Input label="Skills (comma separated)" value={sk.skills} onChange={v => store.updateSkillCategory(sk.id, { skills: v })} placeholder="React, TypeScript..." />
          </div>
          <button onClick={() => store.removeSkillCategory(sk.id)} className="text-gray-400 hover:text-red-500 mt-5"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button onClick={() => store.addSkillCategory()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add Skill Category
      </button>
    </div>
  );
};

const ProjectsEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const store = useCVStore();
  if (!cv) return null;
  return (
    <div className="space-y-3">
      {cv.projects.map(p => (
        <div key={p.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-gray-500">{p.name || 'New Project'}</span>
            <button onClick={() => store.removeProject(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Project Name" value={p.name} onChange={v => store.updateProject(p.id, { name: v })} />
            <Input label="Subtitle / Tech" value={p.subtitle} onChange={v => store.updateProject(p.id, { subtitle: v })} />
          </div>
          <Input label="URL" value={p.url} onChange={v => store.updateProject(p.id, { url: v })} placeholder="https://..." />
          <label className="block text-xs font-medium text-gray-500 mt-1 mb-1">Description</label>
          <BulletEditor items={p.description} onUpdate={(i, t) => store.updateProjBullet(p.id, i, t)} onAdd={() => store.addProjBullet(p.id)} onRemove={i => store.removeProjBullet(p.id, i)} />
        </div>
      ))}
      <button onClick={() => store.addProject()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add Project
      </button>
    </div>
  );
};

const LanguagesEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const store = useCVStore();
  if (!cv) return null;
  const levels = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic'];
  return (
    <div className="space-y-2">
      {cv.languages.map(l => (
        <div key={l.id} className="flex gap-2 items-end">
          <div className="flex-1"><Input label="Language" value={l.language} onChange={v => store.updateLanguage(l.id, { language: v })} /></div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Level</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={l.proficiency} onChange={e => store.updateLanguage(l.id, { proficiency: e.target.value })}>
              {levels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
            </select>
          </div>
          <button onClick={() => store.removeLanguage(l.id)} className="text-gray-400 hover:text-red-500 mb-1"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button onClick={() => store.addLanguage()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add Language
      </button>
    </div>
  );
};

const CertificationsEditor = () => {
  const cv = useCVStore(s => s.cvs[s.currentId!]);
  const store = useCVStore();
  if (!cv) return null;
  return (
    <div className="space-y-3">
      {cv.certifications.map(c => (
        <div key={c.id} className="flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <Input label="Name" value={c.name} onChange={v => store.updateCertification(c.id, { name: v })} />
            <Input label="Issuer" value={c.issuer} onChange={v => store.updateCertification(c.id, { issuer: v })} />
            <Input label="Date" value={c.date} onChange={v => store.updateCertification(c.id, { date: v })} placeholder="2024" />
          </div>
          <button onClick={() => store.removeCertification(c.id)} className="text-gray-400 hover:text-red-500 mt-5"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button onClick={() => store.addCertification()} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1">
        <Plus className="h-4 w-4" /> Add Certification
      </button>
    </div>
  );
};

/* ── Section editor map ──────────────────────────────────── */
const editorMap: Record<SectionType, React.FC> = {
  summary: SummaryEditor,
  experience: ExperienceEditor,
  education: EducationEditor,
  skills: SkillsEditor,
  projects: ProjectsEditor,
  languages: LanguagesEditor,
  certifications: CertificationsEditor,
  custom: () => null, // handled inline
};

/* ── Collapsible section wrapper with drag handle ────────── */
interface SectionWrapperProps {
  section: CVSection;
  index: number;
  onDragStart: (i: number) => void;
  onDragOver: (i: number) => void;
  onDragEnd: () => void;
}

export const SectionWrapper = ({ section, index, onDragStart, onDragOver, onDragEnd }: SectionWrapperProps) => {
  const [open, setOpen] = useState(true);
  const store = useCVStore();
  const Editor = editorMap[section.type];

  return (
    <div
      className="border border-gray-200 rounded-xl bg-white overflow-hidden"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={e => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-gray-400 shrink-0" />
        <button onClick={() => setOpen(!open)} className="flex-1 flex items-center gap-2 text-left">
          <span className="text-sm font-semibold text-gray-700 flex-1">{section.title}</span>
          {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        <button onClick={() => store.toggleSection(section.id)} className="text-gray-400 hover:text-gray-600" title={section.visible ? 'Hide' : 'Show'}>
          {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="px-3 py-3">
          <div className="mb-2">
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium"
              value={section.title}
              onChange={e => store.updateSectionTitle(section.id, e.target.value)}
              placeholder="Section title"
            />
          </div>
          <Editor />
        </div>
      )}
    </div>
  );
};
