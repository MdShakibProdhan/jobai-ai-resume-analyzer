import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CVData, PersonalInfo, CVSection, ExperienceItem, EducationItem,
  SkillCategory, ProjectItem, LanguageItem, CertificationItem,
  CustomItem, DEFAULT_SECTIONS, SectionType,
} from '@/types/cv';

const uid = () => crypto.randomUUID();

const blankPersonal: PersonalInfo = {
  firstName: '', lastName: '', title: '', email: '',
  phone: '', location: '', website: '', linkedin: '', github: '',
};

const createBlankCV = (templateId: string): CVData => ({
  id: uid(),
  name: 'Untitled CV',
  templateId,
  personalInfo: { ...blankPersonal },
  sections: DEFAULT_SECTIONS.map(s => ({ ...s, id: uid() })),
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  languages: [],
  certifications: [],
  customSections: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

interface CVStore {
  cvs: Record<string, CVData>;
  currentId: string | null;

  // CV management
  createCV: (templateId: string) => string;
  duplicateCV: (id: string) => string;
  deleteCV: (id: string) => void;
  setCurrent: (id: string | null) => void;
  setTemplate: (templateId: string) => void;
  renameCurrent: (name: string) => void;
  importCVData: (data: Partial<CVData>) => void;

  // Personal info
  updatePersonal: (info: Partial<PersonalInfo>) => void;

  // Sections
  toggleSection: (sectionId: string) => void;
  reorderSections: (from: number, to: number) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  addSection: (type: SectionType) => void;
  removeSection: (sectionId: string) => void;

  // Summary
  updateSummary: (text: string) => void;

  // Experience
  addExperience: () => void;
  updateExperience: (id: string, data: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  addExpBullet: (id: string) => void;
  updateExpBullet: (id: string, idx: number, text: string) => void;
  removeExpBullet: (id: string, idx: number) => void;

  // Education
  addEducation: () => void;
  updateEducation: (id: string, data: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  addEduBullet: (id: string) => void;
  updateEduBullet: (id: string, idx: number, text: string) => void;
  removeEduBullet: (id: string, idx: number) => void;

  // Skills
  addSkillCategory: () => void;
  updateSkillCategory: (id: string, data: Partial<SkillCategory>) => void;
  removeSkillCategory: (id: string) => void;

  // Projects
  addProject: () => void;
  updateProject: (id: string, data: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  addProjBullet: (id: string) => void;
  updateProjBullet: (id: string, idx: number, text: string) => void;
  removeProjBullet: (id: string, idx: number) => void;

  // Languages
  addLanguage: () => void;
  updateLanguage: (id: string, data: Partial<LanguageItem>) => void;
  removeLanguage: (id: string) => void;

  // Certifications
  addCertification: () => void;
  updateCertification: (id: string, data: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;

  // Custom
  addCustomItem: (sectionId: string) => void;
  updateCustomItem: (sectionId: string, id: string, data: Partial<CustomItem>) => void;
  removeCustomItem: (sectionId: string, id: string) => void;
}

const touch = (cv: CVData) => { cv.updatedAt = new Date().toISOString(); };

const getCurrent = (state: { cvs: Record<string, CVData>; currentId: string | null }) => {
  if (!state.currentId) return null;
  return state.cvs[state.currentId] || null;
};

export const useCVStore = create<CVStore>()(
  persist(
    (set, get) => ({
      cvs: {},
      currentId: null,

      createCV: (templateId) => {
        const cv = createBlankCV(templateId);
        set(s => ({ cvs: { ...s.cvs, [cv.id]: cv }, currentId: cv.id }));
        return cv.id;
      },

      duplicateCV: (id) => {
        const src = get().cvs[id];
        if (!src) return id;
        const cv = { ...JSON.parse(JSON.stringify(src)), id: uid(), name: src.name + ' (copy)', createdAt: new Date().toISOString() };
        set(s => ({ cvs: { ...s.cvs, [cv.id]: cv }, currentId: cv.id }));
        return cv.id;
      },

      deleteCV: (id) => set(s => {
        const { [id]: _, ...rest } = s.cvs;
        return { cvs: rest, currentId: s.currentId === id ? null : s.currentId };
      }),

      setCurrent: (id) => set({ currentId: id }),

      setTemplate: (templateId) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        touch(cv);
        cv.templateId = templateId;
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      renameCurrent: (name) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        touch(cv);
        cv.name = name;
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      importCVData: (data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        Object.assign(cv, data);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Personal
      updatePersonal: (info) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.personalInfo = { ...cv.personalInfo, ...info };
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Sections
      toggleSection: (sectionId) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.sections = cv.sections.map(sec =>
          sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
        );
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      reorderSections: (from, to) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        const arr = [...cv.sections];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        cv.sections = arr;
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      updateSectionTitle: (sectionId, title) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.sections = cv.sections.map(sec =>
          sec.id === sectionId ? { ...sec, title } : sec
        );
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      addSection: (type) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        const section: CVSection = { id: uid(), type, title: type === 'custom' ? 'Custom Section' : '', visible: true };
        cv.sections = [...cv.sections, section];
        if (type === 'custom') cv.customSections[section.id] = [];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      removeSection: (sectionId) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.sections = cv.sections.filter(sec => sec.id !== sectionId);
        delete cv.customSections[sectionId];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Summary
      updateSummary: (text) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.summary = text;
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Experience
      addExperience: () => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.experience = [...cv.experience, { id: uid(), role: '', company: '', location: '', startDate: '', endDate: '', current: false, description: [''] }];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateExperience: (id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.experience = cv.experience.map(e => e.id === id ? { ...e, ...data } : e);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeExperience: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.experience = cv.experience.filter(e => e.id !== id);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      addExpBullet: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.experience = cv.experience.map(e => e.id === id ? { ...e, description: [...e.description, ''] } : e);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateExpBullet: (id, idx, text) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.experience = cv.experience.map(e => {
          if (e.id !== id) return e;
          const desc = [...e.description];
          desc[idx] = text;
          return { ...e, description: desc };
        });
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeExpBullet: (id, idx) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.experience = cv.experience.map(e => {
          if (e.id !== id) return e;
          return { ...e, description: e.description.filter((_, i) => i !== idx) };
        });
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Education
      addEducation: () => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.education = [...cv.education, { id: uid(), degree: '', institution: '', location: '', startDate: '', endDate: '', gpa: '', description: [''] }];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateEducation: (id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.education = cv.education.map(e => e.id === id ? { ...e, ...data } : e);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeEducation: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.education = cv.education.filter(e => e.id !== id);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      addEduBullet: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.education = cv.education.map(e => e.id === id ? { ...e, description: [...e.description, ''] } : e);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateEduBullet: (id, idx, text) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.education = cv.education.map(e => {
          if (e.id !== id) return e;
          const desc = [...e.description];
          desc[idx] = text;
          return { ...e, description: desc };
        });
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeEduBullet: (id, idx) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.education = cv.education.map(e => {
          if (e.id !== id) return e;
          return { ...e, description: e.description.filter((_, i) => i !== idx) };
        });
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Skills
      addSkillCategory: () => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.skills = [...cv.skills, { id: uid(), category: '', skills: '' }];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateSkillCategory: (id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.skills = cv.skills.map(sk => sk.id === id ? { ...sk, ...data } : sk);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeSkillCategory: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.skills = cv.skills.filter(sk => sk.id !== id);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Projects
      addProject: () => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.projects = [...cv.projects, { id: uid(), name: '', subtitle: '', url: '', description: [''] }];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateProject: (id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.projects = cv.projects.map(p => p.id === id ? { ...p, ...data } : p);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeProject: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.projects = cv.projects.filter(p => p.id !== id);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      addProjBullet: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.projects = cv.projects.map(p => p.id === id ? { ...p, description: [...p.description, ''] } : p);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateProjBullet: (id, idx, text) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.projects = cv.projects.map(p => {
          if (p.id !== id) return p;
          const desc = [...p.description];
          desc[idx] = text;
          return { ...p, description: desc };
        });
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeProjBullet: (id, idx) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.projects = cv.projects.map(p => {
          if (p.id !== id) return p;
          return { ...p, description: p.description.filter((_, i) => i !== idx) };
        });
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Languages
      addLanguage: () => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.languages = [...cv.languages, { id: uid(), language: '', proficiency: 'Intermediate' }];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateLanguage: (id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.languages = cv.languages.map(l => l.id === id ? { ...l, ...data } : l);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeLanguage: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.languages = cv.languages.filter(l => l.id !== id);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Certifications
      addCertification: () => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.certifications = [...cv.certifications, { id: uid(), name: '', issuer: '', date: '' }];
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateCertification: (id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.certifications = cv.certifications.map(c => c.id === id ? { ...c, ...data } : c);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeCertification: (id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.certifications = cv.certifications.filter(c => c.id !== id);
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),

      // Custom sections
      addCustomItem: (sectionId) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        const items = cv.customSections[sectionId] || [];
        cv.customSections = { ...cv.customSections, [sectionId]: [...items, { id: uid(), title: '', subtitle: '', date: '', description: [''] }] };
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      updateCustomItem: (sectionId, id, data) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        const items = (cv.customSections[sectionId] || []).map(it => it.id === id ? { ...it, ...data } : it);
        cv.customSections = { ...cv.customSections, [sectionId]: items };
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
      removeCustomItem: (sectionId, id) => set(s => {
        const cv = getCurrent(s);
        if (!cv) return s;
        cv.customSections = { ...cv.customSections, [sectionId]: (cv.customSections[sectionId] || []).filter(it => it.id !== id) };
        touch(cv);
        return { cvs: { ...s.cvs, [cv.id]: { ...cv } } };
      }),
    }),
    { name: 'jobai-cvs' }
  )
);
