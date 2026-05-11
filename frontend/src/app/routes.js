import { createHashRouter, redirect } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Home } from "./pages/home/Home";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { Checkout } from "./pages/booking/Checkout";
import { Dashboard } from "./pages/account/Dashboard";
import { CVAnalysis } from "./pages/cv/CVAnalysis";
import { AnalysisHistory } from "./pages/cv/AnalysisHistory";
import { Interview } from "./pages/interview/Interview";
import { AIGenderSelection } from "./pages/interview/AIGenderSelection";
import InterviewRoom from "./pages/interview/InterviewRoom";
import { InterviewFeedback } from "./pages/interview/InterviewFeedback";
import { Mentors } from "./pages/mentors/Mentors";
import { MentorProfile } from "./pages/mentors/MentorProfile";
import { Booking } from "./pages/booking/Booking";
import { SessionDetail } from "./pages/booking/SessionDetail";
import { Profile } from "./pages/account/Profile";
import { Settings } from "./pages/account/Settings";
import { PaymentReturn } from "./pages/payment/PaymentReturn";
import { SuccessPage } from "./pages/payment/SuccessPage";
import { FailurePage } from "./pages/payment/FailurePage";
import { AvatarDemo } from "./pages/interview/AvatarDemo";
import { MentorReview } from "./pages/booking/MentorReview";
import { MentorDashboard } from "./pages/mentor/MentorDashboard";
import { MentorSchedule } from "./pages/mentor/MentorSchedule";
import { MentorAnalytics } from "./pages/mentor/MentorAnalytics";
import { MentorMeetingDetail } from "./pages/mentor/MentorMeetingDetail";
import { MentorReviews } from "./pages/mentor/MentorReviews";
import { MeetingRoom } from "./pages/mentor/MeetingRoom";
import { MentorFinance } from "./pages/mentor/MentorFinance";
import { Courses } from "./pages/courses/Courses";
import { CourseDetail } from "./pages/courses/CourseDetail";
import { CourseLearning } from "./pages/courses/CourseLearning";
import { MentorCourseManagement } from "./pages/mentor/MentorCourseManagement";
import { MentorCourseEdit } from "./pages/mentor/MentorCourseEdit";
import { MentorPeerReview } from "./pages/mentor/MentorPeerReview";
import { MentorArea } from "./pages/mentor/MentorArea";
import { Pricing } from "./pages/home/Pricing";
import { AdminLayout } from "./pages/admin/AdminLayout.jsx";
import { adminLoader } from "./pages/admin/adminLoader.js";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { AdminMentors } from "./pages/admin/AdminMentors.jsx";
import { AdminUsers } from "./pages/admin/AdminUsers.jsx";
import { AdminBookings } from "./pages/admin/AdminBookings.jsx";
import { AdminMentorsPending } from "./pages/admin/AdminMentorsPending.jsx";
import {
  AdminUserDetail,
  AdminMentorDetail,
  AdminFinance,
  AdminTransactions,
  AdminPayouts,
  AdminBookingDetail,
  AdminContentQuestions,
  AdminContentVideos,
  AdminContentCourses,
  AdminAnalytics,
  AdminSystemSettings,
  AdminReviews,
  AdminSupport,
} from "./pages/admin/AdminPlaceholders.jsx";

export const router = createHashRouter([
  { path: "/", Component: Home },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  { path: "/forgot-password", Component: ForgotPassword },
  { path: "/reset-password", Component: ResetPassword },
  { path: "/checkout", Component: Checkout },
  { path: "/pricing", Component: Pricing },
  { path: "/payment-return", Component: PaymentReturn },
  { path: "/payment-success", Component: SuccessPage },
  { path: "/payment-failure", Component: FailurePage },
  { path: "/avatar-demo", Component: AvatarDemo },
  // Course learning — full-screen, no sidebar
  { path: "/courses/:id/learn", Component: CourseLearning },
  {
    path: "/admin",
    Component: AdminLayout,
    loader: adminLoader,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "analytics", Component: AdminAnalytics },
      { path: "users", Component: AdminUsers },
      { path: "users/:id", Component: AdminUserDetail },
      { path: "mentors/pending", Component: AdminMentorsPending },
      { path: "mentors/:id", Component: AdminMentorDetail },
      { path: "mentors", Component: AdminMentors },
      { path: "finance", Component: AdminFinance },
      { path: "transactions", Component: AdminTransactions },
      { path: "payouts", Component: AdminPayouts },
      { path: "bookings", Component: AdminBookings },
      { path: "bookings/:id", Component: AdminBookingDetail },
      { path: "content/questions", Component: AdminContentQuestions },
      { path: "content/videos", Component: AdminContentVideos },
      { path: "content/courses", Component: AdminContentCourses },
      { path: "settings", Component: AdminSystemSettings },
      { path: "reviews", Component: AdminReviews },
      { path: "support", Component: AdminSupport },
    ],
  },
  {
    Component: AppLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "cv-analysis", Component: CVAnalysis },
      { path: "cv-analysis/history", Component: AnalysisHistory },
      { path: "interview", Component: Interview },
      { path: "interview/gender", Component: AIGenderSelection },
      { path: "interview/room", Component: InterviewRoom },
      { path: "interview/feedback", Component: InterviewFeedback },
      { path: "mentors", Component: Mentors },
      { path: "mentors/:id", Component: MentorProfile },
      { path: "booking/:id", Component: Booking },
      { path: "booking", Component: Booking },
      { path: "session/:id", Component: SessionDetail },
      { path: "review/:sessionId", Component: MentorReview },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
      {
        path: "mentor",
        Component: MentorArea,
        children: [
          { path: "dashboard", Component: MentorDashboard },
          { path: "schedule", Component: MentorSchedule },
          { path: "finance", Component: MentorFinance },
          { path: "analytics", Component: MentorAnalytics },
          { path: "reviews", Component: MentorReviews },
          { path: "meeting/:sessionId", Component: MeetingRoom },
          { path: "meeting-detail/:sessionId", Component: MentorMeetingDetail },
          { path: "courses", Component: MentorCourseManagement },
          { path: "courses/:id/edit", Component: MentorCourseEdit },
          { path: "peer-review", Component: MentorPeerReview },
        ],
      },
      { path: "courses", Component: Courses },
      { path: "courses/:id", Component: CourseDetail },
    ],
  },
  // Wildcard route outside AppLayout to catch all unmatched routes
  { path: "*", loader: () => redirect("/") },
]);