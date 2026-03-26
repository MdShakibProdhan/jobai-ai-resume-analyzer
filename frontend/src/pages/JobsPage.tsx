import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Briefcase, Plus, Trash2, ExternalLink, Link2, PenLine } from 'lucide-react';
import { jobsApi } from '@/lib/api';
import { Job } from '@/types';
import { Button, Input, Textarea, PageHeader, EmptyState, Badge, Card, Spinner } from '@/components/ui';

const manualSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(1),
  description: z.string().min(50, 'Please paste the full job description (min 50 chars)'),
  location: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
});
type ManualForm = z.infer<typeof manualSchema>;

const scrapeSchema = z.object({ url: z.string().url('Enter a valid URL') });
type ScrapeForm = z.infer<typeof scrapeSchema>;

export const JobsPage = () => {
  const [mode, setMode] = useState<'list' | 'manual' | 'scrape'>('list');
  const [scrapeData, setScrapeData] = useState<any>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: ManualForm) => jobsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job post saved!');
      setMode('list');
    },
    onError: () => toast.error('Failed to save job'),
  });

  const scrapeMutation = useMutation({
    mutationFn: (url: string) => jobsApi.scrape(url),
    onSuccess: (res) => setScrapeData(res.data),
    onError: (err: any) => toast.error(
      err.response?.data?.message || 'Could not scrape that URL'
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Deleted');
    },
  });

  const manualForm = useForm<ManualForm>({ resolver: zodResolver(manualSchema) });
  const scrapeForm = useForm<ScrapeForm>({ resolver: zodResolver(scrapeSchema) });

  if (mode === 'manual') return (
    <div>
      <PageHeader title="Add job post" subtitle="Paste the job description manually." />
      <Card className="max-w-2xl">
        <form onSubmit={manualForm.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job title"
              placeholder="Software Engineer"
              error={manualForm.formState.errors.title?.message}
              {...manualForm.register('title')}
            />
            <Input
              label="Company"
              placeholder="Acme Corp"
              error={manualForm.formState.errors.company?.message}
              {...manualForm.register('company')}
            />
          </div>
          <Input
            label="Location (optional)"
            placeholder="Helsinki / Remote"
            {...manualForm.register('location')}
          />
          <Input
            label="Job URL (optional)"
            placeholder="https://..."
            {...manualForm.register('url')}
          />
          <Textarea
            label="Full job description"
            placeholder="Paste the complete job description here..."
            rows={12}
            error={manualForm.formState.errors.description?.message}
            {...manualForm.register('description')}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={createMutation.isPending}>
              Save job post
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                manualForm.reset();
                setMode('list');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );

  if (mode === 'scrape') return (
    <div>
      <PageHeader title="Import from URL" subtitle="Paste a LinkedIn, Indeed or Glassdoor job URL." />
      <Card className="max-w-2xl">
        <form
          onSubmit={scrapeForm.handleSubmit(d => scrapeMutation.mutate(d.url))}
          className="flex gap-3 mb-6"
        >
          <Input
            placeholder="https://linkedin.com/jobs/view/..."
            className="flex-1"
            error={scrapeForm.formState.errors.url?.message}
            {...scrapeForm.register('url')}
          />
          <Button type="submit" loading={scrapeMutation.isPending}>
            <Link2 size={14} /> Fetch
          </Button>
        </form>

        {scrapeData && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {scrapeData.raw}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Detected skills</p>
              <div className="flex flex-wrap gap-1.5">
                {(scrapeData.skills || []).map((s: string) => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Click "Edit & save" to fill in the title and company, then save.
            </p>

            <div className="flex gap-3">
              <Button onClick={() => {
                manualForm.setValue('title', scrapeData.title || '');
                manualForm.setValue('company', scrapeData.company || '');
                manualForm.setValue('description', scrapeData.raw || '');
                manualForm.setValue('url', scrapeData.sourceUrl || '');
                setMode('manual');
              }}>
                Edit & save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setScrapeData(null);
                  scrapeForm.reset();
                  setMode('list');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!scrapeData && (
          <Button variant="secondary" onClick={() => setMode('list')}>
            Cancel
          </Button>
        )}
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Job posts"
        subtitle={`${jobs.length} saved job${jobs.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMode('scrape')}>
              <Link2 size={13} /> Import URL
            </Button>
            <Button size="sm" onClick={() => setMode('manual')}>
              <Plus size={13} /> Add manual
            </Button>
          </div>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={24} />
        </div>
      )}

      {!isLoading && jobs.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="No job posts yet"
          description="Add a job post by pasting a URL or entering the details manually."
          action={
            <Button onClick={() => setMode('manual')}>
              <Plus size={14} /> Add your first job
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  {job.seniority && <Badge variant="info">{job.seniority}</Badge>}
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  {job.company}{job.location ? ` · ${job.location}` : ''}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(job.skills || []).slice(0, 6).map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                  {(job.skills?.length ?? 0) > 6 && (
                    <Badge>+{job.skills.length - 6} more</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {job.url && (
                  <a href={job.url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink size={14} />
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <PenLine size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(job.id)}
                >
                  <Trash2 size={14} className="text-red-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};