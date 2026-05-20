import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { compareCareers } from '../services/geminiService';

export const CareerCompare = ({ lang, t, Icons }: { lang: Language, t: any, Icons: any }) => {
  const [career1, setCareer1] = useState<string>('');
  const [career2, setCareer2] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [result, setResult] = useState<any>(null);

  const handleCompare = async () => {
    if (!career1.trim() || !career2.trim()) return;
    setIsComparing(true);
    setError(null);
    setResult(null);
    try {
      const data = await compareCareers(career1, career2, lang);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to compare careers.');
    } finally {
      setIsComparing(false);
    }
  };

  const getMetricColor = (metric: string) => {
    if (!metric) return '';
    const m = metric.toLowerCase();
    if (m.includes('high') || m.includes('cao') || m.includes('tốt') || m.includes('very high')) return 'text-green-600 dark:text-green-400';
    if (m.includes('medium') || m.includes('trung bình')) return 'text-yellow-600 dark:text-yellow-400';
    if (m.includes('low') || m.includes('thấp') || m.includes('kém')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-900 dark:text-white';
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.careerCompare || 'So sánh ngành nghề'}</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {lang === Language.VI 
            ? 'So sánh thu nhập, cơ hội và độ cạnh tranh giữa các ngành nghề bằng AI' 
            : 'Compare salary, opportunities, and competition between careers using AI'}
        </p>
      </motion.div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
            {lang === Language.VI ? 'Ngành nghề 1' : 'Career 1'}
          </label>
          <input 
            type="text"
            value={career1}
            onChange={(e) => setCareer1(e.target.value)}
            placeholder={lang === Language.VI ? 'Ví dụ: Kỹ sư phần mềm' : 'e.g. Software Engineer'}
            className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
            {lang === Language.VI ? 'Ngành nghề 2' : 'Career 2'}
          </label>
          <input 
            type="text"
            value={career2}
            onChange={(e) => setCareer2(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            placeholder={lang === Language.VI ? 'Ví dụ: Thiết kế UI/UX' : 'e.g. UI/UX Designer'}
            className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
      </div>
      
      <div className="w-full mb-12 flex justify-center">
        <button
            onClick={handleCompare}
            disabled={isComparing || !career1.trim() || !career2.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
            {isComparing ? <Icons.Refresh className="w-5 h-5 animate-spin" /> : <Icons.Activity className="w-5 h-5" />}
            {lang === Language.VI ? 'So sánh ngay' : 'Compare Now'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isComparing && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 text-gray-500">
            <Icons.Refresh className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
            <p>{lang === Language.VI ? 'Đang phân tích và so sánh...' : 'Analyzing and comparing...'}</p>
          </motion.div>
        )}
        
        {error && !isComparing && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
            {error}
          </motion.div>
        )}

        {result && !isComparing && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            {/* Career 1 */}
            <div className="flex-1 p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex justify-center items-center mb-4">
                    <Icons.Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{result.career1?.name || career1}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 min-h-[40px]">{result.career1?.description}</p>
                
                <div className="w-full space-y-6 text-left">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Thu nhập trung bình' : 'Average Salary'}</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{result.career1?.salary}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Nhu cầu tuyển dụng' : 'Market Demand'}</div>
                        <div className={`text-lg font-bold ${getMetricColor(result.career1?.demand || '')}`}>{result.career1?.demand}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Mức độ cạnh tranh' : 'Competition Level'}</div>
                        <div className={`text-lg font-bold ${getMetricColor(result.career1?.competition || '')}`}>{result.career1?.competition}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Cân bằng công việc' : 'Work-life Balance'}</div>
                        <div className={`text-lg font-bold ${getMetricColor(result.career1?.workLife || '')}`}>{result.career1?.workLife}</div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px md:w-px md:h-auto bg-gray-200 dark:bg-white/10 hidden md:block"></div>

            {/* Career 2 */}
            <div className="flex-1 p-6 md:p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex justify-center items-center mb-4">
                    <Icons.Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{result.career2?.name || career2}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 min-h-[40px]">{result.career2?.description}</p>
                
                <div className="w-full space-y-6 text-left">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Thu nhập trung bình' : 'Average Salary'}</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{result.career2?.salary}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Nhu cầu tuyển dụng' : 'Market Demand'}</div>
                        <div className={`text-lg font-bold ${getMetricColor(result.career2?.demand || '')}`}>{result.career2?.demand}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Mức độ cạnh tranh' : 'Competition Level'}</div>
                        <div className={`text-lg font-bold ${getMetricColor(result.career2?.competition || '')}`}>{result.career2?.competition}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Cân bằng công việc' : 'Work-life Balance'}</div>
                        <div className={`text-lg font-bold ${getMetricColor(result.career2?.workLife || '')}`}>{result.career2?.workLife}</div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
