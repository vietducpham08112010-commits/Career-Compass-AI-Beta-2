import React from 'react';
import { motion } from 'motion/react';
import { Clarification } from '../types';

interface ClarificationCardProps {
  clarification: Clarification;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({ clarification, onSelect, disabled }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl shadow-sm"
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {clarification.question}
      </p>
      <div className="flex flex-wrap gap-2">
        {clarification.options.map((option, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelect(option)}
            className="px-4 py-2 text-sm font-medium bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/30 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {option}
          </button>
        ))}
      </div>
    </motion.div>
  );
};
