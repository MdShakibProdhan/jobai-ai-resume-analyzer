import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Mic, MicOff, Send, ChevronRight, CheckCircle2, ArrowUpRight, LogOut } from 'lucide-react';
import { interviewApi } from '@/lib/api';
import { InterviewQuestion, AnswerEvaluation } from '@/types';
import { Button, Card, Textarea, Badge, ScoreRing, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

type Phase = 'setup' | 'active' | 'feedback' | 'done';

const typeColor: Record<string, string> = {
  behavioural: 'info',
  technical: 'warning',
  situational: 'success',
};

export const InterviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(7);
  const [currentQ, setCurrentQ] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [lastEval, setLastEval] = useState<AnswerEvaluation | null>(null);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
  const [isLast, setIsLast] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const toggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in your browser. Try Chrome.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setAnswer(prev => prev ? prev + ' ' + transcript : transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        toast.error('Mic error: ' + event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const startMutation = useMutation({
    mutationFn: () => interviewApi.start(id!, questionCount),
    onSuccess: (res) => {
      const d = res.data;
      setSessionId(d.id);
      setCurrentQ(d.currentQuestion);
      setProgress({ answered: 0, total: d.totalQuestions });
      setPhase('active');
    },
    onError: () => toast.error('Could not start session. Make sure analysis exists.'),
  });

  const answerMutation = useMutation({
    mutationFn: (ans: string) => interviewApi.answer(sessionId!, ans),
    onSuccess: (res) => {
      const d = res.data;
      setLastEval(d.evaluation);
      setIsLast(d.isLastQuestion);
      if (!d.isLastQuestion) setProgress(d.progress);
      setPhase('feedback');
    },
    onError: () => toast.error('Failed to submit answer'),
  });

  const endMutation = useMutation({
    mutationFn: () => interviewApi.end(sessionId!),
    onSuccess: () => navigate(`/interview/${sessionId}/result`),
    onError: () => toast.error('Failed to end session'),
  });

  const quitMutation = useMutation({
    mutationFn: () => interviewApi.end(sessionId!),
    onSuccess: () => {
      toast.success('Interview ended.');
      navigate('/interview');
    },
    onError: () => {
      navigate('/interview');
    },
  });

  const nextQuestion = () => {
    if (isLast) {
      endMutation.mutate();
    } else {
      // Fetch updated session to get next question
      interviewApi.get(sessionId!).then(res => {
        setCurrentQ(res.data.currentQuestion);
        setAnswer('');
        setLastEval(null);
        setPhase('active');
        setTimeout(() => textareaRef.current?.focus(), 100);
      });
    }
  };

  // Setup phase
  if (phase === 'setup') return (
    <div>
      <div className="max-w-lg mx-auto text-center pt-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-5">
          <Mic size={28} className="text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI mock interview</h1>
        <p className="text-gray-500 text-sm mb-8">Practice answering questions tailored to your target job. Get instant AI feedback on every answer.</p>

        <Card className="text-left mb-6">
          <label className="label">Number of questions</label>
          <div className="flex gap-2">
            {[5, 7, 10, 15].map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                  questionCount === n
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'text-gray-600 border-gray-200 hover:border-brand-300'
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Mix of behavioural, technical, and situational questions.</p>
        </Card>

        <Button size="lg" className="w-full" loading={startMutation.isPending} onClick={() => startMutation.mutate()}>
          <Mic size={16} /> Start interview ({questionCount} questions)
        </Button>
      </div>
    </div>
  );

  // Active answering phase
  if (phase === 'active' && currentQ) return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar with end button */}
      <div className="flex justify-between items-center mb-4">
        <div />
        <button
          onClick={() => quitMutation.mutate()}
          disabled={quitMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
        >
          <LogOut size={13} /> {quitMutation.isPending ? 'Ending...' : 'End interview'}
        </button>
      </div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Question {progress.answered + 1} of {progress.total}</span>
          <Badge variant={typeColor[currentQ.type] as any}>{currentQ.type}</Badge>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div
            className="h-1.5 bg-brand-600 rounded-full transition-all"
            style={{ width: `${(progress.answered / progress.total) * 100}%` }}
          />
        </div>
      </div>

      <Card className="mb-4">
        <p className="text-lg font-medium text-gray-900 leading-relaxed">{currentQ.question}</p>
        {currentQ.hint && (
          <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3">
            Hint: {currentQ.hint}
          </p>
        )}
      </Card>

      <div className="relative mb-4">
        <Textarea
          ref={textareaRef}
          placeholder="Type your answer or click the mic to speak..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={7}
          autoFocus
        />
        <button
          type="button"
          onClick={toggleMic}
          className={cn(
            'absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all',
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
              : 'bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600'
          )}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-600 font-medium">Listening... speak your answer</span>
          <button onClick={toggleMic} className="ml-auto text-xs text-red-500 hover:text-red-700 font-medium">Stop</button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          disabled={answer.trim().length < 10}
          loading={answerMutation.isPending}
          onClick={() => {
            if (isListening && recognitionRef.current) {
              recognitionRef.current.stop();
              setIsListening(false);
            }
            answerMutation.mutate(answer.trim());
          }}
        >
          Submit answer <Send size={13} />
        </Button>
      </div>
    </div>
  );

  // Feedback phase
  if (phase === 'feedback' && lastEval) return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => quitMutation.mutate()}
          disabled={quitMutation.isPending}
          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
        >
          <LogOut size={13} /> {quitMutation.isPending ? 'Ending...' : 'End interview'}
        </button>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <ScoreRing score={lastEval.score * 10} size={72} label="Score" />
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Answer feedback</h2>
          <p className="text-sm text-gray-500">{lastEval.feedback}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle2 size={14} className="text-green-500" />
            <h3 className="text-sm font-semibold text-gray-900">What worked</h3>
          </div>
          <ul className="space-y-1.5">
            {lastEval.strengths.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-green-400 mt-0.5">+</span> {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-center gap-1.5 mb-3">
            <ArrowUpRight size={14} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Improvements</h3>
          </div>
          <ul className="space-y-1.5">
            {lastEval.improvements.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">→</span> {s}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Button
        size="lg"
        className="w-full"
        loading={endMutation.isPending}
        onClick={nextQuestion}
      >
        {isLast ? 'Finish & see results' : <>Next question <ChevronRight size={14} /></>}
      </Button>
    </div>
  );

  return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
};
