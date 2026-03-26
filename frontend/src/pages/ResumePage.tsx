import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FileText, Upload, Trash2, Clock } from 'lucide-react';
import { resumeApi } from '@/lib/api';
import { Resume } from '@/types';
import { Button, PageHeader, EmptyState, Badge, Card, Spinner } from '@/components/ui';

export const ResumePage = () => {
  const qc = useQueryClient();

  const { data: resumes = [], isLoading } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.list().then(r => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resumes'] }); toast.success('Resume uploaded!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resumes'] }); toast.success('Deleted'); },
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) uploadMutation.mutate(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div>
      <PageHeader
        title="My resume"
        subtitle="Upload your resume in PDF or DOCX format."
      />

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors mb-8 ${
          isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50/50'
        }`}
      >
        <input {...getInputProps()} />
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size={28} />
            <p className="text-sm text-gray-500">Uploading and parsing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
              <Upload size={20} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF or DOCX · Max 10 MB</p>
            </div>
            <Button variant="secondary" size="sm" type="button">Browse files</Button>
          </div>
        )}
      </div>

      {/* Saved resumes */}
      {isLoading && <div className="flex justify-center py-8"><Spinner size={24} /></div>}

      {!isLoading && resumes.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No resumes uploaded yet"
          description="Upload a PDF or DOCX resume to start analyzing against job posts."
        />
      )}

      <div className="space-y-3">
        {resumes.map((resume) => (
          <Card key={resume.id} className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{resume.filename}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={resume.mimetype.includes('pdf') ? 'danger' : 'info'}>
                    {resume.mimetype.includes('pdf') ? 'PDF' : 'DOCX'}
                  </Badge>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(resume.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-gray-400">{resume.wordCount} words</span>
                </div>
                {resume.previewText && (
                  <p className="text-xs text-gray-400 mt-2 truncate">{resume.previewText}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(resume.id)}
                loading={deleteMutation.isPending}
              >
                <Trash2 size={14} className="text-red-400" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
