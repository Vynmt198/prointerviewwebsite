import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Mentor } from "../models/Mentor.js";
import { CourseQA } from "../models/CourseQA.js";
import { Review } from "../models/Review.js";
import { enrollmentAccessGranted } from "../helpers/enrollmentAccess.js";

const MONGO_ERR = "MongoDB chưa kết nối. Kiểm tra MONGO_URI trong .env.";

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function formatRelativeVi(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

function formatDateVi(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function flattenLessons(course) {
  const rows = [];
  for (const mod of course.modules || []) {
    for (const lesson of mod.lessons || []) {
      if (lesson?._id) rows.push({ id: lesson._id, title: lesson.title || "Bài học" });
    }
  }
  return rows;
}

async function assertMentorOwnsCourse(userId, courseId) {
  if (!isMongoReady()) return { ok: false, status: 503, error: MONGO_ERR };
  if (!mongoose.isValidObjectId(courseId)) {
    return { ok: false, status: 400, error: "courseId không hợp lệ." };
  }
  const mentor = await Mentor.findOne({ userId }).select("_id").lean();
  if (!mentor?._id) return { ok: false, status: 403, error: "Tài khoản chưa là mentor." };
  const course = await Course.findById(courseId).lean();
  if (!course) return { ok: false, status: 404, error: "Không tìm thấy khóa học." };
  if (String(course.mentorId) !== String(mentor._id)) {
    return { ok: false, status: 403, error: "Bạn không có quyền xem dữ liệu khóa học này." };
  }
  return { ok: true, mentor, course };
}

export async function getCourseStudentsForMentor(userId, courseId) {
  const gate = await assertMentorOwnsCourse(userId, courseId);
  if (!gate.ok) return gate;

  const rows = await Enrollment.find({ courseId: gate.course._id })
    .populate({ path: "userId", select: "name avatar email desiredPosition" })
    .sort({ updatedAt: -1 })
    .lean();

  const students = rows.map((e) => {
    const u = e.userId && typeof e.userId === "object" ? e.userId : null;
    const hasAccess = enrollmentAccessGranted(e);
    const progress = Number(e.progressPercent || 0);
    let status = "inactive";
    if (e.isCompleted) status = "completed";
    else if (progress > 0 && hasAccess) status = "active";

    return {
      id: String(e._id),
      userId: u?._id ? String(u._id) : "",
      name: u?.name || "Học viên",
      avatar: u?.avatar || "",
      role: u?.desiredPosition || "",
      progress: Math.round(progress),
      completedLessons: Array.isArray(e.completedLessons) ? e.completedLessons.length : 0,
      lastActive: formatRelativeVi(e.lastAccessedAt || e.updatedAt),
      enrolled: formatDateVi(e.createdAt),
      status,
      paymentStatus: e.paymentStatus || (hasAccess ? "paid" : "pending"),
      hasAccess,
    };
  });

  const withAccess = students.filter((s) => s.hasAccess);
  const active = withAccess.filter((s) => s.status === "active").length;
  const completed = withAccess.filter((s) => s.status === "completed").length;
  const avgProgress = withAccess.length
    ? Math.round(withAccess.reduce((sum, s) => sum + s.progress, 0) / withAccess.length)
    : 0;
  const inactive = withAccess.filter((s) => s.status === "inactive").length;
  const dropoffRate = withAccess.length ? Math.round((inactive / withAccess.length) * 100) : 0;

  return {
    ok: true,
    students,
    summary: {
      total: students.length,
      withAccess: withAccess.length,
      active,
      completed,
      avgProgress: `${avgProgress}%`,
      dropoffRate: `${dropoffRate}%`,
    },
  };
}

export async function getCourseQAForMentor(userId, courseId) {
  const gate = await assertMentorOwnsCourse(userId, courseId);
  if (!gate.ok) return gate;

  const lessons = flattenLessons(gate.course);
  const lessonIndexMap = new Map(lessons.map((l, i) => [String(l.id), i]));

  const rows = await CourseQA.find({ courseId: gate.course._id })
    .populate({ path: "userId", select: "name avatar" })
    .sort({ createdAt: -1 })
    .lean();

  const items = rows.map((q) => {
    const u = q.userId && typeof q.userId === "object" ? q.userId : null;
    const mentorAnswers = (q.answers || []).filter((a) => a.isMentor);
    const latestMentorAnswer = mentorAnswers[mentorAnswers.length - 1];
    return {
      id: String(q._id),
      lessonId: String(q.lessonId),
      lessonIdx: lessonIndexMap.get(String(q.lessonId)) ?? 0,
      lessonTitle: lessons[lessonIndexMap.get(String(q.lessonId)) ?? 0]?.title || "",
      student: u?.name || "Học viên",
      avatar: u?.avatar || "",
      question: q.question || "",
      time: formatRelativeVi(q.createdAt),
      likes: Number(q.upvotes || 0),
      isAnswered: Boolean(q.isAnswered) || mentorAnswers.length > 0,
      answer: latestMentorAnswer?.content || null,
      answers: (q.answers || []).map((a) => ({
        content: a.content,
        isMentor: Boolean(a.isMentor),
        createdAt: a.createdAt,
      })),
    };
  });

  return {
    ok: true,
    items,
    pendingCount: items.filter((i) => !i.isAnswered).length,
  };
}

export async function answerCourseQAForMentor(userId, courseId, qaId, content) {
  const gate = await assertMentorOwnsCourse(userId, courseId);
  if (!gate.ok) return gate;
  if (!mongoose.isValidObjectId(qaId)) {
    return { ok: false, status: 400, error: "qaId không hợp lệ." };
  }
  const text = String(content || "").trim();
  if (!text) return { ok: false, status: 400, error: "Nội dung trả lời không được để trống." };

  const doc = await CourseQA.findOne({ _id: qaId, courseId: gate.course._id });
  if (!doc) return { ok: false, status: 404, error: "Câu hỏi không tồn tại." };

  const mentor = await Mentor.findOne({ userId }).select("_id").lean();
  doc.answers.push({
    userId: mentor?._id,
    isMentor: true,
    content: text,
    upvotes: 0,
    createdAt: new Date(),
  });
  doc.isAnswered = true;
  await doc.save();

  return { ok: true, message: "Đã gửi câu trả lời." };
}

export async function getCourseReviewsForMentor(userId, courseId) {
  const gate = await assertMentorOwnsCourse(userId, courseId);
  if (!gate.ok) return gate;

  const rows = await Review.find({
    targetType: "course",
    targetId: gate.course._id,
    isVisible: { $ne: false },
  })
    .sort({ createdAt: -1 })
    .populate({ path: "userId", select: "name avatar desiredPosition currentCompany" })
    .lean();

  const reviews = rows.map((r) => {
    const u = r.userId && typeof r.userId === "object" ? r.userId : null;
    return {
      id: String(r._id),
      name: u?.name || "Học viên",
      avatar: u?.avatar || "",
      role: u?.desiredPosition || u?.currentCompany || "",
      rating: Number(r.rating || 0),
      comment: r.comment || "",
      date: formatDateVi(r.createdAt),
      helpful: 0,
      verified: Boolean(r.isVerified),
      responded: Boolean(r.reply?.content),
      response: r.reply?.content || "",
    };
  });

  const ratings = reviews.map((r) => r.rating).filter((n) => n > 0);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : "0.0";
  const pendingReply = reviews.filter((r) => !r.responded).length;

  return {
    ok: true,
    reviews,
    summary: {
      avgRating,
      total: reviews.length,
      pendingReply,
      helpfulRate: reviews.length ? "100%" : "—",
    },
  };
}

export async function getCourseAnalyticsForMentor(userId, courseId) {
  const gate = await assertMentorOwnsCourse(userId, courseId);
  if (!gate.ok) return gate;

  const lessons = flattenLessons(gate.course);
  const enrollments = await Enrollment.find({ courseId: gate.course._id }).lean();
  const paid = enrollments.filter(enrollmentAccessGranted);
  const totalStudents = paid.length;

  const lessonStats = [];
  let prevCompletionRate = 100;
  for (let index = 0; index < lessons.length; index++) {
    const lesson = lessons[index];
    const lessonIdStr = String(lesson.id);
    let completedCount = 0;
    for (const e of paid) {
      const done = (e.completedLessons || []).some((id) => String(id) === lessonIdStr);
      if (done) completedCount += 1;
    }
    const completionRate = totalStudents
      ? Math.max(0, Math.min(100, Math.round((completedCount / totalStudents) * 100)))
      : 0;
    const dropoffRate =
      index === 0 ? 0 : Math.max(0, Math.min(100, prevCompletionRate - completionRate));
    lessonStats.push({
      lessonIndex: index + 1,
      title: lesson.title,
      views: completedCount,
      completionRate,
      avgWatchTime: 0,
      dropoffRate,
      questions: 0,
    });
    prevCompletionRate = completionRate;
  }

  // Count QA per lesson
  const qaRows = await CourseQA.find({ courseId: gate.course._id }).select("lessonId").lean();
  const qaByLesson = new Map();
  for (const q of qaRows) {
    const key = String(q.lessonId);
    qaByLesson.set(key, (qaByLesson.get(key) || 0) + 1);
  }
  for (let i = 0; i < lessons.length; i++) {
    lessonStats[i].questions = qaByLesson.get(String(lessons[i].id)) || 0;
  }

  return {
    ok: true,
    lessonStats,
    totals: {
      enrollments: enrollments.length,
      paidStudents: totalStudents,
      lessons: lessons.length,
    },
  };
}
