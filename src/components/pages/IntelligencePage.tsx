'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { macroNarratives, type MacroNarrative } from '@/data/macro-narratives';
import {
  Brain,
  Send,
  Loader2,
  BookOpen,
  Tag,
  ArrowRight,
  Scale,
  TrendingUp,
  Eye,
  RefreshCw,
  Shield,
  Radar,
  Globe,
  Zap,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  RefreshCw: <RefreshCw className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Radar: <Radar className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
};

const categoryColorMap: Record<string, string> = {
  'power-structure': 'bg-red-50 text-red-700 border-red-200',
  monetary: 'bg-blue-50 text-blue-700 border-blue-200',
  geopolitical: 'bg-teal-50 text-teal-700 border-teal-200',
  information: 'bg-purple-50 text-purple-700 border-purple-200',
  regulatory: 'bg-amber-50 text-amber-700 border-amber-200',
};

function categoryLabel(cat: MacroNarrative['category'], t: ReturnType<typeof useTranslations<'intelligence'>>): string {
  const map: Record<MacroNarrative['category'], string> = {
    'power-structure': t('categoryPower'),
    monetary: t('categoryMonetary'),
    geopolitical: t('categoryGeopolitical'),
    information: t('categoryInformation'),
    regulatory: t('categoryRegulatory'),
  };
  return map[cat];
}

function NarrativeCard({ n, t }: { n: MacroNarrative; t: ReturnType<typeof useTranslations<'intelligence'>> }) {
  return (
    <div className={`cf-card p-5 border ${n.color.split(' ').filter(c => c.startsWith('border')).join(' ')} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${n.color}`}>
          {iconMap[n.icon] ?? <Brain className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColorMap[n.category]}`}>
              {categoryLabel(n.category, t)}
            </span>
          </div>
          <h3 className="text-base font-heading font-bold text-cf-text-primary leading-tight">{n.title}</h3>
          <p className="text-xs text-cf-text-secondary mt-0.5">{n.titleKo}</p>
        </div>
      </div>

      <p className="text-sm text-cf-text-secondary leading-relaxed mb-3">{n.summary}</p>

      {/* Key concepts */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {n.keyConceptsEn.slice(0, 4).map((kc) => (
          <span key={kc} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            {kc}
          </span>
        ))}
      </div>

      {/* Related tickers */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {n.relatedTickers.slice(0, 5).map((tk) => (
          <Link
            key={tk}
            href={`/company/${tk}`}
            className="text-[10px] font-mono font-bold text-cf-primary bg-cf-primary/10 px-2 py-0.5 rounded hover:bg-cf-primary/20 transition-colors"
          >
            {tk}
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-cf-border">
        {n.blogSlug ? (
          <Link
            href={`/blog/${n.blogSlug}`}
            className="flex items-center gap-1.5 text-xs font-medium text-cf-primary hover:underline"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t('readDeepDive')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-xs text-cf-text-secondary/50 italic">{t('learnMore')}</span>
        )}
      </div>
    </div>
  );
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function IntelligencePage() {
  const t = useTranslations('intelligence');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const narrativeContext = macroNarratives
        .map((n) => `${n.title}: ${n.summary} Key concepts: ${n.keyConceptsEn.join(', ')}. Related tickers: ${n.relatedTickers.join(', ')}.`)
        .join('\n\n');

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are Flowvium's Macro Intelligence system. You understand the hidden structural forces that drive capital markets: regulatory capture, the Cantillon effect, dark pools, the revolving door, military-industrial complex, information asymmetry, sovereign wealth flows, and crisis-as-wealth-transfer.

Available macro narratives context:
${narrativeContext}

User question: ${text}

Provide a concise, insightful answer (3-5 paragraphs) connecting the question to real market mechanisms, specific tickers or sectors when relevant, and actionable investment implications. Be analytical and direct — not generic.`,
          type: 'macro_intelligence',
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.analysis }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Analysis temporarily unavailable. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-cf-bg">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Brain className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200">{t('title')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold mb-4 leading-tight">
            {t('subtitle')}
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
        {/* AI Chat */}
        <div className="cf-card overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-3">
            <Brain className="w-5 h-5 text-amber-400" />
            <span className="text-white font-heading font-bold">{t('askQuestion')}</span>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-4 min-h-[120px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-cf-text-secondary text-center py-6 italic">
                {t('askPlaceholder')}
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cf-primary text-white rounded-br-sm'
                      : 'bg-gray-50 text-cf-text-primary border border-cf-border rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-cf-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-cf-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('analyzing')}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 border-t border-cf-border pt-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('askPlaceholder')}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-cf-border bg-gray-50 px-4 py-3 text-sm text-cf-text-primary placeholder:text-cf-text-secondary/60 focus:outline-none focus:border-cf-primary focus:bg-white transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-cf-primary text-white disabled:opacity-40 hover:bg-cf-primary/90 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Narrative Cards */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-2">
            {t('relatedThemes')}
          </h2>
          <p className="text-sm text-cf-text-secondary mb-6">
            8 structural forces that explain how power and capital actually move.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {macroNarratives.map((n) => (
              <NarrativeCard key={n.id} n={n} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
