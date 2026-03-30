import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCVStore } from '@/store/cvStore';
import { TEMPLATES, TemplateId } from '@/types/cv';
import { templateMap } from '@/components/cv/templates';
import { PersonalInfoEditor, SectionWrapper } from '@/components/cv/SectionEditor';
import { exportPDF, exportDOCX } from '@/components/cv/exportUtils';
import { ArrowLeft, Download, FileText, User, Palette, Plus, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resumeApi } from '@/lib/api';

export const CVEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useCVStore();
  const cv = id ? store.cvs[id] : null;
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'sections' | 'template'>('personal');
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id && !cv) navigate('/cv-builder');
    if (id) store.setCurrent(id);
  }, [id]);

  if (!cv) return null;

  const Template = templateMap[(cv.templateId || 'classic') as TemplateId] || templateMap.classic;

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      await exportPDF(previewRef.current, cv.name || 'cv');
      toast.success('PDF downloaded!');
    } catch { toast.error('Export failed'); }
    setExporting(false);
  };

  const handleExportDOCX = async () => {
    setExporting(true);
    try {
      await exportDOCX(cv, cv.name || 'cv');
      toast.success('DOCX downloaded!');
    } catch { toast.error('Export failed'); }
    setExporting(false);
  };

  const handleUploadCV = async (file: File) => {
    setUploading(true);
    try {
      const res = await resumeApi.parse(file);
      const d = res.data;
      if (!d || (!d.firstName && !d.email)) {
        toast.error('Could not parse CV');
        setUploading(false);
        return;
      }

      // Populate personal info
      store.updatePersonal({
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        title: d.title || '',
        email: d.email || '',
        phone: d.phone || '',
        location: d.location || '',
        website: d.website || '',
        linkedin: d.linkedin || '',
        github: d.github || '',
      });

      // Summary
      if (d.summary) store.updateSummary(d.summary);

      // Experience
      if (Array.isArray(d.experience)) {
        for (const e of d.experience) {
          store.addExperience();
          const expList = store.cvs[id!]?.experience;
          const last = expList?.[expList.length - 1];
          if (last) {
            store.updateExperience(last.id, {
              role: e.role || '', company: e.company || '', location: e.location || '',
              startDate: e.startDate || '', endDate: e.endDate || '', current: e.current || false,
              description: Array.isArray(e.description) ? e.description : [],
            });
          }
        }
      }

      // Education
      if (Array.isArray(d.education)) {
        for (const e of d.education) {
          store.addEducation();
          const eduList = store.cvs[id!]?.education;
          const last = eduList?.[eduList.length - 1];
          if (last) {
            store.updateEducation(last.id, {
              degree: e.degree || '', institution: e.institution || '', location: e.location || '',
              startDate: e.startDate || '', endDate: e.endDate || '', gpa: e.gpa || '',
              description: Array.isArray(e.description) ? e.description : [],
            });
          }
        }
      }

      // Skills
      if (Array.isArray(d.skills)) {
        for (const sk of d.skills) {
          store.addSkillCategory();
          const skList = store.cvs[id!]?.skills;
          const last = skList?.[skList.length - 1];
          if (last) store.updateSkillCategory(last.id, { category: sk.category || '', skills: sk.skills || '' });
        }
      }

      // Projects
      if (Array.isArray(d.projects)) {
        for (const p of d.projects) {
          store.addProject();
          const pList = store.cvs[id!]?.projects;
          const last = pList?.[pList.length - 1];
          if (last) store.updateProject(last.id, {
            name: p.name || '', subtitle: p.subtitle || '', url: p.url || '',
            description: Array.isArray(p.description) ? p.description : [],
          });
        }
      }

      // Languages
      if (Array.isArray(d.languages)) {
        for (const l of d.languages) {
          store.addLanguage();
          const lList = store.cvs[id!]?.languages;
          const last = lList?.[lList.length - 1];
          if (last) store.updateLanguage(last.id, { language: l.language || '', proficiency: l.proficiency || 'Intermediate' });
        }
      }

      // Certifications
      if (Array.isArray(d.certifications)) {
        for (const c of d.certifications) {
          store.addCertification();
          const cList = store.cvs[id!]?.certifications;
          const last = cList?.[cList.length - 1];
          if (last) store.updateCertification(last.id, { name: c.name || '', issuer: c.issuer || '', date: c.date || '' });
        }
      }

      // Enable sections that have data
      const cv = store.cvs[id!];
      if (cv) {
        for (const sec of cv.sections) {
          const hasData =
            (sec.type === 'languages' && cv.languages.length > 0) ||
            (sec.type === 'certifications' && cv.certifications.length > 0);
          if (hasData && !sec.visible) store.toggleSection(sec.id);
        }
      }

      toast.success('CV imported! Review and edit the sections.');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const handleDragStart = (idx: number) => setDragFrom(idx);
  const handleDragOver = (idx: number) => {
    if (dragFrom === null || dragFrom === idx) return;
    store.reorderSections(dragFrom, idx);
    setDragFrom(idx);
  };
  const handleDragEnd = () => setDragFrom(null);

  const tabs = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'sections', label: 'Sections', icon: FileText },
    { key: 'template', label: 'Template', icon: Palette },
  ] as const;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cv-builder')} className="text-gray-500 hover:text-gray-700"><ArrowLeft className="h-5 w-5" /></button>
          <input
            className="text-sm font-semibold text-gray-800 border-none bg-transparent focus:outline-none focus:ring-0 w-48"
            value={cv.name}
            onChange={e => store.renameCurrent(e.target.value)}
            placeholder="CV Name"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition-colors">
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Uploading...' : 'Import CV'}
            <input type="file" accept=".pdf,.docx" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUploadCV(e.target.files[0]); }} />
          </label>
          <button onClick={handleExportDOCX} disabled={exporting} className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Download className="h-3.5 w-3.5" /> DOCX
          </button>
          <button onClick={handleExportPDF} disabled={exporting} className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
            <Download className="h-3.5 w-3.5" /> {exporting ? 'Exporting...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Editor */}
        <div className="w-[380px] shrink-0 border-r border-gray-200 flex flex-col bg-white">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 shrink-0">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'personal' && <PersonalInfoEditor />}

            {activeTab === 'sections' && (
              <>
                {cv.sections.map((section, i) => (
                  <SectionWrapper
                    key={section.id}
                    section={section}
                    index={i}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  />
                ))}
                <button
                  onClick={() => store.addSection('custom')}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 flex items-center justify-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Custom Section
                </button>
              </>
            )}

            {activeTab === 'template' && (
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => store.setTemplate(t.id)}
                    className={`border-2 rounded-xl overflow-hidden transition-all ${cv.templateId === t.id ? 'border-brand-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="h-24 overflow-hidden bg-white">
                      <div style={{ transform: 'scale(0.2)', transformOrigin: 'top left', width: '794px', pointerEvents: 'none' }}>
                        {(() => { const T = templateMap[t.id as TemplateId]; return <T data={{ ...cv, templateId: t.id }} />; })()}
                      </div>
                    </div>
                    <div className="p-2 border-t border-gray-100 text-center">
                      <span className="text-xs font-medium text-gray-700">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 bg-gray-100 overflow-auto flex justify-center p-6">
          <div className="bg-white shadow-xl" style={{ width: '794px', minHeight: '1123px' }}>
            <div ref={previewRef}>
              <Template data={cv} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
