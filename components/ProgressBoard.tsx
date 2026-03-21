import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import * as Icons from 'lucide-react';
import { ChatSession, UserProfile, Language, ChatMessage, Milestone, Theme } from '../types';
import { generateRoadmap } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';

interface ProgressBoardProps {
  chatHistory: ChatSession[];
  messages: ChatMessage[];
  user: UserProfile | null;
  language: Language;
  theme: Theme;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToChat: () => void;
}

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ chatHistory, messages, user, language, theme, milestones, setMilestones, showToast, onNavigateToChat }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  const handleGenerateRoadmap = async () => {
    if (chatHistory.length === 0 && messages.length === 0) {
      onNavigateToChat();
      return;
    }

    setIsGenerating(true);
    try {
      // Flatten chat history for the prompt
      const savedHistoryContext = chatHistory.flatMap(session => 
        session.messages.map(m => ({ role: m.role, text: m.text }))
      );
      const currentHistoryContext = messages.map(m => ({ role: m.role, text: m.text }));
      const historyContext = [...savedHistoryContext, ...currentHistoryContext];
      
      const generatedMilestones = await generateRoadmap(historyContext, language, user);
      
      if (!Array.isArray(generatedMilestones)) {
        throw new Error("Invalid roadmap format received from AI.");
      }
      
      // Ensure comments array exists
      const processedMilestones = generatedMilestones.map((m: any) => ({
        ...m,
        id: m.id || Math.random().toString(36).substring(7),
        status: m.status || 'todo',
        comments: []
      }));
      
      setMilestones(processedMilestones);
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      showToast(t.failedToGenerateRoadmap, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStatus = (id: string) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'todo' ? 'in-progress' : m.status === 'in-progress' ? 'done' : 'todo';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  const addComment = (id: string) => {
    if (!commentText.trim()) return;
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, comments: [...(m.comments || []), commentText.trim()] };
      }
      return m;
    }));
    setCommentText('');
    setActiveCommentId(null);
  };

  const exportToPDF = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    showToast(t.preparingPDF, 'info');
    
    try {
      // Use a delay to ensure any animations are settled
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dataUrl = await htmlToImage.toPng(boardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: theme === Theme.DARK ? '#111111' : '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // We need to get the image dimensions to calculate the aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });
      
      const imgWidth = pdfWidth;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(t.pdfFilename);
      showToast(t.pdfExportSuccess, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      showToast(t.exportFailed, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    showToast(t.generatingImage, 'info');
    
    try {
      // Use a delay to ensure any animations are settled
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const dataUrl = await htmlToImage.toPng(boardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: theme === Theme.DARK ? '#111111' : '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      const link = document.createElement('a');
      link.download = t.imageFilename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(t.imageSaveSuccess, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      showToast(t.imageSaveFailed, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'in-progress': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'done': return t.statusDone;
      case 'in-progress': return t.statusInProgress;
      default: return t.statusTodo;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <Icons.CheckCircle2 className="w-5 h-5" />;
      case 'in-progress': return <Icons.Clock className="w-5 h-5" />;
      default: return <Icons.Circle className="w-5 h-5" />;
    }
  };

  if (milestones.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-[#050505] p-8 text-center animate-fade-in">
        <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
          <Icons.Map className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {t.roadmapEmptyTitle}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
          {t.roadmapEmptyDesc}
        </p>
        
        {chatHistory.length === 0 ? (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateToChat}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg transition-shadow shadow-lg hover:shadow-indigo-500/30 flex items-center gap-3"
          >
            <Icons.MessageSquare className="w-5 h-5" />
            {t.startChatting}
          </motion.button>
        ) : (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateRoadmap}
            disabled={isGenerating}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg transition-shadow shadow-lg hover:shadow-indigo-500/30 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icons.Sparkles className="w-5 h-5" />
            )}
            {isGenerating 
              ? t.generating 
              : t.generateRoadmapNow}
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#050505] overflow-y-auto">
      <div className="w-full p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t.careerRoadmap}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t.roadmapSub}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToImage}
              disabled={isExporting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icons.Image className="w-4 h-4" />
              <span>{t.saveImage}</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Icons.FileText className="w-4 h-4" />
              <span>{t.exportPDF}</span>
            </motion.button>
          </div>
        </div>

        <div 
          id="progress-board-container"
          ref={boardRef} 
          className="progress-board-export bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10 p-6 md:p-10 shadow-sm"
        >
          {/* User Info Header for Export */}
          <div className="mb-10 pb-8 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center gap-6">
            <img 
              src={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=random'} 
              alt="Avatar" 
              className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {t.personalProfile}
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{user?.name}</span>
                <span className="hidden md:inline">•</span>
                <span>{user?.email}</span>
                {user?.careerGoal && (
                  <>
                    <span className="hidden md:inline">•</span>
                    <span className="italic">"{user.careerGoal}"</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t.progressBoardTitle}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {t.progressBoardSub}
            </p>
          </div>

          <motion.div layout className="relative ml-4 md:ml-8 space-y-0">
            {milestones.map((milestone, index) => (
              <motion.div 
                layout
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  layout: { type: "spring", stiffness: 300, damping: 30 }
                }}
                className="relative pl-8 md:pl-12 pb-8"
              >
                {/* Line connecting to next */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-[9px] top-6 bottom-[-6px] w-[2px] bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden">
                    {/* Animated fill */}
                    <motion.div 
                      className="absolute top-0 left-0 w-full bg-emerald-500 dark:bg-emerald-400"
                      initial={{ height: '0%' }}
                      animate={{ height: milestone.status === 'done' ? '100%' : '0%' }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    {/* Flowing stream effect */}
                    {(milestone.status === 'done' || milestone.status === 'in-progress') && (
                      <motion.div
                        className={`absolute left-[-3px] w-[8px] h-[50%] bg-gradient-to-b from-transparent ${milestone.status === 'done' ? 'via-emerald-400 dark:via-emerald-300' : 'via-cyan-400 dark:via-cyan-300'} to-transparent opacity-90 blur-[2px]`}
                        animate={{ top: ['-50%', '150%'] }}
                        transition={{ duration: milestone.status === 'done' ? 1.2 : 2, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </div>
                )}

                {/* Timeline dot */}
                <motion.div 
                  layout
                  className={`absolute left-0 top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-[#111] z-10 transition-all duration-500 ${milestone.status === 'done' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110' : milestone.status === 'in-progress' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-110' : 'bg-gray-300 dark:bg-gray-600'}`} 
                />
                
                <motion.div 
                  layout
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg ${milestone.status === 'done' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : milestone.status === 'in-progress' ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 ring-1 ring-amber-400/20' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => toggleStatus(milestone.id)}>
                      <h4 className={`text-lg font-bold mb-1 ${milestone.status === 'done' ? 'text-emerald-900 dark:text-emerald-400 line-through opacity-70' : 'text-gray-900 dark:text-white'}`}>
                        {milestone.title}
                      </h4>
                      <p className={`text-sm ${milestone.status === 'done' ? 'text-emerald-700/70 dark:text-emerald-500/70' : 'text-gray-500 dark:text-gray-400'}`}>
                        {milestone.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveCommentId(activeCommentId === milestone.id ? null : milestone.id)}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors relative"
                        title="Add Note"
                      >
                        <Icons.MessageSquare className="w-5 h-5" />
                        {milestone.comments && milestone.comments?.length > 0 && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-[#111]"></span>
                        )}
                      </motion.button>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleStatus(milestone.id)}
                        className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${getStatusColor(milestone.status)}`}
                      >
                        {getStatusIcon(milestone.status)}
                        {getStatusText(milestone.status)}
                      </motion.div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {(activeCommentId === milestone.id || (milestone.comments && milestone.comments?.length > 0)) && (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 overflow-hidden"
                      >
                        {milestone.comments && milestone.comments?.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {milestone.comments.map((comment, i) => (
                              <div key={i} className="flex gap-2 items-start text-sm bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-gray-700 dark:text-gray-300">
                                <Icons.CornerDownRight className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <p>{comment}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {activeCommentId === milestone.id && (
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addComment(milestone.id)}
                              placeholder={t.addNotePlaceholder}
                              className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => addComment(milestone.id)}
                              disabled={!commentText.trim()}
                              className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors disabled:opacity-50"
                            >
                              <Icons.Send className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Footer for exported image/pdf */}
          <div className="mt-12 pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-center text-xs text-gray-400">
            <span>{t.generatedBy}</span>
            <span>{t.dateLabel} {new Date().toLocaleDateString(language === Language.EN ? 'en-US' : 'vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Export Loading Overlay */}
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-5 max-w-sm mx-4 text-center border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <Icons.FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t.generatingDocument}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.preparingFile}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
