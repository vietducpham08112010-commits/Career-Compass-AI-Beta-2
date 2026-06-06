import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface InlineGuideProps {
  sectionKey: string;
  lang: 'vi' | 'en';
  title?: string;
  steps: string[];
}

export const InlineGuide: React.FC<InlineGuideProps> = ({
  sectionKey,
  lang,
  title,
  steps
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isVi = lang === 'vi';

  const defaultTitle = title || (isVi ? "💡 Hướng dẫn nhanh" : "💡 Quick Guide");

  return (
    <div className="mb-6 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl overflow-hidden shadow-sm transition-all text-xs font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-indigo-50/70 dark:hover:bg-indigo-950/20 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
            {defaultTitle}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400">
          <span>{isOpen ? (isVi ? "Ẩn" : "Hide") : (isVi ? "Xem" : "Show")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 pt-1 border-t border-indigo-100/40 dark:border-indigo-500/5 space-y-2">
              <ul className="space-y-2 list-none p-0 m-0 text-gray-600 dark:text-gray-400">
                {steps.map((st, i) => (
                  <li key={i} className="flex gap-2.5 items-start leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[11px] font-sans font-medium text-gray-700 dark:text-gray-300">
                      {st}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
