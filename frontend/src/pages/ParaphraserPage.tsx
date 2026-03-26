import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowRight, Copy, Check, RotateCcw, Type, X } from 'lucide-react';
import { Button, PageHeader, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// ── Simple synonym map (no AI needed) ────────────────────
const SYNONYMS: Record<string, string[]> = {
  good: ['excellent', 'great', 'outstanding', 'superb', 'remarkable', 'fine'],
  bad: ['poor', 'terrible', 'awful', 'dreadful', 'inadequate', 'subpar'],
  happy: ['joyful', 'delighted', 'pleased', 'content', 'cheerful', 'elated'],
  sad: ['unhappy', 'sorrowful', 'melancholy', 'gloomy', 'downcast', 'dejected'],
  big: ['large', 'enormous', 'massive', 'substantial', 'significant', 'considerable'],
  small: ['tiny', 'little', 'compact', 'miniature', 'modest', 'slight'],
  fast: ['quick', 'rapid', 'swift', 'speedy', 'prompt', 'brisk'],
  slow: ['gradual', 'unhurried', 'leisurely', 'sluggish', 'steady', 'measured'],
  help: ['assist', 'support', 'aid', 'facilitate', 'guide', 'contribute to'],
  make: ['create', 'develop', 'build', 'produce', 'construct', 'establish'],
  get: ['obtain', 'acquire', 'receive', 'gain', 'secure', 'attain'],
  use: ['utilize', 'employ', 'leverage', 'apply', 'implement', 'adopt'],
  show: ['demonstrate', 'illustrate', 'display', 'reveal', 'present', 'exhibit'],
  give: ['provide', 'offer', 'deliver', 'supply', 'grant', 'furnish'],
  think: ['believe', 'consider', 'contemplate', 'reflect', 'evaluate', 'assess'],
  important: ['crucial', 'essential', 'vital', 'significant', 'critical', 'key'],
  hard: ['difficult', 'challenging', 'demanding', 'tough', 'complex', 'rigorous'],
  easy: ['simple', 'straightforward', 'effortless', 'uncomplicated', 'manageable', 'accessible'],
  new: ['novel', 'innovative', 'modern', 'fresh', 'recent', 'cutting-edge'],
  old: ['previous', 'former', 'established', 'traditional', 'longstanding', 'veteran'],
  start: ['begin', 'initiate', 'launch', 'commence', 'embark on', 'kick off'],
  end: ['finish', 'conclude', 'complete', 'finalize', 'wrap up', 'terminate'],
  change: ['modify', 'adjust', 'alter', 'transform', 'revise', 'update'],
  improve: ['enhance', 'optimize', 'upgrade', 'refine', 'strengthen', 'elevate'],
  increase: ['boost', 'expand', 'raise', 'amplify', 'grow', 'escalate'],
  decrease: ['reduce', 'lower', 'diminish', 'cut', 'minimize', 'shrink'],
  many: ['numerous', 'several', 'multiple', 'various', 'abundant', 'countless'],
  very: ['extremely', 'highly', 'remarkably', 'exceptionally', 'particularly', 'incredibly'],
  nice: ['pleasant', 'agreeable', 'wonderful', 'lovely', 'delightful', 'charming'],
  like: ['enjoy', 'prefer', 'appreciate', 'favor', 'admire', 'value'],
  need: ['require', 'demand', 'necessitate', 'call for', 'depend on', 'rely on'],
  want: ['desire', 'wish', 'aspire', 'seek', 'aim for', 'pursue'],
  know: ['understand', 'recognize', 'comprehend', 'grasp', 'realize', 'acknowledge'],
  see: ['observe', 'notice', 'identify', 'recognize', 'perceive', 'detect'],
  say: ['state', 'mention', 'express', 'declare', 'articulate', 'convey'],
  tell: ['inform', 'notify', 'advise', 'communicate', 'brief', 'report'],
  work: ['operate', 'function', 'perform', 'execute', 'collaborate', 'contribute'],
  run: ['manage', 'operate', 'execute', 'administer', 'oversee', 'conduct'],
  try: ['attempt', 'strive', 'endeavor', 'aim', 'seek', 'pursue'],
  keep: ['maintain', 'retain', 'preserve', 'sustain', 'uphold', 'continue'],
  move: ['transition', 'shift', 'relocate', 'progress', 'advance', 'transfer'],
  take: ['accept', 'adopt', 'undertake', 'assume', 'embrace', 'seize'],
  put: ['place', 'position', 'set', 'establish', 'deploy', 'install'],
  look: ['examine', 'review', 'inspect', 'explore', 'analyze', 'assess'],
  find: ['discover', 'identify', 'locate', 'uncover', 'determine', 'detect'],
  bring: ['introduce', 'deliver', 'present', 'contribute', 'provide', 'supply'],
  lead: ['guide', 'direct', 'manage', 'spearhead', 'oversee', 'head'],
  manage: ['oversee', 'handle', 'coordinate', 'administer', 'supervise', 'direct'],
  develop: ['create', 'build', 'design', 'engineer', 'craft', 'formulate'],
  team: ['group', 'squad', 'unit', 'crew', 'department', 'division'],
  problem: ['issue', 'challenge', 'obstacle', 'concern', 'difficulty', 'complication'],
  result: ['outcome', 'consequence', 'effect', 'impact', 'achievement', 'finding'],
  plan: ['strategy', 'approach', 'roadmap', 'blueprint', 'framework', 'scheme'],
  part: ['component', 'element', 'aspect', 'segment', 'section', 'portion'],
  also: ['additionally', 'furthermore', 'moreover', 'likewise', 'similarly', 'besides'],
  however: ['nevertheless', 'nonetheless', 'yet', 'still', 'although', 'conversely'],
  because: ['since', 'as', 'due to', 'owing to', 'given that', 'considering'],
  but: ['however', 'yet', 'although', 'nevertheless', 'on the other hand', 'still'],
  about: ['regarding', 'concerning', 'relating to', 'with respect to', 'pertaining to', 'as for'],
  responsible: ['accountable', 'in charge of', 'tasked with', 'overseeing', 'handling', 'managing'],
  experience: ['expertise', 'background', 'proficiency', 'knowledge', 'competence', 'skill set'],
  ability: ['capability', 'capacity', 'competence', 'aptitude', 'proficiency', 'skill'],
  strong: ['robust', 'powerful', 'solid', 'formidable', 'resilient', 'effective'],
  effective: ['efficient', 'productive', 'impactful', 'successful', 'capable', 'proficient'],
  ensure: ['guarantee', 'confirm', 'verify', 'secure', 'certify', 'safeguard'],
  achieve: ['accomplish', 'attain', 'reach', 'realize', 'fulfill', 'deliver'],
  support: ['assist', 'back', 'facilitate', 'enable', 'bolster', 'reinforce'],
  focus: ['concentrate', 'emphasize', 'prioritize', 'center on', 'target', 'dedicate'],
  provide: ['deliver', 'supply', 'offer', 'furnish', 'present', 'contribute'],
  include: ['encompass', 'incorporate', 'comprise', 'contain', 'feature', 'cover'],
  require: ['demand', 'necessitate', 'call for', 'expect', 'mandate', 'involve'],
  create: ['develop', 'design', 'produce', 'build', 'generate', 'establish'],
  maintain: ['preserve', 'sustain', 'uphold', 'continue', 'retain', 'keep up'],
  handle: ['manage', 'address', 'deal with', 'process', 'oversee', 'tackle'],
};

// Build reverse map so synonyms themselves can be looked up
const FULL_MAP: Record<string, string[]> = {};
for (const [word, syns] of Object.entries(SYNONYMS)) {
  FULL_MAP[word] = syns;
  for (const s of syns) {
    const key = s.toLowerCase();
    if (!FULL_MAP[key]) {
      FULL_MAP[key] = [word, ...syns.filter(x => x !== s)];
    }
  }
}

const getSynonyms = (word: string): string[] => {
  const lower = word.toLowerCase().trim();
  return FULL_MAP[lower] || [];
};

// Extract the core alphabetic word from a token (strip punctuation)
const extractCore = (token: string) => {
  const trimmed = token.trim();
  if (!trimmed) return { lead: '', core: '', trail: '', trimmed };
  const leadMatch = trimmed.match(/^([^a-zA-Z]*)/);
  const trailMatch = trimmed.match(/([^a-zA-Z]*)$/);
  const lead = leadMatch?.[1] || '';
  const trail = trailMatch?.[1] || '';
  const core = trimmed.slice(lead.length, trimmed.length - (trail.length || 0));
  return { lead, core, trail, trimmed };
};

const applyCasing = (original: string, replacement: string) => {
  if (!original || !replacement) return replacement;
  if (original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

// ── Token type for tracking changes ──────────────────────
interface OutputToken {
  raw: string;       // full token including whitespace
  core: string;      // the word part
  lead: string;      // leading punctuation
  trail: string;     // trailing punctuation
  changed: boolean;  // was this word replaced?
  hasSynonyms: boolean;
}

type Mode = 'standard' | 'formal' | 'casual' | 'concise';

const MODES: { key: Mode; label: string }[] = [
  { key: 'standard', label: 'Standard' },
  { key: 'formal', label: 'Formal' },
  { key: 'casual', label: 'Casual' },
  { key: 'concise', label: 'Concise' },
];

const MODE_PREFERENCES: Record<Mode, Record<string, string>> = {
  standard: {},
  formal: {
    good: 'excellent', bad: 'inadequate', happy: 'pleased', sad: 'disheartened',
    big: 'substantial', small: 'modest', fast: 'prompt', help: 'assist',
    make: 'establish', get: 'obtain', use: 'utilize', show: 'demonstrate',
    give: 'provide', think: 'consider', hard: 'challenging', easy: 'straightforward',
    start: 'commence', end: 'conclude', change: 'modify', need: 'require',
    want: 'seek', say: 'state', tell: 'inform', try: 'endeavor', look: 'examine',
    nice: 'agreeable', like: 'appreciate', but: 'however', because: 'owing to',
    also: 'furthermore', about: 'regarding', very: 'exceptionally',
  },
  casual: {
    good: 'great', bad: 'terrible', happy: 'cheerful', sad: 'gloomy',
    big: 'massive', small: 'tiny', fast: 'quick', help: 'give a hand',
    make: 'build', get: 'grab', use: 'go with', show: 'display',
    give: 'offer', think: 'feel', hard: 'tough', easy: 'simple',
    start: 'kick off', end: 'wrap up', change: 'switch up', need: 'gotta have',
    want: 'wish', say: 'mention', tell: 'let know', try: 'go for', look: 'check out',
    nice: 'lovely', however: 'still', because: 'since', also: 'plus', very: 'really',
  },
  concise: {
    good: 'fine', important: 'key', however: 'yet', because: 'as', also: 'and',
    very: '', utilize: 'use', demonstrate: 'show', facilitate: 'help',
    approximately: 'about', furthermore: 'also', nevertheless: 'yet',
  },
};

const buildTokens = (inputText: string, mode: Mode): { tokens: OutputToken[]; changeCount: number } => {
  const prefs = MODE_PREFERENCES[mode];
  const rawTokens = inputText.split(/(\s+)/);
  let changeCount = 0;

  const tokens: OutputToken[] = rawTokens.map((raw) => {
    const { lead, core, trail } = extractCore(raw);
    if (!core) return { raw, core: '', lead: '', trail: '', changed: false, hasSynonyms: false };

    const lower = core.toLowerCase();
    let replaced = core;
    let changed = false;

    // Mode-specific preference
    if (prefs[lower] !== undefined) {
      if (prefs[lower] === '') {
        changeCount++;
        return { raw: lead + trail, core: '', lead, trail, changed: true, hasSynonyms: false };
      }
      replaced = applyCasing(core, prefs[lower]);
      changed = true;
      changeCount++;
    } else {
      const syns = getSynonyms(core);
      if (syns.length > 0) {
        const pick = syns[Math.floor(Math.random() * syns.length)];
        replaced = applyCasing(core, pick);
        changed = true;
        changeCount++;
      }
    }

    const hasSynonyms = getSynonyms(replaced).length > 0 || getSynonyms(core).length > 0;
    return { raw: lead + replaced + trail, core: replaced, lead, trail, changed, hasSynonyms };
  });

  return { tokens, changeCount };
};

export const ParaphraserPage = () => {
  const [input, setInput] = useState('');
  const [tokens, setTokens] = useState<OutputToken[]>([]);
  const [mode, setMode] = useState<Mode>('standard');
  const [changeCount, setChangeCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Active word click
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const outputText = tokens.map(t => t.raw).join('');

  const handleParaphrase = useCallback(() => {
    if (!input.trim()) return;
    const { tokens: t, changeCount: c } = buildTokens(input, mode);
    setTokens(t);
    setChangeCount(c);
    setActiveIdx(null);
    setPopupPos(null);
  }, [input, mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setTokens([]);
    setChangeCount(0);
    setActiveIdx(null);
    setPopupPos(null);
  };

  // Close popup on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-word-idx]')
      ) {
        setActiveIdx(null);
        setPopupPos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWordClick = (idx: number, e: React.MouseEvent) => {
    if (activeIdx === idx) {
      setActiveIdx(null);
      setPopupPos(null);
      return;
    }
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = outputRef.current?.getBoundingClientRect();
    if (containerRect) {
      setPopupPos({
        top: rect.bottom - containerRect.top + 6,
        left: Math.max(0, rect.left - containerRect.left - 40),
      });
    }
    setActiveIdx(idx);
  };

  const replaceWord = (idx: number, newWord: string) => {
    setTokens(prev => {
      const updated = [...prev];
      const t = updated[idx];
      const replaced = applyCasing(t.core, newWord);
      updated[idx] = {
        ...t,
        raw: t.lead + replaced + t.trail,
        core: replaced,
        changed: true,
        hasSynonyms: getSynonyms(replaced).length > 0,
      };
      return updated;
    });
    setActiveIdx(null);
    setPopupPos(null);
  };

  const getActiveSynonyms = (): string[] => {
    if (activeIdx === null) return [];
    const t = tokens[activeIdx];
    if (!t?.core) return [];
    return getSynonyms(t.core);
  };

  const inputWordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;

  return (
    <div>
      <PageHeader
        title="Paraphraser"
        subtitle="Rewrite text with synonym suggestions. Click any highlighted word to swap it."
      />

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              mode === m.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'text-gray-600 border-gray-200 hover:border-brand-300 hover:bg-gray-50'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Two-box layout */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Input box */}
        <Card className="!p-0 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Original text</span>
            <span className="text-xs text-gray-400">{inputWordCount} words</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter or paste your text here..."
            className="flex-1 w-full resize-none p-4 text-sm text-gray-900 leading-relaxed focus:outline-none min-h-[280px] bg-transparent"
          />
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={handleClear}
              disabled={!input}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              <RotateCcw size={12} /> Clear
            </button>
            <Button onClick={handleParaphrase} disabled={!input.trim()} className="gap-2">
              <Type size={14} /> Paraphrase <ArrowRight size={13} />
            </Button>
          </div>
        </Card>

        {/* Output box */}
        <Card className="!p-0 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Paraphrased text</span>
            <div className="flex items-center gap-3">
              {changeCount > 0 && (
                <span className="text-xs text-brand-600 font-medium">{changeCount} words changed</span>
              )}
              <span className="text-xs text-gray-400">{outputWordCount} words</span>
            </div>
          </div>

          <div ref={outputRef} className="relative flex-1 p-4 text-sm leading-relaxed min-h-[280px] overflow-y-auto">
            {tokens.length > 0 ? (
              <div className="whitespace-pre-wrap">
                {tokens.map((t, idx) => {
                  // Whitespace-only token
                  if (!t.core) return <span key={idx}>{t.raw}</span>;

                  const isActive = activeIdx === idx;
                  const isChanged = t.changed;

                  return (
                    <span key={idx}>
                      {t.lead}
                      <span
                        data-word-idx={idx}
                        onClick={(e) => handleWordClick(idx, e)}
                        className={cn(
                          'rounded-[3px] transition-all duration-200 cursor-pointer px-0.5',
                          // Active (clicked) word: brand highlight
                          isActive && 'bg-brand-200 text-brand-800 ring-2 ring-brand-400',
                          // Changed words: orange highlight
                          isChanged && !isActive && 'bg-amber-100 text-amber-900',
                          // Unchanged words: subtle hover
                          !isChanged && !isActive && 'text-gray-900 hover:bg-gray-100',
                        )}
                      >
                        {t.core}
                      </span>
                      {t.trail}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-300 italic">Paraphrased text will appear here...</p>
            )}

            {/* Synonym popup (positioned near clicked word) */}
            {activeIdx !== null && popupPos && (
              <div
                ref={popupRef}
                className="absolute z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-xs"
                style={{ top: popupPos.top, left: popupPos.left }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">
                    Alternatives for "<span className="font-semibold text-gray-700">{tokens[activeIdx]?.core}</span>"
                  </p>
                  <button
                    onClick={() => { setActiveIdx(null); setPopupPos(null); }}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X size={12} />
                  </button>
                </div>
                {getActiveSynonyms().length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {getActiveSynonyms().map((syn) => (
                      <button
                        key={syn}
                        onClick={() => replaceWord(activeIdx, syn)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors"
                      >
                        {syn}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No alternatives available for this word.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            {tokens.length > 0 && (
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-200" /> Changed</span>
              </div>
            )}
            <button
              onClick={handleCopy}
              disabled={tokens.length === 0}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 disabled:opacity-40 transition-colors ml-auto"
            >
              {copied ? <><Check size={12} className="text-green-500" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
        </Card>
      </div>

      {tokens.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-2">
          <span className="inline-block w-2 h-2 rounded-sm bg-amber-100 border border-amber-200 mr-1 align-middle" />
          Highlighted words were changed.
          Click <strong>any word</strong> in the output to see alternative suggestions.
        </p>
      )}
    </div>
  );
};
