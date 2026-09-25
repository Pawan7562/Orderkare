import React, { useState, useRef, useEffect } from 'react';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, THEMES, AppTheme } from '../context/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, currentThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-sm"
        title="Switch Platform Theme"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
          style={{ backgroundColor: currentThemeConfig.dotColor, color: currentThemeConfig.dotColor }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline font-medium">{currentThemeConfig.name}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="absolute right-0 mt-2 w-72 bg-[#10141D] border border-white/[0.12] rounded-2xl shadow-2xl p-1.5 z-50 text-xs font-medium space-y-1 backdrop-blur-2xl shadow-black/90"
          >
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/[0.06] mb-1">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                Theme Presets
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Live Switch</span>
            </div>

            {THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                      : 'text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: t.dotColor }}
                    />
                    <div>
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <span>{t.name}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 leading-snug">{t.description}</p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
