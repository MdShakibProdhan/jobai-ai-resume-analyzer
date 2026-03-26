import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, BarChart2, Mic, ArrowRight, TrendingUp } from 'lucide-react';
import { jobsApi, resumeApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, PageHeader, Button, ScoreRing } from '@/components/ui';

const StatCard = ({ icon: Icon, label, value, color, to }: any) => (
  <Link to={to}>
    <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  </Link>
);

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: () => jobsApi.list().then(r => r.data) });
  const { data: resumes = [] } = useQuery({ queryKey: ['resumes'], queryFn: () => resumeApi.list().then(r => r.data) });

  const steps = [
    { n: 1, label: 'Add a job post', done: jobs.length > 0, to: '/jobs', desc: 'Paste a URL or add manually' },
    { n: 2, label: 'Upload your resume', done: resumes.length > 0, to: '/resume', desc: 'PDF or DOCX accepted' },
    { n: 3, label: 'Run AI analysis', done: false, to: '/analyze', desc: 'Get your fit score + CV rewrite' },
    { n: 4, label: 'Practice interview', done: false, to: '/interview', desc: 'AI mock interview with feedback' },
  ];

  return (
    <div>
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's an overview of your job application progress."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Briefcase}  label="Job posts saved"  value={jobs.length}    color="bg-brand-600"   to="/jobs" />
        <StatCard icon={FileText}   label="Resumes uploaded" value={resumes.length} color="bg-violet-500"  to="/resume" />
        <StatCard icon={BarChart2}  label="Analyses run"     value={0}              color="bg-emerald-500" to="/analyze" />
        <StatCard icon={Mic}        label="Interviews done"  value={0}              color="bg-amber-500"   to="/interview" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Getting started checklist */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-brand-600" />
              <h2 className="font-semibold text-gray-900">Getting started</h2>
            </div>
            <div className="space-y-3">
              {steps.map((step) => (
                <Link key={step.n} to={step.to}>
                  <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-brand-200 hover:bg-brand-50/30 ${step.done ? 'border-green-200 bg-green-50/40' : 'border-gray-100'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${step.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {step.done ? '✓' : step.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.done ? 'text-green-700 line-through' : 'text-gray-900'}`}>{step.label}</p>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Quick actions</h2>
            <div className="space-y-2">
              <Button variant="primary" className="w-full justify-start gap-3" size="sm" onClick={() => {}}>
                <Briefcase size={14} /> Add job post
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3" size="sm" onClick={() => {}}>
                <FileText size={14} /> Upload resume
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3" size="sm" onClick={() => {}}>
                <BarChart2 size={14} /> Run analysis
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3" size="sm" onClick={() => {}}>
                <Mic size={14} /> Start interview
              </Button>
            </div>
          </Card>

          <Card className="text-center py-6">
            <ScoreRing score={0} size={80} label="Avg fit score" />
            <p className="text-xs text-gray-400 mt-3">Run an analysis to see your score</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
