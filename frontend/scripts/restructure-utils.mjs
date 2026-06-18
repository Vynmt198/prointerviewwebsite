/**
 * One-off: move utils → api/ + utils/{domain}/ and rewrite imports under src/app.
 * Run: node scripts/restructure-utils.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, "../src/app");
const UTILS = path.join(APP, "utils");
const API = path.join(APP, "api");

const moves = [
  ["api.js", "api/http.js"],
  ["adminApi.js", "api/adminApi.js"],
  ["bookingsApi.js", "api/bookingsApi.js"],
  ["courseApi.js", "api/courseApi.js"],
  ["cvApi.js", "api/cvApi.js"],
  ["dashboardApi.js", "api/dashboardApi.js"],
  ["enrollmentApi.js", "api/enrollmentApi.js"],
  ["interviewsApi.js", "api/interviewsApi.js"],
  ["mentorApi.js", "api/mentorApi.js"],
  ["notificationApi.js", "api/notificationApi.js"],
  ["paymentsApi.js", "api/paymentsApi.js"],
  ["plansApi.js", "api/plansApi.js"],
  ["reportsApi.js", "api/reportsApi.js"],
  ["reviewsApi.js", "api/reviewsApi.js"],
  ["uploadApi.js", "api/uploadApi.js"],
  ["auth.js", "utils/auth/auth.js"],
  ["authGate.js", "utils/auth/authGate.js"],
  ["requireAuthLoader.js", "utils/auth/requireAuthLoader.js"],
  ["appPath.js", "utils/auth/appPath.js"],
  ["cvMappers.js", "utils/cv/cvMappers.js"],
  ["cvMappers.test.js", "utils/cv/cvMappers.test.js"],
  ["cvFileUpload.js", "utils/cv/cvFileUpload.js"],
  ["bookings.js", "utils/booking/bookings.js"],
  ["bookingMappers.js", "utils/booking/bookingMappers.js"],
  ["bookingAttachments.js", "utils/booking/bookingAttachments.js"],
  ["bookingRescheduleSlots.js", "utils/booking/bookingRescheduleSlots.js"],
  ["bookingSchedule.js", "utils/booking/bookingSchedule.js"],
  ["bookingSchedule.test.js", "utils/booking/bookingSchedule.test.js"],
  ["sessionTypeLabels.js", "utils/booking/sessionTypeLabels.js"],
  ["mentorApplyPayload.js", "utils/mentor/mentorApplyPayload.js"],
  ["mentorProfileHelpers.js", "utils/mentor/mentorProfileHelpers.js"],
  ["adminCoursePreview.js", "utils/admin/adminCoursePreview.js"],
  ["adminPaymentUi.js", "utils/admin/adminPaymentUi.js"],
  ["adminTransferConfirm.js", "utils/admin/adminTransferConfirm.js"],
  ["courseAdminReview.js", "utils/admin/courseAdminReview.js"],
  ["courseStats.js", "utils/course/courseStats.js"],
  ["enrollmentAccess.js", "utils/course/enrollmentAccess.js"],
  ["planSync.js", "utils/plans/planSync.js"],
  ["planSync.test.js", "utils/plans/planSync.test.js"],
  ["aiDialogue.js", "utils/interview/aiDialogue.js"],
  ["profileCvValidation.js", "utils/profile/profileCvValidation.js"],
  ["profileEducationHistory.js", "utils/profile/profileEducationHistory.js"],
  ["profileWorkHistory.js", "utils/profile/profileWorkHistory.js"],
  ["apiToast.js", "utils/shared/apiToast.js"],
  ["apiToast.test.js", "utils/shared/apiToast.test.js"],
  ["documentTitle.js", "utils/shared/documentTitle.js"],
  ["history.js", "utils/shared/history.js"],
  ["learningDarkMode.js", "utils/shared/learningDarkMode.js"],
  ["mediaUrl.js", "utils/shared/mediaUrl.js"],
  ["meetingLinks.js", "utils/shared/meetingLinks.js"],
  ["videoDuration.js", "utils/shared/videoDuration.js"],
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

for (const [from, to] of moves) {
  const src = path.join(UTILS, from);
  const dest = path.join(APP, to);
  if (!fs.existsSync(src)) {
    console.warn("skip missing:", from);
    continue;
  }
  ensureDir(dest);
  fs.renameSync(src, dest);
  console.log("moved", from, "→", to);
}

/** @type {[RegExp, string][]} */
const importRules = [
  [/from ["'](\.\.\/)+utils\/api\.js["']/g, (m) => m.replace("utils/api.js", "api/http.js")],
  [/from ["'](\.\.\/)+utils\/api["']/g, (m) => m.replace("utils/api", "api/http.js")],
  [/from ["']\.\/api\.js["']/g, 'from "./http.js"'],
  [/from ["'](\.\.\/)+utils\/([a-zA-Z]+Api)\.js["']/g, (m, _p, name) =>
    m.replace(`utils/${name}.js`, `api/${name}.js`),
  ],
  [/from ["'](\.\.\/)+utils\/auth\.js["']/g, (m) => m.replace("utils/auth.js", "utils/auth/auth.js")],
  [/from ["'](\.\.\/)+utils\/auth["']/g, (m) => m.replace("utils/auth", "utils/auth/auth.js")],
  [/from ["'](\.\.\/)+utils\/authGate\.js["']/g, (m) => m.replace("utils/authGate.js", "utils/auth/authGate.js")],
  [/from ["'](\.\.\/)+utils\/requireAuthLoader\.js["']/g, (m) =>
    m.replace("utils/requireAuthLoader.js", "utils/auth/requireAuthLoader.js"),
  ],
  [/from ["'](\.\.\/)+utils\/appPath\.js["']/g, (m) => m.replace("utils/appPath.js", "utils/auth/appPath.js")],
  [/from ["'](\.\.\/)+utils\/cvMappers\.js["']/g, (m) => m.replace("utils/cvMappers.js", "utils/cv/cvMappers.js")],
  [/from ["'](\.\.\/)+utils\/cvFileUpload\.js["']/g, (m) =>
    m.replace("utils/cvFileUpload.js", "utils/cv/cvFileUpload.js"),
  ],
  [/from ["'](\.\.\/)+utils\/planSync\.js["']/g, (m) => m.replace("utils/planSync.js", "utils/plans/planSync.js")],
  [/from ["'](\.\.\/)+utils\/apiToast\.js["']/g, (m) => m.replace("utils/apiToast.js", "utils/shared/apiToast.js")],
  [/from ["'](\.\.\/)+utils\/apiToast["']/g, (m) => m.replace("utils/apiToast", "utils/shared/apiToast.js")],
  [/from ["'](\.\.\/)+utils\/mediaUrl\.js["']/g, (m) => m.replace("utils/mediaUrl.js", "utils/shared/mediaUrl.js")],
  [/from ["'](\.\.\/)+utils\/mediaUrl["']/g, (m) => m.replace("utils/mediaUrl", "utils/shared/mediaUrl.js")],
  [/from ["'](\.\.\/)+utils\/history\.js["']/g, (m) => m.replace("utils/history.js", "utils/shared/history.js")],
  [/from ["'](\.\.\/)+utils\/history["']/g, (m) => m.replace("utils/history", "utils/shared/history.js")],
  [/from ["'](\.\.\/)+utils\/bookings\.js["']/g, (m) => m.replace("utils/bookings.js", "utils/booking/bookings.js")],
  [/from ["'](\.\.\/)+utils\/bookingMappers\.js["']/g, (m) =>
    m.replace("utils/bookingMappers.js", "utils/booking/bookingMappers.js"),
  ],
  [/from ["'](\.\.\/)+utils\/bookingAttachments\.js["']/g, (m) =>
    m.replace("utils/bookingAttachments.js", "utils/booking/bookingAttachments.js"),
  ],
  [/from ["'](\.\.\/)+utils\/bookingRescheduleSlots\.js["']/g, (m) =>
    m.replace("utils/bookingRescheduleSlots.js", "utils/booking/bookingRescheduleSlots.js"),
  ],
  [/from ["'](\.\.\/)+utils\/bookingSchedule\.js["']/g, (m) =>
    m.replace("utils/bookingSchedule.js", "utils/booking/bookingSchedule.js"),
  ],
  [/from ["'](\.\.\/)+utils\/sessionTypeLabels\.js["']/g, (m) =>
    m.replace("utils/sessionTypeLabels.js", "utils/booking/sessionTypeLabels.js"),
  ],
  [/from ["'](\.\.\/)+utils\/mentorApplyPayload\.js["']/g, (m) =>
    m.replace("utils/mentorApplyPayload.js", "utils/mentor/mentorApplyPayload.js"),
  ],
  [/from ["'](\.\.\/)+utils\/mentorProfileHelpers\.js["']/g, (m) =>
    m.replace("utils/mentorProfileHelpers.js", "utils/mentor/mentorProfileHelpers.js"),
  ],
  [/from ["'](\.\.\/)+utils\/aiDialogue\.js["']/g, (m) => m.replace("utils/aiDialogue.js", "utils/interview/aiDialogue.js")],
  [/from ["'](\.\.\/)+utils\/documentTitle\.js["']/g, (m) =>
    m.replace("utils/documentTitle.js", "utils/shared/documentTitle.js"),
  ],
  [/from ["'](\.\.\/)+utils\/meetingLinks\.js["']/g, (m) =>
    m.replace("utils/meetingLinks.js", "utils/shared/meetingLinks.js"),
  ],
  [/from ["'](\.\.\/)+utils\/learningDarkMode\.js["']/g, (m) =>
    m.replace("utils/learningDarkMode.js", "utils/shared/learningDarkMode.js"),
  ],
  [/from ["'](\.\.\/)+utils\/videoDuration\.js["']/g, (m) =>
    m.replace("utils/videoDuration.js", "utils/shared/videoDuration.js"),
  ],
  [/from ["'](\.\.\/)+utils\/profileCvValidation\.js["']/g, (m) =>
    m.replace("utils/profileCvValidation.js", "utils/profile/profileCvValidation.js"),
  ],
  [/from ["'](\.\.\/)+utils\/profileEducationHistory\.js["']/g, (m) =>
    m.replace("utils/profileEducationHistory.js", "utils/profile/profileEducationHistory.js"),
  ],
  [/from ["'](\.\.\/)+utils\/profileWorkHistory\.js["']/g, (m) =>
    m.replace("utils/profileWorkHistory.js", "utils/profile/profileWorkHistory.js"),
  ],
  [/from ["'](\.\.\/)+utils\/courseStats\.js["']/g, (m) => m.replace("utils/courseStats.js", "utils/course/courseStats.js")],
  [/from ["'](\.\.\/)+utils\/enrollmentAccess\.js["']/g, (m) =>
    m.replace("utils/enrollmentAccess.js", "utils/course/enrollmentAccess.js"),
  ],
  [/from ["'](\.\.\/)+utils\/adminCoursePreview\.js["']/g, (m) =>
    m.replace("utils/adminCoursePreview.js", "utils/admin/adminCoursePreview.js"),
  ],
  [/from ["'](\.\.\/)+utils\/adminPaymentUi\.js["']/g, (m) =>
    m.replace("utils/adminPaymentUi.js", "utils/admin/adminPaymentUi.js"),
  ],
  [/from ["'](\.\.\/)+utils\/adminTransferConfirm\.js["']/g, (m) =>
    m.replace("utils/adminTransferConfirm.js", "utils/admin/adminTransferConfirm.js"),
  ],
  [/from ["'](\.\.\/)+utils\/courseAdminReview\.js["']/g, (m) =>
    m.replace("utils/courseAdminReview.js", "utils/admin/courseAdminReview.js"),
  ],
  [/import\(["'](\.\.\/)+utils\/auth\.js["']\)/g, (m) => m.replace("utils/auth.js", "utils/auth/auth.js")],
  [/import\(["'](\.\.\/)+utils\/cvApi\.js["']\)/g, (m) => m.replace("utils/cvApi.js", "api/cvApi.js")],
];

/** relative imports inside moved modules */
const internalRules = [
  // api/*
  [/from "\.\/auth\.js"/g, 'from "../utils/auth/auth.js"'],
  [/from "\.\/auth"/g, 'from "../utils/auth/auth.js"'],
  // utils/auth/*
  [/from "\.\.\/api\.js"/g, 'from "../../api/http.js"'],
  [/from "\.\/api\.js"/g, 'from "../../api/http.js"'],
  [/from "\.\/planSync\.js"/g, 'from "../plans/planSync.js"'],
  [/from "\.\.\/planSync\.js"/g, 'from "../plans/planSync.js"'],
  [/export \{ apiPlanToLocalFlags \} from "\.\/planSync\.js"/g, 'export { apiPlanToLocalFlags } from "../plans/planSync.js"'],
  // utils/cv/*
  [/from "\.\.\/auth\.js"/g, 'from "../auth/auth.js"'],
  [/from "\.\/uploadApi\.js"/g, 'from "../../api/uploadApi.js"'],
  [/from "\.\/cvMappers\.js"/g, 'from "./cvMappers.js"'],
  // utils/booking/*
  [/from "\.\/bookingsApi"/g, 'from "../../api/bookingsApi.js"'],
  [/from "\.\/bookingsApi\.js"/g, 'from "../../api/bookingsApi.js"'],
  [/from "\.\/mentorApi"/g, 'from "../../api/mentorApi.js"'],
  [/from "\.\/mentorApi\.js"/g, 'from "../../api/mentorApi.js"'],
  [/from "\.\/bookingSchedule"/g, 'from "./bookingSchedule.js"'],
  [/from "\.\/bookingMappers"/g, 'from "./bookingMappers.js"'],
  [/from "\.\/meetingLinks"/g, 'from "../shared/meetingLinks.js"'],
  [/from "\.\/mediaUrl"/g, 'from "../shared/mediaUrl.js"'],
  [/from "\.\/mediaUrl\.js"/g, 'from "../shared/mediaUrl.js"'],
  // utils/mentor/*
  [/from "\.\/profileEducationHistory"/g, 'from "../profile/profileEducationHistory.js"'],
  // utils/profile/*
  [/from "\.\/profileWorkHistory"/g, 'from "./profileWorkHistory.js"'],
  // utils/shared/*
  [/from "\.\/api\.js"/g, 'from "../../api/http.js"'],
  // utils/plans tests
  [/from "\.\/planSync\.js"/g, 'from "./planSync.js"'],
  // api/courseApi
  [/from "\.\/courseStats\.js"/g, 'from "../utils/course/courseStats.js"'],
  [/from "\.\/cvMappers\.js"/g, 'from "../utils/cv/cvMappers.js"'],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "dist") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx|mjs)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function applyRules(content, rules) {
  let out = content;
  for (const [re, repl] of rules) {
    out = typeof repl === "function" ? out.replace(re, repl) : out.replace(re, repl);
  }
  return out;
}

const files = walk(path.join(__dirname, "../src"));
for (const file of files) {
  const rel = path.relative(APP, file);
  const isInternal =
    rel.startsWith("api" + path.sep) ||
    rel.startsWith("utils" + path.sep) ||
    rel.startsWith("hooks" + path.sep);
  let content = fs.readFileSync(file, "utf8");
  const next = applyRules(applyRules(content, importRules), isInternal ? internalRules : []);
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log("updated imports:", rel);
  }
}

// achievementsApi was already under app/api
const ach = path.join(API, "achievementsApi.js");
if (fs.existsSync(ach)) {
  let c = fs.readFileSync(ach, "utf8");
  c = c.replace('from "../utils/api.js"', 'from "./http.js"');
  c = c.replace('from "../utils/auth.js"', 'from "../utils/auth/auth.js"');
  fs.writeFileSync(ach, c);
}

console.log("done");
