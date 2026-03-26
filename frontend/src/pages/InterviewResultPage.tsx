import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronDown, ChevronUp, BarChart2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { interviewApi } from '@/lib/api';
import { AnswerRecord } from '@/types';
import { Button, Card, PageHeader, ScoreRing, Badge, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

const scoreVariant = (s: number) => s >= 7 ? 'success' : s >= 5 ? 'warning' : 'danger';

export const InterviewResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['interview-result', id],
    queryFn: () => interviewApi.get(id!).then(r => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  if (!session) return <div className="text-center py-16 text-gray-500">Session not found.</div>;

  const pct = session.finalScore ?? 0;
  const grade = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Needs work';
  const gradeColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500';

  return (
    <div>
      <PageHeader title="Interview results" subtitle={`${session.jobTitle} at ${session.company}`} />

      {/* Hero score */}
      <Card className="text-center py-10 mb-6">
        <div className="flex justify-center mb-4">
          <Trophy size={32} className={cn('mb-2', gradeColor)} />
        </div>
        <ScoreRing score={pct} size={120} />
        <h2 className={cn('text-2xl font-bold mt-3', gradeColor)}>{grade}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {session.answeredCount} of {session.totalQuestions} questions answered
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Button variant="secondary" onClick={() => navigate('/analyze')}>
            <BarChart2 size={14} /> Back to analysis
          </Button>
          <Button onClick={() => navigate(`/interview/${session.analysisId}`)}>
            <RotateCcw size={14} /> Practice again
          </Button>
        </div>
      </Card>

      {/* Per-question breakdown */}
      <h2 className="font-semibold text-gray-900 mb-3">Question breakdown</h2>
      <div className="space-y-2">
        {(session.answers as AnswerRecord[]).map((a, i) => (
          <Card key={a.questionId} className="p-0 overflow-hidden">
            <button
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                {i + 1}
              </div>
              <p className="flex-1 text-sm font-medium text-gray-900 truncate">{a.question}</p>
              <Badge variant={scoreVariant(a.evaluation.score)}>
                {a.evaluation.score}/10
              </Badge>
              {openIdx === i ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
            </button>

            {openIdx === i && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Your answer</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{a.answer}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">AI feedback</p>
                  <p className="text-sm text-gray-700">{a.evaluation.feedback}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                    {a.evaluation.strengths.map((s, j) => (
                      <p key={j} className="text-xs text-gray-600 flex items-start gap-1"><span className="text-green-400">+</span> {s}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-amber-600 mb-1">Improvements</p>
                    {a.evaluation.improvements.map((s, j) => (
                      <p key={j} className="text-xs text-gray-600 flex items-start gap-1"><span className="text-amber-400">→</span> {s}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
