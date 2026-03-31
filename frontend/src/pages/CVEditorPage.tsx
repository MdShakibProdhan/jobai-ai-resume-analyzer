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
      const text: string = res.data?.text || '';
      if (!text) { toast.error('Could not extract text'); setUploading(false); return; }

      // ── Parse text into sections using pattern matching ──
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // Extract contact info from anywhere in text
      const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w+/);
      const phoneMatch = text.match(/[\+]?[\d][\d\s\-().]{6,}\d/);
      const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
      const githubMatch = text.match(/github\.com\/[\w-]+/i);
      const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?!linkedin|github)[\w-]+\.[\w.]+\/?\S*/i);

      // First non-empty line is usually the name
      const nameLine = lines[0] || '';
      const nameParts = nameLine.replace(/[,|•·].*/, '').trim().split(/\s+/);

      store.updatePersonal({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: emailMatch?.[0] || '',
        phone: phoneMatch?.[0]?.trim() || '',
        linkedin: linkedinMatch?.[0] || '',
        github: githubMatch?.[0] || '',
        website: websiteMatch?.[0] || '',
      });

      // Split text into sections by common headings
      const sectionHeaders = /^(professional\s*summary|summary|profile|about\s*me|objective|work\s*experience|experience|employment|education|academic|skills|technical\s*skills|core\s*competencies|projects|personal\s*projects|languages|certifications|certificates|awards|honors|publications|references|interests|hobbies|volunteer|additional)/i;

      const sections: { title: string; content: string[] }[] = [];
      let current: { title: string; content: string[] } | null = null;

      for (const line of lines.slice(1)) { // skip name line
        if (sectionHeaders.test(line) && line.length < 50) {
          if (current) sections.push(current);
          current = { title: line, content: [] };
        } else if (current) {
          current.content.push(line);
        }
      }
      if (current) sections.push(current);

      // Helper to check section type
      const isType = (title: string, ...keywords: string[]) =>
        keywords.some(k => title.toLowerCase().includes(k));

      const datePattern = /(\w{3,9}\s+\d{4}|\d{4})\s*[-–—to]+\s*(\w{3,9}\s+\d{4}|\d{4}|present|current)/i;

      for (const sec of sections) {
        const title = sec.title;
        const content = sec.content;

        if (isType(title, 'summary', 'profile', 'about', 'objective')) {
          store.updateSummary(content.join(' '));
        }
        else if (isType(title, 'experience', 'employment', 'work')) {
          // Group lines into entries (each entry usually starts with a role/company line with a date)
          let entryLines: string[][] = [];
          let buf: string[] = [];
          for (const line of content) {
            if (datePattern.test(line) && buf.length > 0) {
              entryLines.push(buf);
              buf = [];
            }
            buf.push(line);
          }
          if (buf.length) entryLines.push(buf);

          for (const entry of entryLines) {
            store.addExperience();
            const expList = store.cvs[id!]?.experience;
            const last = expList?.[expList.length - 1];
            if (!last) continue;

            const dateLine = entry.find(l => datePattern.test(l)) || '';
            const dm = dateLine.match(datePattern);
            const bullets = entry.filter(l => /^[•\-–▪■*►◆]/.test(l) || /^\d+[.)]\s/.test(l)).map(l => l.replace(/^[•\-–▪■*►◆\d.)]+\s*/, ''));
            const nonBullets = entry.filter(l => !bullets.includes(l) && l !== dateLine);

            store.updateExperience(last.id, {
              role: nonBullets[0]?.replace(datePattern, '').trim() || '',
              company: nonBullets[1]?.replace(datePattern, '').trim() || '',
              startDate: dm?.[1] || '',
              endDate: /present|current/i.test(dm?.[2] || '') ? '' : (dm?.[2] || ''),
              current: /present|current/i.test(dm?.[2] || ''),
              description: bullets.length ? bullets : nonBullets.slice(2),
            });
          }
        }
        else if (isType(title, 'education', 'academic')) {
          let entryLines: string[][] = [];
          let buf: string[] = [];
          for (const line of content) {
            if (datePattern.test(line) && buf.length > 0) {
              entryLines.push(buf);
              buf = [];
            }
            buf.push(line);
          }
          if (buf.length) entryLines.push(buf);

          for (const entry of entryLines) {
            store.addEducation();
            const eduList = store.cvs[id!]?.education;
            const last = eduList?.[eduList.length - 1];
            if (!last) continue;

            const dateLine = entry.find(l => datePattern.test(l)) || '';
            const dm = dateLine.match(datePattern);
            const bullets = entry.filter(l => /^[•\-–▪■*►◆]/.test(l)).map(l => l.replace(/^[•\-–▪■*►◆]+\s*/, ''));
            const nonBullets = entry.filter(l => !bullets.includes(l));

            store.updateEducation(last.id, {
              degree: nonBullets[0]?.replace(datePattern, '').trim() || '',
              institution: nonBullets[1]?.replace(datePattern, '').trim() || '',
              startDate: dm?.[1] || '',
              endDate: dm?.[2] || '',
              description: bullets,
            });
          }
        }
        else if (isType(title, 'skill', 'competenc', 'technical')) {
          // Try to detect "Category: skill1, skill2" pattern
          for (const line of content) {
            const colonSplit = line.split(/:\s*/);
            store.addSkillCategory();
            const skList = store.cvs[id!]?.skills;
            const last = skList?.[skList.length - 1];
            if (last) {
              if (colonSplit.length >= 2) {
                store.updateSkillCategory(last.id, { category: colonSplit[0], skills: colonSplit.slice(1).join(': ') });
              } else {
                store.updateSkillCategory(last.id, { category: 'Skills', skills: line });
              }
            }
          }
        }
        else if (isType(title, 'project')) {
          let entryLines: string[][] = [];
          let buf: string[] = [];
          for (const line of content) {
            // New project entry: line without bullet prefix
            if (!/^[•\-–▪■*►◆]/.test(line) && buf.length > 0) {
              entryLines.push(buf);
              buf = [];
            }
            buf.push(line);
          }
          if (buf.length) entryLines.push(buf);

          for (const entry of entryLines) {
            store.addProject();
            const pList = store.cvs[id!]?.projects;
            const last = pList?.[pList.length - 1];
            if (!last) continue;
            const bullets = entry.filter(l => /^[•\-–▪■*►◆]/.test(l)).map(l => l.replace(/^[•\-–▪■*►◆]+\s*/, ''));
            store.updateProject(last.id, {
              name: entry[0]?.replace(/^[•\-–▪■*►◆]+\s*/, '') || '',
              description: bullets,
            });
          }
        }
        else if (isType(title, 'language')) {
          for (const line of content) {
            const parts = line.split(/[-–—:,]/).map(p => p.trim()).filter(Boolean);
            store.addLanguage();
            const lList = store.cvs[id!]?.languages;
            const last = lList?.[lList.length - 1];
            if (last) store.updateLanguage(last.id, { language: parts[0] || line, proficiency: parts[1] || 'Intermediate' });
          }
        }
        else if (isType(title, 'certif')) {
          for (const line of content) {
            store.addCertification();
            const cList = store.cvs[id!]?.certifications;
            const last = cList?.[cList.length - 1];
            if (last) store.updateCertification(last.id, { name: line });
          }
        }
      }

      // Enable sections that got data
      const updatedCV = store.cvs[id!];
      if (updatedCV) {
        for (const sec of updatedCV.sections) {
          const hasData =
            (sec.type === 'languages' && updatedCV.languages.length > 0) ||
            (sec.type === 'certifications' && updatedCV.certifications.length > 0) ||
            (sec.type === 'projects' && updatedCV.projects.length > 0);
          if (hasData && !sec.visible) store.toggleSection(sec.id);
        }
      }

      toast.success('CV imported! Review and edit the sections.');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed — check your connection');
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
            {uploading ? 'Parsing with AI...' : 'Import CV'}
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
