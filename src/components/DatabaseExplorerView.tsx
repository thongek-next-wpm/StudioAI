import React, { useState, useEffect } from 'react';
import { DatabaseStats, KnowledgeItem, Language } from '../types';
import { translations } from '../i18n/translations';
import { api } from '../api';
import { Database, Download, Search, Plus, Trash2, Table, RefreshCw, CheckCircle2, FileText, Layers } from 'lucide-react';

interface DatabaseExplorerViewProps {
  stats: DatabaseStats | null;
  onRefreshStats: () => Promise<void>;
  language: Language;
}

export const DatabaseExplorerView: React.FC<DatabaseExplorerViewProps> = ({
  stats,
  onRefreshStats,
  language
}) => {
  const t = translations[language];
  const [activeTable, setActiveTable] = useState<'conversations' | 'messages' | 'images' | 'knowledge'>('conversations');
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modal for adding knowledge
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');

  const loadTableData = async () => {
    setIsLoading(true);
    try {
      if (activeTable === 'conversations') {
        const data = await api.getConversations();
        setTableData(data);
      } else if (activeTable === 'images') {
        const data = await api.getImages();
        setTableData(data);
      } else if (activeTable === 'knowledge') {
        const data = await api.getKnowledge();
        setTableData(data);
      } else if (activeTable === 'messages') {
        // Fetch all conversations to aggregate recent messages
        const convs = await api.getConversations();
        const allMsgs: any[] = [];
        for (const c of convs.slice(0, 10)) {
          const detail = await api.getConversation(c.id);
          allMsgs.push(...detail.messages);
        }
        setTableData(allMsgs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTableData();
  }, [activeTable]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studio-sqlite-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await api.createKnowledge({ title: newTitle, content: newContent, category: newCategory });
      setNewTitle('');
      setNewContent('');
      setShowAddKnowledge(false);
      await onRefreshStats();
      if (activeTable === 'knowledge') {
        await loadTableData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await api.deleteKnowledge(id);
      await onRefreshStats();
      await loadTableData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredData = tableData.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Export Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'th' ? 'ระบบจัดการฐานข้อมูล SQLite (Server Database)' : 'Server SQLite Database Manager'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'th'
                ? 'จัดเก็บข้อมูลแชท ภาพที่สร้าง และองค์ความรู้อย่างถาวรบนเซิร์ฟเวอร์ด้วย SQLite 3 ในโหมด WAL'
                : 'Persistent storage for chat turns, generative visuals, and knowledge docs via SQLite 3 (WAL mode).'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.exportDbBtn}</span>
            </button>
            <button
              onClick={() => {
                onRefreshStats();
                loadTableData();
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors shadow-xs"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Database Metric Cards (Zero Pill, Tabular Numerals) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t.conversationsCount}</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats?.conversations ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t.messagesCount}</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats?.messages ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t.imagesCount}</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              {stats?.images ?? 0}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t.knowledgeCount}</span>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats?.knowledge ?? 0}
            </div>
          </div>
        </div>

        {/* Table Selector & Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Table switcher tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <button
                onClick={() => setActiveTable('conversations')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTable === 'conversations'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                conversations
              </button>
              <button
                onClick={() => setActiveTable('messages')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTable === 'messages'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                messages
              </button>
              <button
                onClick={() => setActiveTable('images')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTable === 'images'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                generated_images
              </button>
              <button
                onClick={() => setActiveTable('knowledge')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTable === 'knowledge'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                knowledge_items
              </button>
            </div>

            {/* Search Input & Action */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchDbPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {activeTable === 'knowledge' && (
                <button
                  onClick={() => setShowAddKnowledge(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'th' ? 'เพิ่มเอกสาร' : 'Add Doc'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Data Viewport */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading records...</div>
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No records match your query.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {Object.keys(filteredData[0] || {})
                      .filter((k) => k !== 'image_url') // Hide heavy image base64 from raw table
                      .map((key) => (
                        <th key={key} className="px-3.5 py-2.5 font-mono capitalize">
                          {key}
                        </th>
                      ))}
                    {activeTable === 'knowledge' && <th className="px-3 py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {Object.entries(row)
                        .filter(([k]) => k !== 'image_url')
                        .map(([k, val]: any, cellIdx) => (
                          <td key={cellIdx} className="px-3.5 py-2.5 max-w-xs truncate font-mono text-[11px]">
                            {typeof val === 'number' && k.includes('at')
                              ? new Date(val).toLocaleString()
                              : String(val ?? '')}
                          </td>
                        ))}
                      {activeTable === 'knowledge' && (
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleDeleteKnowledge(row.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal: Add Knowledge Document */}
        {showAddKnowledge && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.addKnowledgeTitle}
              </h2>
              <form onSubmit={handleCreateKnowledge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.docTitle}
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.docContent}
                  </label>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddKnowledge(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t.close}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    {t.saveDoc}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
