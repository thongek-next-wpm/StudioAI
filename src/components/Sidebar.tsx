import React from 'react';
import { Conversation, Language } from '../types';
import { translations } from '../i18n/translations';
import { MessageSquare, Trash2, Plus, Database, Sparkles, Code, Feather, Bot } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  language
}) => {
  const t = translations[language];

  const getPersonaIcon = (iconName?: string) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-blue-500" />;
      case 'feather':
        return <Feather className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Bot className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex flex-col h-full shrink-0">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {language === 'th' ? 'ประวัติบทสนทนา (SQLite)' : 'Sessions (SQLite)'}
        </span>
        <button
          onClick={onNewConversation}
          title={t.newChat}
          className="p-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {t.noConversations}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-slate-800/80 shadow-xs text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {getPersonaIcon(conv.persona_icon)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-xs font-medium truncate">
                    {conv.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="font-mono tabular-nums">{conv.message_count || 0} msgs</span>
                    <span>·</span>
                    <span className="truncate">{conv.model.replace('gemini-', '')}</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => onDeleteConversation(conv.id, e)}
                  title="Delete session"
                  className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer with SQLite Database Indicator */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono text-[11px]">studio.db</span>
          </div>
          <span className="font-mono text-[11px] tabular-nums">
            {conversations.length} sessions
          </span>
        </div>
      </div>
    </aside>
  );
};
