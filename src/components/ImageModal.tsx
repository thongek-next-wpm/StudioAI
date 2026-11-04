import React from 'react';
import { X, Download, Copy, Sparkles } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
  resolution?: string;
  aspectRatio?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  resolution = '1K',
  aspectRatio = '1:1'
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `gemini-artwork-${resolution}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-50 animate-in fade-in duration-200">
      <div className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="font-bold text-indigo-400">{resolution} Resolution</span>
            <span>·</span>
            <span>{aspectRatio}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy Prompt"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download Full Image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50">
          <img
            src={imageUrl}
            alt={prompt}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Prompt Caption */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800">
          <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-3">
            {prompt}
          </p>
        </div>
      </div>
    </div>
  );
};
