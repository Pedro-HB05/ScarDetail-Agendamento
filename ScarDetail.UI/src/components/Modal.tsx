import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'light' | 'dark' | 'auto';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  variant = 'auto',
}) => {
  const location = useLocation();
  const isDark = variant === 'dark' || (variant === 'auto' && location.pathname.startsWith('/admin'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
        isDark ? 'bg-black/75' : 'bg-slate-950/40'
      } backdrop-blur-sm animate-in fade-in duration-200`}
    >
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidthClasses} ${
          isDark
            ? 'bg-slate-900 border border-slate-800 text-white'
            : 'bg-white border border-stone-200 text-slate-900'
        } rounded-3xl shadow-2xl overflow-hidden z-10 transition-all`}
      >
        <div
          className={`flex items-center justify-between px-6 py-4.5 border-b ${
            isDark
              ? 'border-slate-800 bg-slate-900/60 text-white'
              : 'border-stone-100 bg-stone-50/80 text-slate-900'
          }`}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-stone-400 hover:text-slate-800 hover:bg-stone-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
