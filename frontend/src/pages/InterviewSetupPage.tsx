import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mic, FileText, Briefcase } from 'lucide-react';
import { jobsApi, resumeApi, analysisApi } from '@/lib/api';
import { Job, Resume } from '@/types';
import { Button, PageHeader, Card, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

export const InterviewSetupPage = () => {
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

  // Run analysis first (needed for interview context), then navigate to interview
  const startMutation = useMutation({
    mutationFn: () => analysisApi.analyze(selectedResume!, selectedJob!),
    onSuccess: (res) => {
      navigate(`/interview/${res.data.id}`);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to prepare interview. Check your API key.'),
  });

  const canStart = selectedResume && selectedJob;

  return (
    <div>
      <PageHeader
        title="AI Mock Interview"
        subtitle="Select a resume and job post — AI will generate tailored interview questions and give real-time feedback."
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Resume picker */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-600" />
            <h2 className="font-semibold text-gray-900">Select your CV</h2>
          </div>
          {resumesLoading ? <Spinner /> : resumes.length === 0 ? (
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
          {jobsLoading ? <Spinner /> : jobs.length === 0 ? (
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

      <div className="flex justify-center">
        <Button
          size="lg"
          className="px-10 gap-3"
          disabled={!canStart}
          loading={startMutation.isPending}
          onClick={() => startMutation.mutate()}
        >
          {startMutation.isPending ? (
            'Preparing interview...'
          ) : (
            <><Mic size={16} /> Start mock interview</>
          )}
        </Button>
      </div>

      {startMutation.isPending && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Analyzing your profile and generating tailored questions...
        </p>
      )}
    </div>
  );
};
