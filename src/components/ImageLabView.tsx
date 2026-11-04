import React, { useState } from 'react';
import { GeneratedImage, ImageResolution, AspectRatio, Language } from '../types';
import { translations } from '../i18n/translations';
import { Sparkles, Download, Copy, Check, Eye, Trash2, Layers, Sliders, Image as ImageIcon } from 'lucide-react';

interface ImageLabViewProps {
  images: GeneratedImage[];
  onGenerate: (prompt: string, resolution: ImageResolution, aspectRatio: AspectRatio) => Promise<void>;
  onDeleteImage: (id: string) => Promise<void>;
  isLoading: boolean;
  language: Language;
  onViewImage: (url: string, prompt: string, resolution?: string, aspectRatio?: string) => void;
}

export const ImageLabView: React.FC<ImageLabViewProps> = ({
  images,
  onGenerate,
  onDeleteImage,
  isLoading,
  language,
  onViewImage
}) => {
  const t = translations[language];
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<ImageResolution>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const stylePresets = [
    { label: 'Cinematic Studio', suffix: 'cinematic 35mm photography, dramatic rim lighting, shallow depth of field, 8k resolution' },
    { label: 'Minimalist Architecture', suffix: 'clean brutalist travertine marble architecture, warm soft natural daylight, minimalist aesthetic' },
    { label: 'Cyberpunk Bangkok', suffix: 'futuristic neon cyberpunk night cityscape, rain reflections, volumetric atmospheric haze' },
    { label: 'Anime Concept Art', suffix: 'Makoto Shinkai aesthetic, luminous clouds, rich vibrant color palette, anime concept art' },
    { label: 'Oil Painting Masterpiece', suffix: 'rich textured impasto oil painting, dynamic brushstrokes, classical dramatic chiaroscuro' },
  ];

  const handleApplyPreset = (suffix: string) => {
    if (!prompt.trim()) {
      setPrompt(suffix);
    } else {
      setPrompt(`${prompt.trim()}, ${suffix}`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await onGenerate(prompt, resolution, aspectRatio);
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.image_url;
    link.download = `gemini-studio-${img.resolution}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'th' ? 'สตูดิโอสร้างภาพความละเอียดสูง (Gemini 3 Pro)' : 'High-Resolution Generative Studio (Gemini 3 Pro)'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'th'
              ? 'รองรับการเลือกความละเอียด 1K, 2K และ 4K พร้อมบันทึกภาพและประวัติคำสั่งลงฐานข้อมูล SQLite อัตโนมัติ'
              : 'Select resolution (1K, 2K, 4K) and aspect ratios with instant SQLite database persistence.'}
          </p>
        </div>

        {/* Generator Controls Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {t.promptDetails}
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.imagePromptPlaceholder}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Style Presets */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {t.stylePresetsLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {stylePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset.suffix)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Affordance (1K, 2K, 4K) & Aspect Ratio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Resolution Picker (Affordance as requested) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>{t.resolutionLabel}</span>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                    {resolution}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['1K', '2K', '4K'] as ImageResolution[]).map((resOption) => {
                    const isSelected = resolution === resOption;
                    return (
                      <button
                        key={resOption}
                        type="button"
                        onClick={() => setResolution(resOption)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-sm tracking-tight">{resOption}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {resOption === '1K' ? '1024px' : resOption === '2K' ? '2048px' : '4096px'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {resolution === '1K' ? t.resolution1kDesc : resolution === '2K' ? t.resolution2kDesc : t.resolution4kDesc}
                </p>
              </div>

              {/* Aspect Ratio Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>{t.aspectRatioLabel}</span>
                  <span className="font-mono text-[11px] text-slate-500">{aspectRatio}</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as AspectRatio[]).map((arOption) => {
                    const isSelected = aspectRatio === arOption;
                    return (
                      <button
                        key={arOption}
                        type="button"
                        onClick={() => setAspectRatio(arOption)}
                        className={`py-2 px-1 rounded-lg border text-center transition-colors text-xs font-medium font-mono ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {arOption}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.generatingImage}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t.generateImageBtn} ({resolution})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* SQLite Generated Gallery */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'th' ? 'คลังภาพที่สร้างแล้วใน SQLite' : 'SQLite Image Archive'}</span>
              <span className="text-xs font-mono text-slate-500 tabular-nums">({images.length})</span>
            </h2>
          </div>

          {images.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'th'
                  ? 'ยังไม่มีภาพในคลัง เริ่มพิมพ์คำสั่งสร้างภาพความละเอียด 1K, 2K หรือ 4K ด้านบน'
                  : 'No archived images yet. Generate your first 1K, 2K, or 4K artwork above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
                >
                  {/* Image Viewport */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onViewImage(img.image_url, img.prompt, img.resolution, img.aspect_ratio)}>
                    <img
                      src={img.image_url}
                      alt={img.prompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      <span className="font-bold">{img.resolution}</span>
                      <span>·</span>
                      <span>{img.aspect_ratio}</span>
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 bg-white/90 text-slate-900 rounded-full">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Metadata and Controls */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 mb-3">
                      {img.prompt}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span className="font-mono tabular-nums">
                        {new Date(img.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyPrompt(img.id, img.prompt)}
                          title={t.copy}
                          className="p-1.5 hover:text-indigo-600 transition-colors rounded"
                        >
                          {copiedId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDownload(img)}
                          title={t.downloadImage}
                          className="p-1.5 hover:text-indigo-600 transition-colors rounded"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteImage(img.id)}
                          title="Delete from SQLite"
                          className="p-1.5 hover:text-red-500 transition-colors rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
