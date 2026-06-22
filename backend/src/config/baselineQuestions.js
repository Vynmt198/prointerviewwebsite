/**
 * baselineQuestions.js
 * 3 câu hỏi phỏng vấn "baseline" — CỐ ĐỊNH, dùng chung cho TẤT CẢ user ở stage 1
 * (free trial, không cần đăng nhập / CV).
 *
 * Vì text không đổi, video avatar D-ID cho các câu này được cache theo
 * MD5(questionText + avatarImageUrl + voiceId) trong avatarService.js — generate
 * 1 lần / gender, dùng lại cho mọi user sau đó (xem videoPregenService.pregenerateSync).
 *
 * Shape khớp với QUESTION_OBJECTS mà InterviewRoom.jsx kỳ vọng (id, question, layer?, starGuidance?).
 */

export const BASELINE_QUESTIONS = [
  {
    id: "baseline-1",
    question:
      "Hãy giới thiệu ngắn gọn về bản thân, kinh nghiệm làm việc/học tập và định hướng nghề nghiệp của bạn.",
  },
  {
    id: "baseline-2",
    layer: "behavior",
    question:
      "Hãy kể về một thử thách hoặc khó khăn bạn từng gặp trong công việc hoặc học tập, và cách bạn đã xử lý nó.",
    starGuidance: {
      situation: ["Bối cảnh xảy ra thử thách là gì?"],
      task:      ["Bạn cần đạt được điều gì trong tình huống đó?"],
      action:    ["Bạn đã làm gì cụ thể để giải quyết?"],
      result:    ["Kết quả cuối cùng và bài học rút ra là gì?"],
    },
  },
  {
    id: "baseline-3",
    question:
      "Điều gì khiến bạn quan tâm đến vị trí/lĩnh vực này, và bạn nghĩ điểm mạnh nào của mình phù hợp nhất?",
  },
];

/** Danh sách text thuần — dùng cho pregen video (avatarService/videoPregenService). */
export function getBaselineQuestionTexts() {
  return BASELINE_QUESTIONS.map((q) => q.question);
}
