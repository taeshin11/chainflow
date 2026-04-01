'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, X, Send } from 'lucide-react';

const feedbackTypes = [
  { value: 'bug', key: 'typeBug' },
  { value: 'feature', key: 'typeFeature' },
  { value: 'general', key: 'typeGeneral' },
  { value: 'data', key: 'typeData' },
] as const;

export default function FeedbackWidget() {
  const t = useTranslations('feedback');
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('general');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[ChainFlow ${feedbackType}] Feedback`);
    const body = encodeURIComponent(`Type: ${feedbackType}\n\n${message}`);
    window.open(`mailto:taeshinkim11@gmail.com?subject=${subject}&body=${body}`, '_self');
    setMessage('');
    setFeedbackType('general');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center
                    w-12 h-12 rounded-full bg-cf-primary text-white shadow-lg
                    hover:bg-cf-primary/90 hover:shadow-xl hover:scale-105
                    active:scale-95 transition-all duration-200
                    ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100'}`}
        aria-label={t('title')}
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          {/* Modal */}
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl animate-fade-in-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cf-border">
              <div>
                <h3 className="text-base font-heading font-semibold text-cf-text-primary">
                  {t('title')}
                </h3>
                <p className="text-xs text-cf-text-secondary mt-0.5">
                  {t('subtitle')}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg
                           text-cf-text-secondary hover:text-cf-text-primary hover:bg-gray-100
                           transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-cf-text-primary mb-1.5">
                  {t('typeLabel')}
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="cf-input"
                >
                  {feedbackTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {t(type.key)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-cf-text-primary mb-1.5">
                  {t('messageLabel')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  rows={4}
                  required
                  className="cf-input resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="cf-btn-secondary flex-1"
                >
                  {t('submit').includes('Cancel') ? 'Cancel' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="cf-btn-primary flex-1 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
