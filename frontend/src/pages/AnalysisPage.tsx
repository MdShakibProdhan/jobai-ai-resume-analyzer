import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FileText, Briefcase, Sparkles, Scan, Brain, BarChart3, ShieldCheck, PenTool } from 'lucide-react';
import { jobsApi, resumeApi, analysisApi } from '@/lib/api';
import { Job, Resume } from '@/types';
import { Button, PageHeader, Card, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const ANALYSIS_STAGES = [
  { icon: Scan, label: 'Parsing your resume...', duration: 3 },
  { icon: FileText, label: 'Reading job requirements...', duration: 3 },
  { icon: Brain, label: 'Matching skills & keywords...', duration: 5 },
  { icon: BarChart3, label: 'Scoring ATS compatibility...', duration: 4 },
  { icon: ShieldCheck, label: 'Analyzing formatting...', duration: 3 },
  { icon: PenTool, label: 'Generating report & cover letter...', duration: 4 },
];
const TOTAL_EST = ANALYSIS_STAGES.reduce((s, st) => s + st.duration, 0);

const AnalysisLoader = () => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Figure out which stage we're in
  let cumulative = 0;
  let activeStage = ANALYSIS_STAGES.length - 1;
  for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
    cumulative += ANALYSIS_STAGES[i].duration;
    if (elapsed < cumulative) { activeStage = i; break; }
  }

  const progress = Math.min((elapsed / TOTAL_EST) * 100, 95);
  const remaining = Math.max(TOTAL_EST - elapsed, 0);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Pulsing brain icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center animate-pulse">
          <Brain size={36} className="text-brand-600" />
        </div>
        <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-brand-300 animate-ping opacity-30" />
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-1">AI is analyzing your profile</h2>
      <p className="text-sm text-gray-500 mb-8">Hang tight — this usually takes 15–25 seconds</p>

      {/* Main progress bar */}
      <div className="w-full max-w-md mb-6">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
          <span className="text-xs text-gray-400">{remaining > 0 ? `~${remaining}s remaining` : 'Almost done...'}</span>
        </div>
      </div>

      {/* Stage steps */}
      <div className="w-full max-w-md space-y-2">
        {ANALYSIS_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const done = i < activeStage;
          const active = i === activeStage;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500',
                active ? 'bg-brand-50 border border-brand-200' : done ? 'bg-green-50/60' : 'opacity-40'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                active ? 'bg-brand-600' : done ? 'bg-green-500' : 'bg-gray-200'
              )}>
                {done ? (
                  <span className="text-white text-xs font-bold">✓</span>
                ) : (
                  <Icon size={14} className={active ? 'text-white' : 'text-gray-400'} />
                )}
              </div>
              <span className={cn(
                'text-sm transition-colors',
                active ? 'text-brand-700 font-semibold' : done ? 'text-green-700' : 'text-gray-400'
              )}>
                {done ? stage.label.replace('...', '') + ' ✓' : stage.label}
              </span>
              {active && (
                <div className="ml-auto flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ETS */}
      <div className="mt-8 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          <span className="font-semibold text-gray-700">ETS:</span>{' '}
          {remaining > 0 ? (
            <>Estimated <span className="font-semibold text-brand-600">~{remaining}s</span> to complete</>
          ) : (
            <span className="text-brand-600 font-semibold">Finalizing results...</span>
          )}
        </p>
      </div>
    </div>
  );
};

export const AnalysisPage = () => {
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list().then(r => r.data),
  });

  const { data: resumes = [], isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.list().then(r => r.data),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analysisApi.analyze(selectedResume!, selectedJob!),
    onSuccess: (res) => {
      toast.success('Analysis complete!');
      navigate(`/analysis/${res.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Analysis failed. Check your Gemini API key in backend/.env'),
  });

  const canAnalyze = selectedResume && selectedJob;

  return (
    <div>
      <PageHeader
        title="Run AI analysis"
        subtitle="Select a resume and a job post to get your fit score, ATS rating, and CV improvements."
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Resume picker */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Select resume</h2>
          </div>
          {resumesLoading ? <Spinner size={20} /> : resumes.length === 0 ? (
            <p className="text-sm text-gray-400">No resumes yet. <button className="text-brand-600 underline" onClick={() => navigate('/resume')}>Upload one first.</button></p>
          ) : (
            <div className="space-y-2">
              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResume(r.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                    selectedResume === r.id
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', selectedResume === r.id ? 'bg-brand-600' : 'bg-gray-100')}>
                    <FileText size={14} className={selectedResume === r.id ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.filename}</p>
                    <p className="text-xs text-gray-400">{r.wordCount} words</p>
                  </div>
                  {selectedResume === r.id && (
                    <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Job picker */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Select job post</h2>
          </div>
          {jobsLoading ? <Spinner size={20} /> : jobs.length === 0 ? (
            <p className="text-sm text-gray-400">No jobs yet. <button className="text-brand-600 underline" onClick={() => navigate('/jobs')}>Add a job first.</button></p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJob(j.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                    selectedJob === j.id
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', selectedJob === j.id ? 'bg-brand-600' : 'bg-gray-100')}>
                    <Briefcase size={14} className={selectedJob === j.id ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                    <p className="text-xs text-gray-400">{j.company}</p>
                  </div>
                  {selectedJob === j.id && (
                    <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Analyze button or loader */}
      {analyzeMutation.isPending ? (
        <AnalysisLoader />
      ) : (
        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-10 gap-3"
            disabled={!canAnalyze}
            onClick={() => analyzeMutation.mutate()}
          >
            <Sparkles size={16} /> Run AI analysis
          </Button>
        </div>
      )}
    </div>
  );
};
