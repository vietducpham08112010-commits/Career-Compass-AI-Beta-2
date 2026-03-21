import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { UserProfile, Language, PortfolioItem, Theme } from '../types';
import { TRANSLATIONS } from '../constants';

interface PortfolioProps {
  user: UserProfile | null;
  language: Language;
  theme: Theme;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ user, language, theme, onUpdateUser, showToast }) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PortfolioItem>>({
    type: 'Certificate',
    title: '',
    description: '',
    date: '',
    score: '',
    link: ''
  });

  const t = TRANSLATIONS[language];

  const handleAddItem = () => {
    if (!newItem.title) {
      showToast(t.enterTitleError, 'error');
      return;
    }

    const item: PortfolioItem = {
      id: Math.random().toString(36).substring(7),
      type: newItem.type as any,
      title: newItem.title,
      description: newItem.description || '',
      date: newItem.date || '',
      score: newItem.score || '',
      link: newItem.link || ''
    };

    const currentPortfolio = user?.portfolio || [];
    onUpdateUser({ portfolio: [...currentPortfolio, item] });
    setIsAddingItem(false);
    setNewItem({ type: 'Certificate', title: '', description: '', date: '', score: '', link: '' });
    showToast(t.itemAdded, 'success');
  };

  const deleteItem = (id: string) => {
    const currentPortfolio = user?.portfolio || [];
    onUpdateUser({ portfolio: currentPortfolio.filter(item => item.id !== id) });
    showToast(t.itemRemoved, 'info');
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'Certificate': return <Icons.Award className="w-5 h-5" />;
      case 'Grade/Score': return <Icons.GraduationCap className="w-5 h-5" />;
      case 'Personal Project': return <Icons.Code className="w-5 h-5" />;
      default: return <Icons.FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#050505] overflow-y-auto">
      <div className="w-full p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t.portfolio}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t.portfolioDesc}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsAddingItem(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Icons.Plus className="w-5 h-5" />
              <span>{t.addPortfolioItem}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isAddingItem && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10 p-6 mb-8 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.addPortfolioItem}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{t.itemType}</label>
                  <select 
                    value={newItem.type} 
                    onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Certificate">{t.typeCertificate}</option>
                    <option value="Grade/Score">{t.typeGrade}</option>
                    <option value="Personal Project">{t.typeProject}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{t.itemTitle}</label>
                  <input 
                    type="text" 
                    value={newItem.title} 
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    placeholder={t.placeholderPortfolioTitle}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{t.itemDesc}</label>
                  <textarea 
                    value={newItem.description} 
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder={t.placeholderPortfolioDesc}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{t.itemDate}</label>
                  <input 
                    type="text" 
                    value={newItem.date} 
                    onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                    placeholder={t.placeholderPortfolioDate}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{t.itemScore}</label>
                  <input 
                    type="text" 
                    value={newItem.score} 
                    onChange={(e) => setNewItem({...newItem, score: e.target.value})}
                    placeholder={t.placeholderPortfolioScore}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddingItem(false)}
                  className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleAddItem}
                  className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {(!user?.portfolio || user.portfolio.length === 0) ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-[#111] rounded-3xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.FolderOpen className="w-8 h-8" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">{t.noPortfolioItems}</p>
              </motion.div>
            ) : (
              user.portfolio.map((item, index) => (
                <motion.div 
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05,
                    layout: { type: "spring", stiffness: 300, damping: 30 }
                  }}
                  className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-5 flex items-start gap-4 group hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all"
                >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  {getItemIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Icons.Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {item.date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Icons.Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </div>
                    )}
                    {item.score && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Icons.Star className="w-3.5 h-3.5" />
                        {item.score}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
