import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language, PortfolioItem, UserProfile } from '../types';
import { get, set } from 'idb-keyval';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PortfolioProps {
  language: Language;
  userId: string;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ language, userId, updateUserProfile }) => {
  const t = TRANSLATIONS[language];
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [type, setType] = useState<'certificate' | 'grade' | 'project'>('certificate');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [score, setScore] = useState('');
  const [link, setLink] = useState('');

  const cvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadItems = async () => {
      const stored = await get(`portfolio_${userId}`);
      if (stored) {
        setItems(stored);
      }
    };
    loadItems();
  }, [userId]);

  const saveItems = async (newItems: PortfolioItem[]) => {
    setItems(newItems);
    await set(`portfolio_${userId}`, newItems);
    updateUserProfile({ portfolio: newItems });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newItem: PortfolioItem = {
      id: editingId || Date.now().toString(),
      type,
      title,
      description,
      date,
      score,
      link
    };

    let updatedItems;
    if (editingId) {
      updatedItems = items.map(item => item.id === editingId ? newItem : item);
    } else {
      updatedItems = [newItem, ...items];
    }

    await saveItems(updatedItems);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    await saveItems(updatedItems);
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title);
    setDescription(item.description);
    setDate(item.date);
    setScore(item.score || '');
    setLink(item.link || '');
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setType('certificate');
    setTitle('');
    setDescription('');
    setDate('');
    setScore('');
    setLink('');
  };

  const exportCV = async () => {
    if (!cvRef.current) return;
    try {
      const canvas = await html2canvas(cvRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('My_CV_Portfolio.pdf');
    } catch (error) {
      console.error('Error exporting CV:', error);
    }
  };

  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'certificate': return <Icons.Award className="w-5 h-5 text-yellow-500" />;
      case 'grade': return <Icons.GraduationCap className="w-5 h-5 text-blue-500" />;
      case 'project': return <Icons.Briefcase className="w-5 h-5 text-emerald-500" />;
      default: return <Icons.FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'certificate': return t.typeCertificate;
      case 'grade': return t.typeGrade;
      case 'project': return t.typeProject;
      default: return itemType;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#0a0a0a] overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Icons.FolderOpen className="w-6 h-6 text-indigo-500" />
              {t.portfolio}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t.portfolioDesc}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {isAdding ? <Icons.X className="w-4 h-4" /> : <Icons.Plus className="w-4 h-4" />}
              {isAdding ? 'Cancel' : t.addPortfolioItem}
            </button>
            {items.length > 0 && (
              <button
                onClick={exportCV}
                className="px-4 py-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Icons.Download className="w-4 h-4" />
                {t.exportCV}
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 overflow-hidden"
              onSubmit={handleSave}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t.itemType}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  >
                    <option value="certificate">{t.typeCertificate}</option>
                    <option value="grade">{t.typeGrade}</option>
                    <option value="project">{t.typeProject}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t.itemTitle}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. IELTS 7.5, 1st Prize Math Olympiad"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t.itemDesc}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the achievement, project details, or what you learned..."
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none min-h-[80px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t.itemDate}</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. 2023 - 2024, May 2024"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t.itemScore}</label>
                  <input
                    type="text"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 9.5/10, Top 10%"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t.itemLink}</label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Save Item
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* List of Items */}
        {items.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
              <Icons.FolderPlus className="w-10 h-10 text-indigo-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              {t.noPortfolioItems}
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {t.addPortfolioItem}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                          {getTypeLabel(item.type)}
                        </span>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                      >
                        <Icons.Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {item.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Icons.Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </div>
                    {item.score && (
                      <div className="flex items-center gap-1.5">
                        <Icons.Target className="w-3.5 h-3.5" />
                        {item.score}
                      </div>
                    )}
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-indigo-500 hover:underline"
                      >
                        <Icons.ExternalLink className="w-3.5 h-3.5" />
                        Link
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Hidden CV Export Template */}
        <div className="hidden">
          <div ref={cvRef} className="bg-white p-10 w-[800px] text-black font-sans">
            <h1 className="text-3xl font-bold border-b-2 border-gray-800 pb-4 mb-6">Curriculum Vitae / Portfolio</h1>
            
            {['grade', 'certificate', 'project'].map(type => {
              const typeItems = items.filter(i => i.type === type);
              if (typeItems.length === 0) return null;
              
              return (
                <div key={type} className="mb-8">
                  <h2 className="text-xl font-bold text-indigo-700 uppercase tracking-wider mb-4">
                    {getTypeLabel(type)}
                  </h2>
                  <div className="space-y-4">
                    {typeItems.map(item => (
                      <div key={item.id} className="border-l-2 border-gray-200 pl-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.date}</span>
                        </div>
                        {item.score && <p className="text-sm font-semibold text-indigo-600 mt-1">Score/Result: {item.score}</p>}
                        <p className="text-gray-700 mt-2 text-sm leading-relaxed">{item.description}</p>
                        {item.link && <p className="text-sm text-blue-500 mt-1">{item.link}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
