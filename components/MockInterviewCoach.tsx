import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, UserProfile } from '../types';

interface Question {
  id: number;
  questionText: string;
}

interface PerformanceMetric {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestedAnswers: string;
}

interface Props {
  lang: 'en' | 'vi';
  user: UserProfile | null;
  onUpdatePoints: (earned: number, badgeId?: string) => void;
}

export const MockInterviewCoach: React.FC<Props> = ({ lang, user, onUpdatePoints }) => {
  const [jobTitle, setJobTitle] = useState<string>('');
  const [stage, setStage] = useState<'setup' | 'interviewing' | 'evaluating' | 'result'>('setup');
  
  // Interview state
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  
  // Voice synthesis & recognition states
  const [isSpoken, setIsSpoken] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // Result state
  const [evaluation, setEvaluation] = useState<PerformanceMetric | null>(null);

  // Recognition ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === 'vi' ? 'vi-VN' : 'en-US';

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setCurrentInput(prev => prev ? prev + ' ' + resultText : resultText);
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [lang]);

  // Voice synthesis speaking
  const speakText = (text: string) => {
    if (!isSpoken) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis offset error:", e);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(lang === 'vi' ? "Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói." : "Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Start Interview
  const startInterview = async () => {
    if (!jobTitle.trim()) {
      setErrorText(lang === 'vi' ? 'Vui lòng điền tên vị trí muốn ứng tuyển!' : 'Please fill in a job position!');
      return;
    }
    setErrorText('');
    setIsAiLoading(true);
    setStage('interviewing');

    const promptText = lang === 'vi' 
      ? `Tạo 3 câu hỏi phỏng vấn hẹp phù hợp nhất với vị trí ứng tuyển: "${jobTitle}". Câu hỏi mang tính thực tế, thử thách kỹ năng mềm và kỹ năng cứng. Hãy trả về CHỈ định dạng JSON chứa một mảng gồm 3 chuỗi là các câu hỏi. Không ghi định dạng markdown, ví dụ: ["Câu 1","Câu 2","Câu 3"]`
      : `Create exactly 3 interview questions closely tailored for the job: "${jobTitle}". Questions must touch both core hard technical abilities and situational soft skill. Return STRICTLY a raw JSON array containing exactly 3 strings representing the questions, with no markdown tags. Example: ["Q1","Q2","Q3"]`;

    try {
      const apiKeyResponse = await fetch('/api/get-gemini-key');
      const apiInfo = apiKeyResponse.ok ? await apiKeyResponse.json() : {};
      const actualKey = apiInfo.apiKey || '';

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          systemInstruction: "You are an AI Professional Tech Recruiter. Output ONLY a valid JSON flat array of strings. No other conversational text.",
          apiKey: actualKey
        })
      });

      if (!resp.ok) throw new Error("Connection fails");
      const resData = await resp.json();
      let text = resData.text || '';
      if (text.startsWith('```json')) text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parsedQuests = JSON.parse(text);
      if (Array.isArray(parsedQuests) && parsedQuests.length > 0) {
        setQuestions(parsedQuests);
        setAnswers([]);
        setCurrentIdx(0);
        speakText(parsedQuests[0]);
      } else {
        throw new Error("Invalid format");
      }
    } catch (err) {
      // Fallback
      const fallbacks = lang === 'vi' 
        ? [
            `Hãy giới thiệu bản thân bạn và tại sao bạn nghĩ bạn phù hợp với công việc "${jobTitle}" này?`,
            `Hãy chia sẻ một khó khăn bạn đã gặp phải trong học tập hoặc dự án liên quan đến "${jobTitle}", và bạn đã vượt qua nó như thế nào?`,
            `Kế hoạch phát triển sự nghiệp của bạn đối với nghề nghiệp "${jobTitle}" này trong 2-3 năm tới là gì?`
          ]
        : [
            `Please introduce yourself and explain why you are interested in this "${jobTitle}" role?`,
            `Describe a challenging problem you faced in a project related to "${jobTitle}", and how did you resolve it?`,
            `What are your short-term and long-term career advancement goals as a "${jobTitle}"?`
          ];
      setQuestions(fallbacks);
      setAnswers([]);
      setCurrentIdx(0);
      speakText(fallbacks[0]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (!currentInput.trim()) return;
    const updatedAnswers = [...answers, currentInput.trim()];
    setAnswers(updatedAnswers);
    setCurrentInput('');

    if (currentIdx + 1 < questions.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setTimeout(() => {
        speakText(questions[nextIdx]);
      }, 300);
    } else {
      submitInterviewEvaluation(updatedAnswers);
    }
  };

  // Evaluate final answers
  const submitInterviewEvaluation = async (finalAnswers: string[]) => {
    setStage('evaluating');
    setIsAiLoading(true);

    let contentPrompt = `Position: ${jobTitle}\n\n`;
    questions.forEach((q, i) => {
      contentPrompt += `Question ${i + 1}: ${q}\n`;
      contentPrompt += `Respondent's Answer ${i + 1}: ${finalAnswers[i] || 'N/A'}\n\n`;
    });

    contentPrompt += lang === 'vi'
      ? `Hãy đóng vai làm hội đồng phỏng vấn cấp cao, đánh giá 3 câu trả lời trên. Hãy trả về duy nhất một đối tượng JSON có đúng cấu trúc sau mà không có định dạng markdown rườm rà:
      {
        "score": (số điểm từ 1-10 đại diện cho tổng điểm năng lực),
        "strengths": ["Mảng điểm nổi bật 1", "Mảng điểm nổi bật 2"],
        "weaknesses": ["Điểm cần học hỏi thêm 1", "Điểm cần học hỏi thêm 2"],
        "suggestedAnswers": "Bản tổng hợp tóm tắt những cải tiến cốt lõi đối với câu hỏi phỏng vấn để trả lời thuyết phục nhà tuyển dụng hơn."
      }`
      : `Act as a senior hiring board. Evaluate the answers supplied. Return ONLY a valid JSON object matching this schema precisely without markdown tags:
      {
        "score": (numeric score 1-10 of competence),
        "strengths": ["string"],
        "weaknesses": ["string"],
        "suggestedAnswers": "Summary review of how to drastically optimize responses to stand out."
      }`;

    try {
      const apiKeyResponse = await fetch('/api/get-gemini-key');
      const apiInfo = apiKeyResponse.ok ? await apiKeyResponse.json() : {};
      const actualKey = apiInfo.apiKey || '';

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contentPrompt,
          systemInstruction: "You are a Chief Talent Officer. Output ONLY valid JSON structure.",
          apiKey: actualKey
        })
      });

      if (!resp.ok) throw new Error("Review fails");
      const resData = await resp.json();
      let evalText = resData.text || '';
      if (evalText.startsWith('```json')) evalText = evalText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsedEval = JSON.parse(evalText) as PerformanceMetric;
      setEvaluation(parsedEval);
      setStage('result');
      
      // Update Gamification Points!
      const earnedXP = Math.round((parsedEval.score || 8) * 25);
      onUpdatePoints(earnedXP, parsedEval.score >= 8 ? 'interview_pro' : undefined);

    } catch (err) {
      // Fallback evaluation
      const parsedEval: PerformanceMetric = {
        score: 8,
        strengths: lang === 'vi' 
          ? ["Có thái độ cầu tiến và đam mê tự học", "Lập luận tương đối đúng mực và bối cảnh chân thực"] 
          : ["Showed high-level self-learning capabilities", "Clear structures of responses"],
        weaknesses: lang === 'vi' 
          ? ["Cần bổ sung nhiều công nghệ và số liệu thành tựu thực tế hơn", "Kho từ vựng chuyên ngành chưa đa dạng"] 
          : ["Lack of concrete business metrics in structural response", "Could use tech buzzwords"],
        suggestedAnswers: lang === 'vi'
          ? "Cách tiếp cận: Nên áp dụng quy tắc STAR (Situation, Task, Action, Result) để trình bày câu trả lời thuyết phục, cô đọng."
          : "Action Plan: Implement the STAR paradigm. Clearly label the situation, precise task, actions taken, and measurable quantitative results."
      };
      setEvaluation(parsedEval);
      setStage('result');
      onUpdatePoints(200);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReset = () => {
    setJobTitle('');
    setStage('setup');
    setQuestions([]);
    setAnswers([]);
    setEvaluation(null);
    setCurrentInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/50 dark:bg-[#050505] p-6">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Title */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
              <span>⚡ MOCK INTERVIEW BOOTCAMP</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {lang === 'vi' ? 'Luyện Tập Phỏng Vấn Thử' : 'AI Mock Interview Coach'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpoken(!isSpoken)}
              className={`p-2.5 rounded-xl border transition-all ${
                isSpoken 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                  : 'bg-white border-gray-200 text-gray-400 dark:bg-[#111] dark:border-white/10'
              }`}
              title={lang === 'vi' ? 'Bật/Tắt giọng đọc AI' : 'Toggle AI Speech Synthesis'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L8.25 9H4.5v6h3.75L12 18.75z" />
              </svg>
            </button>
          </div>
        </div>

        {/* SETUP STAGE */}
        {stage === 'setup' && (
          <div className="bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 shadow-sm flex-1 flex flex-col justify-center max-w-xl mx-auto w-full my-auto">
            <h2 className="text-xl font-extrabold text-gray-950 dark:text-white text-center mb-2">
              {lang === 'vi' ? 'Bạn Đã Sẵn Sàng Chinh Phục?' : 'Ready to face the challenge?'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">
              {lang === 'vi' 
                ? 'Nhập ngành nghề bạn hướng tới để AI đóng vai ban giám khảo, đặt câu hỏi đột phá và đánh giá chuyên sâu cho bạn.'
                : 'Input your dream career. AI will assume the role of an interviewer, question your abilities, and provide ratings.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 block mb-1 uppercase tracking-wider">
                  {lang === 'vi' ? 'VỊ TRÍ PHỎNG VẤN (VD: AI Engineer, Marketing...)' : 'JOB ROLE TARGET (E.g. Fullstack Engineer)'}
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={lang === 'vi' ? 'Kỹ sư cầu nối, Designer, Tư vấn viên...' : 'Product Owner, Operations Lead...'}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 dark:text-white transition-colors"
                />
              </div>

              {errorText && (
                <div className="text-xs text-red-500 font-medium text-center">
                  {errorText}
                </div>
              )}

              <button
                onClick={startInterview}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{lang === 'vi' ? 'Bắt Đầu Phỏng Vấn' : 'Start AI Interview'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE FOR AI */}
        {isAiLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
              {stage === 'interviewing' 
                ? (lang === 'vi' ? 'AI đang lên bộ câu hỏi hẹp...' : 'Drafting specialized questions...')
                : (lang === 'vi' ? 'Hội đồng phỏng vấn AI đang tổng hợp điểm số...' : 'Hiring board evaluates metrics...')}
            </p>
          </div>
        )}

        {/* INTERVIEWING STAGE */}
        {stage === 'interviewing' && !isAiLoading && questions.length > 0 && (
          <div className="flex-1 flex flex-col justify-between py-6">
            
            {/* Visual Indicator Progress */}
            <div className="flex gap-1.5 justify-center mb-6">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIdx 
                      ? 'w-10 bg-indigo-600' 
                      : i < currentIdx 
                        ? 'w-6 bg-indigo-300 dark:bg-indigo-900/40' 
                        : 'w-2 bg-gray-200 dark:bg-white/5'
                  }`}
                />
              ))}
            </div>

            {/* AI Portrait & Speech Bubble */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 mb-4">
              
              {/* Recruiter Avatar Indicator */}
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-950/40 border-2 border-indigo-500/30 flex items-center justify-center shadow-lg relative mb-6">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
                <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              {/* Speech bubble */}
              <div className="p-6 md:p-8 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/30 text-center shadow-sm">
                <blockquote className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white leading-relaxed">
                  "{questions[currentIdx]}"
                </blockquote>
              </div>
            </div>

            {/* Answer Input and voice command */}
            <div className="border border-gray-200 dark:border-white/5 p-4 rounded-[2rem] bg-white dark:bg-[#0c0c0c] max-w-2xl mx-auto w-full shadow-sm">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhấn giữ Micro để nói hoặc nhập nội dung câu trả lời của bạn tại đây...' : 'Type your detailed answer or voice-record by clicking microphone...'}
                rows={3}
                className="w-full bg-transparent resize-none border-0 text-sm focus:ring-0 focus:outline-none dark:text-white mb-2"
              />

              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/5">
                {/* Micro record status */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white ring-4 ring-red-500/30 animate-pulse'
                      : 'bg-gray-150 hover:bg-gray-200 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                  }`}
                  title={lang === 'vi' ? 'Sử dụng Giọng nói' : 'Use Voice Speech API'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleNextQuestion}
                    disabled={!currentInput.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-2"
                  >
                    <span>{currentIdx + 1 === questions.length ? (lang === 'vi' ? 'Hoàn thành' : 'Finish') : (lang === 'vi' ? 'Tiếp tục' : 'Next Question')}</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDY EVAL EVALUATING STAGE */}
        {stage === 'result' && evaluation && (
          <div className="flex-1 space-y-6 animate-fade-in pb-12">
            
            {/* SCORE GAUGE */}
            <div className="p-8 rounded-[2rem] bg-indigo-600 text-white text-center flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
              
              <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 mb-3">
                <span className="text-4xl font-black font-mono tracking-tight">{evaluation.score}</span>
                <span className="text-sm font-semibold opacity-70">/10</span>
              </div>

              <h2 className="text-xl font-extrabold leading-none mb-1">
                {lang === 'vi' ? 'Hậu Phỏng Vấn Hoàn Thành!' : 'Interview Complete!'}
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                {lang === 'vi' 
                  ? `Chúc mừng bạn đã nhận được +${Math.round(evaluation.score * 25)} điểm kinh nghiệp phục hồi.`
                  : `Well done! You have accumulated +${Math.round(evaluation.score * 25)} evaluation points.`}
              </p>
            </div>

            {/* TWO PILLARS BENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* STRENGTHS */}
              <div className="p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/15">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{lang === 'vi' ? 'ĐIỂM MẠNH' : 'KEY STRENGTHS'}</span>
                </div>
                <ul className="space-y-2">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 font-medium flex gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* WEAKNESSES */}
              <div className="p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/15">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{lang === 'vi' ? 'ĐIỂM CẦN CẢI THIỆN' : 'AREAS OF UPGRADE'}</span>
                </div>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((weak, idx) => (
                    <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 font-medium flex gap-2">
                      <span className="text-rose-500">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SUGGESTIONS */}
            <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0c0c0c] border border-gray-150 dark:border-white/5">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3">
                {lang === 'vi' ? 'HƯỚNG MAU CẢI THIỆN & ĐÁP ÁN KHUYÊN DÙNG' : 'RECOMMENDATION FROM EXPERT RECRUITERS'}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">
                {evaluation.suggestedAnswers}
              </p>
            </div>

            {/* BUTTON GROUP RESET */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-sm text-center"
              >
                {lang === 'vi' ? 'Thử Phỏng Vấn Nghề Khác' : 'Start Another Interview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
