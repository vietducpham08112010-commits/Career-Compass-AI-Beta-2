import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { saveFeedbackToCloud } from '../services/firestoreService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  lang: 'en' | 'vi';
  onAddEarnedPoints: (pts: number) => void;
}

export const FeedbackModal: React.FC<Props> = ({ isOpen, onClose, userId, lang, onAddEarnedPoints }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const targetUid = userId || 'anonymous_user';
      await saveFeedbackToCloud(targetUid, rating, comment);
      setIsSubmitted(true);
      onAddEarnedPoints(50); // Give +50 points reward!
      setTimeout(() => {
        setIsSubmitted(false);
        setComment('');
        setRating(5);
        onClose();
      }, 2500);
    } catch (e) {
      console.error(e);
      alert(lang === 'vi' ? 'Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại.' : 'Error sending feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-white dark:bg-[#0c0c0c] border border-gray-150 dark:border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <div className="inline-flex p-3 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.253.58 1.802l-3.957 2.871a1 1 0 00-.364 1.118l1.52 4.674c.3.922-.755 1.688-1.538 1.118l-3.957-2.87a1 1 0 00-1.171 0l-3.957 2.87c-.783.57-1.838-.197-1.538-1.118l1.52-4.674a1 1 0 00-.364-1.118L2.05 9.75c-.78-.549-.38-1.802.58-1.802h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {lang === 'vi' ? 'Đánh Giá Cuộc Tư Vấn AI' : 'Rate Your Consultation'}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {lang === 'vi' 
                    ? 'Bạn có thấy những gợi ý và câu hỏi của AI thực sự hữu ích không? Phản hồi của bạn giúp chúng tôi nâng cấp hệ thống!'
                    : 'Were the AI recommendations and guidance useful? Leave your insights to help us optimize prompts.'}
                </p>
              </div>

              {/* STAR RATING */}
              <div className="flex justify-center items-center gap-1.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform active:scale-95"
                  >
                    <svg
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200 dark:text-white/10'
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* COMMENT BOX */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                  {lang === 'vi' ? 'GÓP Ý CHI TIẾT (TÙY CHỌN)' : 'DETAILED FEEDBACK (OPTIONAL)'}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    lang === 'vi' 
                      ? 'AI cần trả lời tập trung hơn, hay giao diện cần thêm gì...' 
                      : 'E.g. AI prompts could be more customized...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500 dark:text-white resize-none"
                />
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{lang === 'vi' ? 'Gửi Điểm & Đánh Giá' : 'Submit Review'}</span>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center animate-bounce shadow-lg">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {lang === 'vi' ? 'Gửi thành công! +50 XP' : 'Thank You! +50 XP'}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {lang === 'vi' 
                  ? 'Góp ý vàng của bạn đã được ghi nhận trực tiếp vào hòm thư cải tiến.' 
                  : 'Your feedback was synced to the cloud database successfully.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
