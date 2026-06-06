import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { compareCareers } from '../services/geminiService';
import { InlineGuide } from './InlineGuide';

const CAREERS = [
  { id: 'se', name: 'Software Engineer', nameVi: 'Kỹ sư phần mềm', salary: '$1,000 - $3,500', salaryVi: '20 - 60 triệu VNĐ', demand: 'Very High', demandVi: 'Rất cao', competition: 'High', competitionVi: 'Cao', workLife: 'Medium', workLifeVi: 'Trung bình', description: 'Design, develop, and test software systems and applications.', descriptionVi: 'Thiết kế, phát triển và kiểm thử các hệ thống phần mềm và ứng dụng.' },
  { id: 'ds', name: 'Data Scientist', nameVi: 'Khoa học dữ liệu', salary: '$1,200 - $4,000', salaryVi: '25 - 80 triệu VNĐ', demand: 'High', demandVi: 'Cao', competition: 'Medium', competitionVi: 'Trung bình', workLife: 'High', workLifeVi: 'Tốt', description: 'Analyze distinct data sources to draw meaningful business insights.', descriptionVi: 'Phân tích dữ liệu để đưa ra các insights kinh doanh quan trọng.' },
];

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
    <div className="w-full max-w-5xl mx-auto flex flex-col items-stretch">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.careerCompare || 'So sánh ngành nghề'}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {lang === Language.VI 
            ? 'So sánh thu nhập, cơ hội và độ cạnh tranh giữa các ngành nghề bằng AI' 
            : 'Compare salary, opportunities, and competition between careers using AI'}
        </p>
      </motion.div>

      <InlineGuide 
        sectionKey="compare-careers"
        lang={lang === Language.VI ? 'vi' : 'en'}
        title={lang === Language.VI ? "💡 Hướng dẫn so sánh ngành nghề" : "💡 Career Compare Guide"}
        steps={lang === Language.VI ? [
          "Nhập tên 2 ngành nghề bất kỳ mà bạn đang phân vân (vd: Kỹ sư phần mềm và Thiết kế UI/UX).",
          "AI sẽ lập biểu đồ phân tích cụ thể về: mức thu nhập bình quân, triển vọng tương lai, tỷ lệ cạnh tranh và khả năng cân bằng công việc - cuộc sống.",
          "Tham khảo ý kiến tóm lược từ AI và các lời khuyên định vị giá trị bản thân độc nhất."
        ] : [
          "Type in two different career titles you are considering side-by-side (e.g., Software Engineer and UI/UX Designer).",
          "AI compiles comparative stats covering average salary bands, local career demand outlooks, candidate competition, and work-life balance.",
          "Review structured advantages and the dedicated AI recommendation formulated based on global statistics."
        ]}
      />

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
        {!result && !isComparing && !error && (
          <motion.div key="default" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pl-2">
              {lang === Language.VI ? 'Ví dụ so sánh:' : 'Example Comparison:'}
            </h3>
            <div className="w-full bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row mb-8">
              {/* Career 1 */}
              <div className="flex-1 p-6 md:p-8 flex flex-col items-center text-center opacity-80">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex justify-center items-center mb-4">
                      <Icons.Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{lang === Language.VI ? CAREERS[0].nameVi : CAREERS[0].name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 min-h-[40px]">{lang === Language.VI ? CAREERS[0].descriptionVi : CAREERS[0].description}</p>
                  
                  <div className="w-full space-y-6 text-left">
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Thu nhập trung bình' : 'Average Salary'}</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{lang === Language.VI ? CAREERS[0].salaryVi : CAREERS[0].salary}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Nhu cầu tuyển dụng' : 'Market Demand'}</div>
                          <div className={`text-lg font-bold ${getMetricColor(lang === Language.VI ? CAREERS[0].demandVi : CAREERS[0].demand)}`}>{lang === Language.VI ? CAREERS[0].demandVi : CAREERS[0].demand}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Mức độ cạnh tranh' : 'Competition Level'}</div>
                          <div className={`text-lg font-bold ${getMetricColor(lang === Language.VI ? CAREERS[0].competitionVi : CAREERS[0].competition)}`}>{lang === Language.VI ? CAREERS[0].competitionVi : CAREERS[0].competition}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Cân bằng công việc' : 'Work-life Balance'}</div>
                          <div className={`text-lg font-bold ${getMetricColor(lang === Language.VI ? CAREERS[0].workLifeVi : CAREERS[0].workLife)}`}>{lang === Language.VI ? CAREERS[0].workLifeVi : CAREERS[0].workLife}</div>
                      </div>
                  </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px md:w-px md:h-auto bg-gray-200 dark:bg-white/10 hidden md:block"></div>

              {/* Career 2 */}
              <div className="flex-1 p-6 md:p-8 flex flex-col items-center text-center opacity-80">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex justify-center items-center mb-4">
                      <Icons.Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{lang === Language.VI ? CAREERS[1].nameVi : CAREERS[1].name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 min-h-[40px]">{lang === Language.VI ? CAREERS[1].descriptionVi : CAREERS[1].description}</p>
                  
                  <div className="w-full space-y-6 text-left">
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Thu nhập trung bình' : 'Average Salary'}</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{lang === Language.VI ? CAREERS[1].salaryVi : CAREERS[1].salary}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Nhu cầu tuyển dụng' : 'Market Demand'}</div>
                          <div className={`text-lg font-bold ${getMetricColor(lang === Language.VI ? CAREERS[1].demandVi : CAREERS[1].demand)}`}>{lang === Language.VI ? CAREERS[1].demandVi : CAREERS[1].demand}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Mức độ cạnh tranh' : 'Competition Level'}</div>
                          <div className={`text-lg font-bold ${getMetricColor(lang === Language.VI ? CAREERS[1].competitionVi : CAREERS[1].competition)}`}>{lang === Language.VI ? CAREERS[1].competitionVi : CAREERS[1].competition}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{lang === Language.VI ? 'Cân bằng công việc' : 'Work-life Balance'}</div>
                          <div className={`text-lg font-bold ${getMetricColor(lang === Language.VI ? CAREERS[1].workLifeVi : CAREERS[1].workLife)}`}>{lang === Language.VI ? CAREERS[1].workLifeVi : CAREERS[1].workLife}</div>
                      </div>
                  </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
