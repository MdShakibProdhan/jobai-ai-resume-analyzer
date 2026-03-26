import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, CheckCircle2, XCircle, Mic, Copy, Download, Eye, X, Sparkles,
  ChevronDown, ChevronUp, Target, FileText, TrendingUp, ClipboardList, Lightbulb
} from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { analysisApi } from '@/lib/api';
import { Analysis, CategoryDetail } from '@/types';
import { Button, Card, PageHeader, Badge, ScoreRing, Spinner } from '@/components/ui';

const scoreColor = (s: number) => s >= 70 ? '#22c55e' : s >= 45 ? '#f59e0b' : '#ef4444';
const scoreLabel = (s: number) => s >= 70 ? 'Good' : s >= 45 ? 'Needs work' : 'Critical';

export const AnalysisResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: analysis, isLoading } = useQuery<Analysis>({
    queryKey: ['analysis', id],
    queryFn: () => analysisApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  const [improvedCV, setImprovedCV] = useState<any | null>(null);
  const [showImprovedCV, setShowImprovedCV] = useState(false);

  const cvMutation = useMutation({
    mutationFn: () => analysisApi.improveCV(id!),
    onSuccess: (res) => {
      setImprovedCV(res.data.improvedCV);
      setShowImprovedCV(true);
    },
    onError: () => toast.error('CV generation failed'),
  });

  const reportMutation = useMutation({
    mutationFn: () => analysisApi.downloadReport(id!),
    onSuccess: (res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ATS_Report_${id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    },
    onError: () => toast.error('Failed to generate report'),
  });

  const openPreview = useCallback(async () => {
    setShowPreview(true);
    setPreviewLoading(true);
    try {
      const res = await analysisApi.downloadReport(id!);
      // Wait for modal to mount
      await new Promise(r => setTimeout(r, 50));
      if (previewRef.current) {
        previewRef.current.innerHTML = '';
        await renderAsync(res.data, previewRef.current, undefined, {
          className: 'docx-preview',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: true,
          ignoreFonts: false,
          breakPages: true,
        });
      }
    } catch {
      toast.error('Failed to load report preview');
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  }, [id]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (!analysis) return <div className="text-center py-16 text-gray-500">Analysis not found.</div>;

  const cats = analysis.categoryScores || {};

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/analyze')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft size={14} /> New analysis
      </button>

      <PageHeader
        title="ATS Analysis Report"
        subtitle={new Date(analysis.createdAt).toLocaleString()}
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={openPreview}
            >
              <Eye size={14} /> View report
            </Button>
            <Button
              variant="secondary"
              loading={reportMutation.isPending}
              onClick={() => reportMutation.mutate()}
            >
              <Download size={14} /> Download report
            </Button>
            <Button onClick={() => navigate(`/interview/${id}`)}>
              <Mic size={14} /> Mock interview
            </Button>
          </div>
        }
      />

      {/* Overall summary */}
      <Card className="border-l-4 border-brand-500">
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.overallSummary}</p>
      </Card>

      {/* Score overview */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Target size={16} className="text-brand-600" /> Overall scores at a glance
        </h2>
        <div className="flex gap-8 mb-6">
          <div className="text-center">
            <ScoreRing score={analysis.atsScore} size={96} label="ATS score" />
            <p className="text-xs mt-1" style={{ color: scoreColor(analysis.atsScore) }}>{scoreLabel(analysis.atsScore)}</p>
          </div>
          <div className="text-center">
            <ScoreRing score={analysis.fitScore} size={96} label="Job fit" />
            <p className="text-xs mt-1" style={{ color: scoreColor(analysis.fitScore) }}>{scoreLabel(analysis.fitScore)}</p>
          </div>
        </div>

        {cats && (
          <div className="space-y-2.5 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Score breakdown by category</h3>
            {([
              { key: 'technicalSkills', label: 'Technical skills match', icon: '🛠️' },
              { key: 'keywordOptimization', label: 'Keyword optimization', icon: '🔑' },
              { key: 'atsFormatting', label: 'ATS formatting', icon: '📄' },
              { key: 'experienceRelevance', label: 'Experience relevance', icon: '💼' },
              { key: 'languageRequirements', label: 'Language requirements', icon: '🌐' },
            ] as const).map(({ key, label, icon }) => {
              const cat = cats[key];
              if (!cat || typeof cat !== 'object' || !('score' in cat)) return null;
              const detail = cat as CategoryDetail;
              const matchPct = detail.total > 0 ? Math.round((detail.matched / detail.total) * 100) : 0;
              const lackPct = 100 - matchPct;
              const isOpen = openCat === key;

              return (
                <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full px-4 py-3 text-left hover:bg-gray-50/80 transition-colors"
                    onClick={() => setOpenCat(isOpen ? null : key)}
                  >
                    {/* Row 1: label + match count + chevron */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-base">{icon}</span>
                      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                      <span className="text-xs font-semibold text-green-600">{detail.matched} matched</span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs font-semibold text-red-500">{detail.total - detail.matched} lacking</span>
                      {isOpen
                        ? <ChevronUp size={14} className="text-gray-400 shrink-0 ml-1" />
                        : <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                      }
                    </div>
                    {/* Row 2: split scale bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-gray-100">
                        {matchPct > 0 && (
                          <div
                            className="h-full bg-green-500 transition-all duration-700 rounded-l-full"
                            style={{ width: `${matchPct}%` }}
                          />
                        )}
                        {lackPct > 0 && (
                          <div
                            className="h-full bg-red-400 transition-all duration-700 rounded-r-full"
                            style={{ width: `${lackPct}%` }}
                          />
                        )}
                      </div>
                      <span className="text-xs font-bold w-14 text-right" style={{ color: scoreColor(detail.score) }}>
                        {detail.matched}/{detail.total}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-gray-50/50">
                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        {/* Matched items */}
                        {detail.matchedItems.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
                              <CheckCircle2 size={12} /> FOUND IN YOUR CV ({detail.matchedItems.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {detail.matchedItems.map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-100">
                                  <CheckCircle2 size={10} /> {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Missing items */}
                        {detail.missingItems.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-500 mb-1.5 flex items-center gap-1">
                              <XCircle size={12} /> LACKING ({detail.missingItems.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {detail.missingItems.map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs border border-red-100">
                                  <XCircle size={10} /> {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Tip */}
                      {detail.tip && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                          <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800">{detail.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Strengths and gaps */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" /> What works in your favour
          </h2>
          <ul className="space-y-2">
            {(analysis.strengths || []).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold mt-0.5 shrink-0">✔</span> {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle size={16} className="text-red-500" /> Critical gaps & missing keywords
          </h2>
          <ul className="space-y-2">
            {(analysis.criticalGaps || analysis.skillMatch?.missing || []).map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 font-bold mt-0.5 shrink-0">✘</span> {g}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Skill match pills */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4">Skill match</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-green-600 mb-2">MATCHED SKILLS</p>
            <div className="flex flex-wrap gap-1.5">
              {(analysis.skillMatch?.matched || []).map(s => <Badge key={s} variant="success">{s}</Badge>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-500 mb-2">MISSING SKILLS</p>
            <div className="flex flex-wrap gap-1.5">
              {(analysis.skillMatch?.missing || []).map(s => <Badge key={s} variant="danger">{s}</Badge>)}
            </div>
          </div>
        </div>
      </Card>

      {/* ATS Formatting */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={16} className="text-brand-600" /> ATS formatting analysis
        </h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-green-600 mb-2">POSITIVES FOR ATS</p>
            <ul className="space-y-1.5">
              {(analysis.atsFormattingPositives || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 shrink-0">✔</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-500 mb-2">FORMATTING PROBLEMS</p>
            <ul className="space-y-1.5">
              {(analysis.atsFormattingProblems || []).map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-500 shrink-0">✘</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Step by step guide */}
      <Card>
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-600" /> Step-by-step guide to reach 95%+ ATS score
        </h2>
        <div className="space-y-2">
          {(analysis.stepByStepGuide || []).map((step, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenStep(openStep === i ? null : i)}
              >
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {step.step}
                </div>
                <p className="flex-1 font-semibold text-gray-900 text-sm">{step.title}</p>
                {openStep === i
                  ? <ChevronUp size={14} className="text-gray-400" />
                  : <ChevronDown size={14} className="text-gray-400" />
                }
              </button>
              {openStep === i && (
                <div className="px-16 pb-4 space-y-2">
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <ul className="space-y-1.5">
                    {(step.items || []).map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-brand-500 mt-0.5 shrink-0">●</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Projected scores */}
      {analysis.projectedScores && (
        <Card className="border-brand-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={16} className="text-brand-600" /> Projected scores after improvements
          </h2>
          <div className="flex gap-8 mb-4">
            <div className="text-center">
              <ScoreRing score={analysis.projectedScores.atsScore} size={88} label="ATS projected" />
            </div>
            <div className="text-center">
              <ScoreRing score={analysis.projectedScores.fitScore} size={88} label="Fit projected" />
            </div>
          </div>
          {analysis.projectedScores.note && (
            <p className="text-xs text-gray-500 italic">{analysis.projectedScores.note}</p>
          )}
        </Card>
      )}

      {/* Cover letter */}
      {analysis.coverLetter && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText size={16} className="text-brand-600" /> Cover letter
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCover(!showCover)}>
                {showCover ? 'Hide' : 'Show'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                navigator.clipboard.writeText(analysis.coverLetter);
                toast.success('Cover letter copied!');
              }}>
                <Copy size={13} /> Copy
              </Button>
            </div>
          </div>
          {showCover && (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-5 max-h-96 overflow-y-auto">
              {analysis.coverLetter}
            </pre>
          )}
        </Card>
      )}

      {/* Submission checklist */}
      {analysis.submissionChecklist && (
        <Card>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-brand-600" /> Final submission checklist
          </h2>
          <ul className="space-y-2">
            {analysis.submissionChecklist.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Download report banner */}
      <Card className="border-blue-100 bg-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Download full ATS report</h3>
            <p className="text-sm text-blue-700 mt-0.5">
              Get the complete report as a formatted Word document — exactly like your previous ATS report.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openPreview}>
              <Eye size={14} /> View
            </Button>
            <Button
              loading={reportMutation.isPending}
              onClick={() => reportMutation.mutate()}
            >
              <Download size={14} /> Download .docx
            </Button>
          </div>
        </div>
      </Card>

      {/* Generate improved CV */}
      <Card className="border-brand-100 bg-brand-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-brand-900">Generate ATS-optimized CV</h3>
            <p className="text-sm text-brand-700 mt-0.5">
              AI rewrites your resume tailored to this job — copy or download it.
            </p>
          </div>
          <div className="flex gap-2">
            {improvedCV && (
              <Button variant="secondary" onClick={() => setShowImprovedCV(true)}>
                <Eye size={14} /> View
              </Button>
            )}
            <Button loading={cvMutation.isPending} onClick={() => cvMutation.mutate()}>
              <Sparkles size={14} /> {improvedCV ? 'Regenerate' : 'Generate improved CV'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Improved CV modal */}
      {showImprovedCV && improvedCV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl shrink-0">
              <h2 className="font-bold text-lg text-gray-900">Your ATS-Optimized CV</h2>
              <button
                onClick={() => setShowImprovedCV(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Formatted CV body */}
            <div className="overflow-y-auto flex-1 min-h-0 p-6">
              <div id="cv-preview" className="bg-white shadow-lg rounded-lg mx-auto max-w-2xl" style={{ padding: '48px 52px', fontFamily: 'Georgia, serif' }}>
                {typeof improvedCV === 'object' && improvedCV.name ? (
                  <>
                    {/* Name + title + contact */}
                    <div className="text-center mb-1">
                      <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">{improvedCV.name}</h1>
                      <p className="text-sm font-semibold mt-1" style={{ color: '#2E86C1' }}>{improvedCV.title}</p>
                      {improvedCV.contact && <p className="text-xs text-gray-500 mt-1.5">{improvedCV.contact}</p>}
                      {improvedCV.links && <p className="text-xs mt-0.5" style={{ color: '#2E86C1' }}>{improvedCV.links}</p>}
                    </div>
                    <hr className="my-4" style={{ borderColor: '#2E86C1', borderWidth: '2px' }} />

                    {/* Summary */}
                    {improvedCV.summary && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b" style={{ borderColor: '#2E86C1' }}>Professional Summary</h2>
                        <p className="text-xs text-gray-700 leading-relaxed">{improvedCV.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {improvedCV.skills?.length > 0 && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b" style={{ borderColor: '#2E86C1' }}>Technical Skills</h2>
                        <ul className="space-y-1">
                          {improvedCV.skills.map((s: any, i: number) => (
                            <li key={i} className="text-xs text-gray-700 flex">
                              <span className="mr-2">•</span>
                              <span><strong className="text-gray-900">{s.category}:</strong> {s.items}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Experience */}
                    {improvedCV.experience?.length > 0 && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b" style={{ borderColor: '#2E86C1' }}>Work Experience</h2>
                        {improvedCV.experience.map((exp: any, i: number) => (
                          <div key={i} className={i > 0 ? 'mt-3' : ''}>
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-bold text-gray-900">{exp.role}</h3>
                              <span className="text-xs text-gray-500 shrink-0 ml-2">{exp.dates}</span>
                            </div>
                            <p className="text-xs italic" style={{ color: '#2E86C1' }}>{exp.company} | {exp.location}</p>
                            <ul className="mt-1.5 space-y-1">
                              {exp.bullets.map((b: string, j: number) => (
                                <li key={j} className="text-xs text-gray-700 flex">
                                  <span className="mr-2 shrink-0">•</span><span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {improvedCV.projects?.length > 0 && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b" style={{ borderColor: '#2E86C1' }}>Projects</h2>
                        {improvedCV.projects.map((p: any, i: number) => (
                          <div key={i} className={i > 0 ? 'mt-3' : ''}>
                            <p className="text-xs"><strong className="text-gray-900">{p.name}</strong> — <em className="text-gray-500">{p.subtitle}</em></p>
                            <ul className="mt-1 space-y-1">
                              {p.bullets.map((b: string, j: number) => (
                                <li key={j} className="text-xs text-gray-700 flex">
                                  <span className="mr-2 shrink-0">•</span><span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Education */}
                    {improvedCV.education?.length > 0 && (
                      <div className="mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b" style={{ borderColor: '#2E86C1' }}>Education</h2>
                        {improvedCV.education.map((edu: any, i: number) => (
                          <div key={i} className={i > 0 ? 'mt-3' : ''}>
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-bold text-gray-900">{edu.degree}</h3>
                              <span className="text-xs text-gray-500 shrink-0 ml-2">{edu.dates}</span>
                            </div>
                            <p className="text-xs italic" style={{ color: '#2E86C1' }}>{edu.institution} | {edu.location}</p>
                            {edu.bullets?.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {edu.bullets.map((b: string, j: number) => (
                                  <li key={j} className="text-xs text-gray-700 flex">
                                    <span className="mr-2 shrink-0">•</span><span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Additional */}
                    {improvedCV.additional?.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b" style={{ borderColor: '#2E86C1' }}>Additional Information</h2>
                        <ul className="space-y-1">
                          {improvedCV.additional.map((a: any, i: number) => (
                            <li key={i} className="text-xs text-gray-700 flex">
                              <span className="mr-2">•</span>
                              <span><strong className="text-gray-900">{a.label}:</strong> {a.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  /* Fallback for plain text */
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {typeof improvedCV === 'string' ? improvedCV : JSON.stringify(improvedCV, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl shrink-0">
              <Button variant="secondary" onClick={() => setShowImprovedCV(false)}>
                <X size={14} /> Close
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const cv = improvedCV;
                  const plainText = typeof cv === 'string' ? cv : [
                    cv.name?.toUpperCase(), cv.title, cv.contact, cv.links, '',
                    'PROFESSIONAL SUMMARY', cv.summary, '',
                    'TECHNICAL SKILLS', ...(cv.skills || []).map((s: any) => `• ${s.category}: ${s.items}`), '',
                    'WORK EXPERIENCE', ...(cv.experience || []).flatMap((e: any) => [
                      `${e.role} | ${e.company} | ${e.location} | ${e.dates}`,
                      ...e.bullets.map((b: string) => `• ${b}`), ''
                    ]),
                    'PROJECTS', ...(cv.projects || []).flatMap((p: any) => [
                      `${p.name} — ${p.subtitle}`,
                      ...p.bullets.map((b: string) => `• ${b}`), ''
                    ]),
                    'EDUCATION', ...(cv.education || []).flatMap((e: any) => [
                      `${e.degree} | ${e.institution} | ${e.location} | ${e.dates}`,
                      ...(e.bullets || []).map((b: string) => `• ${b}`), ''
                    ]),
                    'ADDITIONAL INFORMATION', ...(cv.additional || []).map((a: any) => `• ${a.label}: ${a.text}`),
                  ].filter(Boolean).join('\n');
                  navigator.clipboard.writeText(plainText);
                  toast.success('Copied to clipboard!');
                }}
              >
                <Copy size={14} /> Copy text
              </Button>
              <Button onClick={() => {
                const cv = improvedCV;
                const plainText = typeof cv === 'string' ? cv : [
                  cv.name?.toUpperCase(), cv.title, cv.contact, cv.links, '',
                  'PROFESSIONAL SUMMARY', cv.summary, '',
                  'TECHNICAL SKILLS', ...(cv.skills || []).map((s: any) => `• ${s.category}: ${s.items}`), '',
                  'WORK EXPERIENCE', ...(cv.experience || []).flatMap((e: any) => [
                    `${e.role} | ${e.company} | ${e.location} | ${e.dates}`,
                    ...e.bullets.map((b: string) => `• ${b}`), ''
                  ]),
                  'PROJECTS', ...(cv.projects || []).flatMap((p: any) => [
                    `${p.name} — ${p.subtitle}`,
                    ...p.bullets.map((b: string) => `• ${b}`), ''
                  ]),
                  'EDUCATION', ...(cv.education || []).flatMap((e: any) => [
                    `${e.degree} | ${e.institution} | ${e.location} | ${e.dates}`,
                    ...(e.bullets || []).map((b: string) => `• ${b}`), ''
                  ]),
                  'ADDITIONAL INFORMATION', ...(cv.additional || []).map((a: any) => `• ${a.label}: ${a.text}`),
                ].filter(Boolean).join('\n');
                const blob = new Blob([plainText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Improved_CV_${id}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Downloaded!');
              }}>
                <Download size={14} /> Download .txt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mock interview CTA */}
      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Ready to practice?</h3>
          <p className="text-sm text-gray-500 mt-0.5">Start an AI mock interview tailored to this exact job.</p>
        </div>
        <Button onClick={() => navigate(`/interview/${id}`)}>
          <Mic size={14} /> Start mock interview
        </Button>
      </div>

      {/* Report preview modal — renders the actual generated DOCX */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="font-bold text-lg text-gray-900">ATS Report Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* DOCX render target */}
            <div className="overflow-y-auto flex-1 min-h-0">
              {previewLoading && (
                <div className="flex items-center justify-center py-20">
                  <Spinner /> <span className="ml-3 text-sm text-gray-500">Generating report preview...</span>
                </div>
              )}
              <div ref={previewRef} className="docx-preview-container" />
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 shrink-0">
              <Button variant="secondary" onClick={() => setShowPreview(false)}>
                <X size={14} /> Close
              </Button>
              <Button loading={reportMutation.isPending} onClick={() => reportMutation.mutate()}>
                <Download size={14} /> Download .docx
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};