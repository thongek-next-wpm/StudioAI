import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Conversation, Message, Persona, ModelTier, Language } from '../types';
import { translations } from '../i18n/translations';
import { Send, Sparkles, Zap, Brain, Bot, User, Copy, Check, Clock, ShieldCheck, ChevronDown } from 'lucide-react';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: Message[];
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  activeModel: ModelTier;
  onSelectModel: (model: ModelTier) => void;
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  language: Language;
  onViewImage?: (url: string, prompt: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  messages,
  personas,
  activePersonaId,
  onSelectPersona,
  activeModel,
  onSelectModel,
  onSendMessage,
  isLoading,
  language,
  onViewImage
}) => {
  const t = translations[language];
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const starterPrompts = [
    t.prompt1,
    t.prompt2,
    t.prompt3,
    t.prompt4
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/30 dark:bg-slate-950 overflow-hidden relative">
      {/* Chat Top Toolbar: Model & Persona Selector */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-4 shrink-0">
        {/* Model Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => onSelectModel('gemini-3.1-flash-lite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeModel === 'gemini-3.1-flash-lite'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={t.modelLiteDesc}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Flash-Lite</span>
            <span className="text-[10px] opacity-70 hidden sm:inline">(Fast)</span>
          </button>

          <button
            onClick={() => onSelectModel('gemini-3.8-flash')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeModel === 'gemini-3.8-flash'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={t.modelFlashDesc}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3.8</span>
            <span className="text-[10px] opacity-70 hidden sm:inline">(Balanced)</span>
          </button>

          <button
            onClick={() => onSelectModel('gemini-4-argon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeModel === 'gemini-4-argon'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={t.modelArgonDesc}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>4-Argon</span>
            <span className="text-[10px] opacity-70 hidden sm:inline">(Deep Reasoning)</span>
          </button>
        </div>

        {/* Persona Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <span className="text-slate-500">{t.selectPersona}:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {language === 'th' ? activePersona?.name_th : activePersona?.name_en}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPersonaDropdown && (
            <div className="absolute right-0 mt-2 w-72 p-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.selectPersona}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {personas.map((persona) => {
                  const isSelected = persona.id === activePersonaId;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        onSelectPersona(persona.id);
                        setShowPersonaDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {language === 'th' ? persona.name_th : persona.name_en}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {language === 'th' ? persona.description_th : persona.description_en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-500/30 mx-auto mb-4 shadow-md">
              <img
                src="/src/assets/images/ai_studio_avatar_1793783476686.jpg"
                alt="Studio AI"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {language === 'th' ? activePersona?.name_th : activePersona?.name_en}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
              {language === 'th' ? activePersona?.description_th : activePersona?.description_en}
            </p>

            {/* Quick Starters */}
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
                {t.samplePromptsTitle}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {starterPrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(promptText);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 text-left text-xs text-slate-700 dark:text-slate-300 transition-all hover:shadow-xs group"
                  >
                    <span className="line-clamp-2">{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {/* Model header info for assistant */}
                  {!isUser && msg.model_used && (
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {msg.model_used}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Image attachment if exists */}
                  {msg.image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img
                        src={msg.image_url}
                        alt="Generated Artwork"
                        className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => onViewImage && onViewImage(msg.image_url!, msg.content)}
                      />
                    </div>
                  )}

                  {/* Markdown or plain text content */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    title={t.copy}
                    className={`absolute right-2 -bottom-3 opacity-0 group-hover:opacity-100 p-1 rounded-md text-[11px] flex items-center gap-1 transition-all shadow-xs ${
                      isUser
                        ? 'bg-slate-800 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.copy}</span>
                      </>
                    )}
                  </button>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mx-auto justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {activeModel === 'gemini-3.1-flash-lite'
                  ? (language === 'th' ? 'กำลังประมวลผลความหน่วงต่ำ...' : 'Generating low-latency response...')
                  : (language === 'th' ? 'กำลังวิเคราะห์คำตอบ...' : 'Reasoning response...')}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={t.chatPlaceholder}
            className="w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 pr-14 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            style={{ maxHeight: '160px' }}
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-xs"
            title={t.send}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="max-w-3xl mx-auto flex items-center justify-between mt-2 text-[11px] text-slate-400 dark:text-slate-500 px-1">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SQLite Persistent History</span>
          </div>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
