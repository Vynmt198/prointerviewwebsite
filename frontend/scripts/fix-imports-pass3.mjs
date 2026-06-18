import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src");

const pairs = [
  ["../../utils/bookingSchedule", "../../utils/booking/bookingSchedule.js"],
  ["../../utils/bookingMappers", "../../utils/booking/bookingMappers.js"],
  ["../../utils/bookingRescheduleSlots", "../../utils/booking/bookingRescheduleSlots.js"],
  ["../../utils/bookingAttachments", "../../utils/booking/bookingAttachments.js"],
  ["../../utils/sessionTypeLabels", "../../utils/booking/sessionTypeLabels.js"],
  ["../../utils/meetingLinks", "../../utils/shared/meetingLinks.js"],
  ["../../utils/mentorApplyPayload", "../../utils/mentor/mentorApplyPayload.js"],
  ["../../utils/mentorProfileHelpers", "../../utils/mentor/mentorProfileHelpers.js"],
  ["../../utils/profileCvValidation", "../../utils/profile/profileCvValidation.js"],
  ["../../utils/profileWorkHistory", "../../utils/profile/profileWorkHistory.js"],
  ["../../utils/profileEducationHistory", "../../utils/profile/profileEducationHistory.js"],
  ["../../utils/courseStats", "../../utils/course/courseStats.js"],
  ["../../utils/courseAdminReview", "../../utils/admin/courseAdminReview.js"],
  ["../../utils/learningDarkMode", "../../utils/shared/learningDarkMode.js"],
  ["../../utils/videoDuration", "../../utils/shared/videoDuration.js"],
  ["../../../utils/videoDuration", "../../../utils/shared/videoDuration.js"],
  ["../../../utils/uploadApi", "../../../api/uploadApi.js"],
  ["../../../utils/mentorProfileHelpers", "../../../utils/mentor/mentorProfileHelpers.js"],
  ["../../utils/uploadApi", "../../api/uploadApi.js"],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

for (const file of walk(ROOT)) {
  let c = fs.readFileSync(file, "utf8");
  let orig = c;
  for (const [a, b] of pairs) {
    c = c.split(`from "${a}"`).join(`from "${b}"`);
    c = c.split(`from '${a}'`).join(`from '${b}'`);
  }
  if (c !== orig) {
    fs.writeFileSync(file, c);
    console.log("fixed", path.relative(ROOT, file));
  }
}

console.log("pass3 done");
