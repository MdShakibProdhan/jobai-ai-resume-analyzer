import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { Button, Card, PageHeader, Badge, Spinner } from '@/components/ui';

export const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size={24} /></div>;
  if (!job) return <div className="text-center py-16 text-gray-500">Job not found.</div>;

  return (
    <div>
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={14} /> Back to jobs
      </button>

      <PageHeader
        title={job.title}
        subtitle={`${job.company}${job.location ? ' · ' + job.location : ''}`}
        action={
          <Button onClick={() => navigate('/analyze')}>
            <BarChart2 size={14} /> Analyze with resume
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">Job description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </p>
          </Card>

          {job.requirements?.length > 0 && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-brand-500 mt-0.5">•</span> {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-3">Required skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.skills?.map((s: string) => <Badge key={s} variant="info">{s}</Badge>)}
            </div>
          </Card>

          {job.seniority && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-2">Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Seniority</span>
                  <Badge variant="info">{job.seniority}</Badge>
                </div>
                {job.jobType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium">{job.jobType}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Button className="w-full" onClick={() => navigate('/analyze')}>
            <BarChart2 size={14} /> Run AI analysis
          </Button>
        </div>
      </div>
    </div>
  );
};
