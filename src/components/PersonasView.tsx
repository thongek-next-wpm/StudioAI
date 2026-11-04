import React, { useState } from 'react';
import { Persona, Language } from '../types';
import { translations } from '../i18n/translations';
import { Bot, Sparkles, Code, Feather, Plus, Trash2, CheckCircle2, Shield, UserCheck } from 'lucide-react';

interface PersonasViewProps {
  personas: Persona[];
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  onCreatePersona: (persona: Partial<Persona>) => Promise<void>;
  onDeletePersona: (id: string) => Promise<void>;
  language: Language;
}

export const PersonasView: React.FC<PersonasViewProps> = ({
  personas,
  activePersonaId,
  onSelectPersona,
  onCreatePersona,
  onDeletePersona,
  language
}) => {
  const t = translations[language];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTh, setDescTh] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [category, setCategory] = useState('custom');

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'code':
        return <Code className="w-5 h-5 text-blue-500" />;
      case 'feather':
        return <Feather className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bot className="w-5 h-5 text-indigo-500" />;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !systemInstruction.trim()) return;
    await onCreatePersona({
      name_en: nameEn.trim(),
      name_th: nameTh.trim() || nameEn.trim(),
      description_en: descEn.trim(),
      description_th: descTh.trim() || descEn.trim(),
      system_instruction: systemInstruction.trim(),
      category,
      icon: 'bot'
    });
    setNameEn('');
    setNameTh('');
    setDescEn('');
    setDescTh('');
    setSystemInstruction('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'th' ? 'บทบาทระบบและคำสั่งเฉพาะทาง (AI Personas)' : 'System Personas & Roles'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'th'
                ? 'กำหนด System Instruction เพื่อควบคุมพฤติกรรม สไตล์การคิด และความเชี่ยวชาญของ Gemini'
                : 'Configure dedicated system instructions to govern Gemini roles, reasoning tone, and expertise.'}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.customPersonaTitle}</span>
          </button>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {personas.map((persona) => {
            const isActive = persona.id === activePersonaId;
            return (
              <div
                key={persona.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'border-indigo-600 dark:border-indigo-500 bg-white dark:bg-slate-900 shadow-md ring-1 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {getPersonaIcon(persona.icon)}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          {language === 'th' ? persona.name_th : persona.name_en}
                        </h2>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {persona.category} {persona.is_default ? '· System Default' : '· Custom'}
                        </span>
                      </div>
                    </div>

                    {!persona.is_default && (
                      <button
                        onClick={() => onDeletePersona(persona.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Persona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {language === 'th' ? persona.description_th : persona.description_en}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-[11px] text-slate-600 dark:text-slate-400 mb-4 font-mono">
                    <span className="font-semibold text-slate-500 block mb-1">System Instruction:</span>
                    <p className="line-clamp-3">{persona.system_instruction}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    {isActive ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Role</span>
                      </span>
                    ) : (
                      'Available'
                    )}
                  </span>

                  <button
                    onClick={() => onSelectPersona(persona.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isActive ? 'Current' : 'Select Role'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Create Persona */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.customPersonaTitle}
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.personaNameEn}
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder="e.g. Legal Analyst"
                      required
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.personaNameTh}
                    </label>
                    <input
                      type="text"
                      value={nameTh}
                      onChange={(e) => setNameTh(e.target.value)}
                      placeholder="เช่น ผู้เชี่ยวชาญกฎหมาย"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Description (EN)
                  </label>
                  <input
                    type="text"
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Short description of capabilities"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.systemInstructionLabel}
                  </label>
                  <textarea
                    rows={4}
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    placeholder="You are an expert... Your goals are... Always respond with..."
                    required
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t.close}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                  >
                    {t.savePersona}
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
