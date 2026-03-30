import { useNavigate } from 'react-router-dom';
import { useCVStore } from '@/store/cvStore';
import { TEMPLATES, TemplateId } from '@/types/cv';
import { templateMap } from '@/components/cv/templates';
import { Plus, Trash2, Copy, FileText } from 'lucide-react';

// Tiny sample data for template previews
const sampleData: any = {
  id: 'preview', name: '', templateId: 'classic',
  personalInfo: { firstName: 'John', lastName: 'Doe', title: 'Software Engineer', email: 'john@email.com', phone: '+1 234 567', location: 'New York', website: '', linkedin: 'linkedin.com/in/john', github: '' },
  sections: [
    { id: '1', type: 'summary', title: 'Summary', visible: true },
    { id: '2', type: 'experience', title: 'Experience', visible: true },
    { id: '3', type: 'skills', title: 'Skills', visible: true },
  ],
  summary: 'Experienced software engineer with 5+ years building scalable web applications.',
  experience: [{ id: 'e1', role: 'Senior Developer', company: 'Tech Corp', location: 'NYC', startDate: '2021', endDate: '', current: true, description: ['Led team of 5 engineers', 'Increased performance by 40%'] }],
  education: [], skills: [{ id: 'sk1', category: 'Frontend', skills: 'React, TypeScript, Tailwind' }],
  projects: [], languages: [], certifications: [], customSections: {},
};

export const CVBuilderPage = () => {
  const navigate = useNavigate();
  const { cvs, createCV, deleteCV, duplicateCV, setCurrent } = useCVStore();
  const savedCVs = Object.values(cvs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const handleCreate = (templateId: string) => {
    const id = createCV(templateId);
    navigate(`/cv-editor/${id}`);
  };

  const handleOpen = (id: string) => {
    setCurrent(id);
    navigate(`/cv-editor/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">CV Builder</h1>
      <p className="text-sm text-gray-500 mb-8">Choose a template and create your professional CV</p>

      {/* Template Grid */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose a Template</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {TEMPLATES.map(t => {
          const Template = templateMap[t.id as TemplateId];
          return (
            <button
              key={t.id}
              onClick={() => handleCreate(t.id)}
              className="group border-2 border-gray-200 rounded-xl overflow-hidden hover:border-brand-500 transition-all hover:shadow-lg text-left"
            >
              {/* Mini preview */}
              <div className="relative h-48 overflow-hidden bg-white">
                <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', width: '794px', height: '1123px', pointerEvents: 'none' }}>
                  <Template data={{ ...sampleData, templateId: t.id }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="h-3 w-3" /> Use Template</span>
                </div>
              </div>
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                  <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Saved CVs */}
      {savedCVs.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your CVs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedCVs.map(cv => (
              <div key={cv.id} className="border border-gray-200 rounded-xl p-4 hover:border-brand-400 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-brand-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{cv.name}</h3>
                      <p className="text-xs text-gray-400">Updated {new Date(cv.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{cv.templateId}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpen(cv.id)} className="flex-1 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg py-2 transition-colors">
                    Open
                  </button>
                  <button onClick={() => { const newId = duplicateCV(cv.id); navigate(`/cv-editor/${newId}`); }} className="p-2 text-gray-400 hover:text-brand-600 border border-gray-200 rounded-lg" title="Duplicate">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this CV?')) deleteCV(cv.id); }} className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
