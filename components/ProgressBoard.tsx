import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as Icons from 'lucide-react';
import { ChatSession, UserProfile, Language, ChatMessage, Milestone } from '../types';
import { generateRoadmap } from '../services/geminiService';

interface ProgressBoardProps {
  chatHistory: ChatSession[];
  messages: ChatMessage[];
  user: UserProfile | null;
  language: Language;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  onNavigateToChat: () => void;
}

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ chatHistory, messages, user, language, milestones, setMilestones, onNavigateToChat }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);

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
      alert(language === Language.EN ? "Failed to generate roadmap. Please try again." : "Không thể tạo lộ trình. Vui lòng thử lại.");
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
    try {
      const canvas = await html2canvas(boardRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Lo-Trinh-Nghe-Nghiep.pdf');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(boardRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'Lo-Trinh-Nghe-Nghiep.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
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
      case 'done': return language === Language.EN ? 'Done' : 'Hoàn thành';
      case 'in-progress': return language === Language.EN ? 'In Progress' : 'Đang thực hiện';
      default: return language === Language.EN ? 'To Do' : 'Chưa bắt đầu';
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
          {language === Language.EN ? "Your Roadmap is Empty" : "Bảng Tiến Độ Đang Trống"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
          {language === Language.EN 
            ? "Chat with the AI first so it can understand your goals and generate a personalized step-by-step career roadmap for you." 
            : "Hãy trò chuyện với AI trước để hệ thống hiểu rõ mục tiêu của bạn và tạo ra một lộ trình nghề nghiệp cá nhân hóa."}
        </p>
        
        {chatHistory.length === 0 ? (
          <button 
            onClick={onNavigateToChat}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-3"
          >
            <Icons.MessageSquare className="w-5 h-5" />
            {language === Language.EN ? "Start Chatting" : "Bắt đầu trò chuyện"}
          </button>
        ) : (
          <button 
            onClick={handleGenerateRoadmap}
            disabled={isGenerating}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icons.Sparkles className="w-5 h-5" />
            )}
            {isGenerating 
              ? (language === Language.EN ? "Generating..." : "Đang tạo lộ trình...") 
              : (language === Language.EN ? "Generate Roadmap" : "Tạo Lộ Trình Ngay")}
          </button>
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
              {language === Language.EN ? "Career Roadmap" : "Bảng Tiến Độ"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {language === Language.EN ? "Track your progress and export to share." : "Theo dõi tiến độ và xuất file để chia sẻ với phụ huynh, giáo viên."}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={exportToImage}
              disabled={isExporting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icons.Image className="w-4 h-4" />
              <span>{language === Language.EN ? "Save Image" : "Lưu Ảnh"}</span>
            </button>
            <button 
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Icons.FileText className="w-4 h-4" />
              <span>{language === Language.EN ? "Export PDF" : "Xuất PDF"}</span>
            </button>
          </div>
        </div>

        <div 
          ref={boardRef} 
          className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/10 p-6 md:p-10 shadow-sm"
        >
          <div className="mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === Language.EN ? "Progress Board" : "Bảng Đánh Giá Tiến Độ"}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {language === Language.EN ? "Click on items to update status" : "Nhấn vào từng mục để cập nhật trạng thái"}
            </p>
          </div>

          <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900/30 ml-4 md:ml-8 space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 md:pl-12"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-[#111] ${milestone.status === 'done' ? 'bg-emerald-500' : milestone.status === 'in-progress' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                
                <div className={`group p-5 rounded-2xl border transition-all duration-200 hover:shadow-md ${milestone.status === 'done' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}>
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
                      <button 
                        onClick={() => setActiveCommentId(activeCommentId === milestone.id ? null : milestone.id)}
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-colors relative"
                        title="Add Note"
                      >
                        <Icons.MessageSquare className="w-5 h-5" />
                        {milestone.comments && milestone.comments?.length > 0 && (
                          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-[#111]"></span>
                        )}
                      </button>
                      <div 
                        onClick={() => toggleStatus(milestone.id)}
                        className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${getStatusColor(milestone.status)}`}
                      >
                        {getStatusIcon(milestone.status)}
                        {getStatusText(milestone.status)}
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {(activeCommentId === milestone.id || (milestone.comments && milestone.comments?.length > 0)) && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
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
                              placeholder={language === Language.EN ? "Add a note or evaluation..." : "Thêm ghi chú hoặc đánh giá..."}
                              className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                              autoFocus
                            />
                            <button 
                              onClick={() => addComment(milestone.id)}
                              disabled={!commentText.trim()}
                              className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors disabled:opacity-50"
                            >
                              <Icons.Send className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Footer for exported image/pdf */}
          <div className="mt-12 pt-6 border-t border-gray-100 dark:border-white/10 flex justify-between items-center text-xs text-gray-400">
            <span>{language === Language.EN ? "Generated by Career Compass AI" : "Tạo bởi Career Compass AI"}</span>
            <span>{language === Language.EN ? "Date:" : "Ngày xuất:"} {new Date().toLocaleDateString(language === Language.EN ? 'en-US' : 'vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
