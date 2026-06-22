import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src");

const pairs = [
  ['from "./http.js"', 'from "../../api/http.js"'],
  ['from "../utils/auth/auth.js"', 'from "./auth.js"'],
  ['from "../../utils/authGate"', 'from "../../utils/auth/authGate.js"'],
  ['from "../utils/authGate"', 'from "../utils/auth/authGate.js"'],
  ['from "../../utils/appPath"', 'from "../../utils/auth/appPath.js"'],
  ['from "./utils/appPath"', 'from "./utils/auth/appPath.js"'],
  ['from "./utils/auth"', 'from "./utils/auth/auth.js"'],
  ['from "./utils/auth.js"', 'from "./utils/auth/auth.js"'],
  ['from "./utils/requireAuthLoader.js"', 'from "./utils/auth/requireAuthLoader.js"'],
  ['from "../../utils/mentorApi"', 'from "../../api/mentorApi.js"'],
  ['from "../utils/mentorApi"', 'from "../api/mentorApi.js"'],
  ['from "../../utils/bookingsApi"', 'from "../../api/bookingsApi.js"'],
  ['from "../../utils/cvApi"', 'from "../../api/cvApi.js"'],
  ['from "../../utils/bookings"', 'from "../../utils/booking/bookings.js"'],
  ['from "../../utils/adminApi"', 'from "../../api/adminApi.js"'],
  ['from "../../utils/dashboardApi"', 'from "../../api/dashboardApi.js"'],
  ['from "../../utils/courseApi"', 'from "../../api/courseApi.js"'],
  ['from "../../utils/plansApi"', 'from "../../api/plansApi.js"'],
  ['from "../../utils/paymentsApi"', 'from "../../api/paymentsApi.js"'],
  ['from "../../utils/enrollmentApi"', 'from "../../api/enrollmentApi.js"'],
  ['from "../../utils/interviewsApi"', 'from "../../api/interviewsApi.js"'],
  ['from "../../utils/reportsApi"', 'from "../../api/reportsApi.js"'],
  ['from "../../utils/reviewsApi"', 'from "../../api/reviewsApi.js"'],
  ['from "../../utils/uploadApi"', 'from "../../api/uploadApi.js"'],
  ['from "../../utils/notificationApi"', 'from "../../api/notificationApi.js"'],
  ['from "../../utils/apiToast"', 'from "../../utils/shared/apiToast.js"'],
  ['from "../../utils/documentTitle"', 'from "../../utils/shared/documentTitle.js"'],
  ['from "../../utils/history"', 'from "../../utils/shared/history.js"'],
  ['from "../../utils/mediaUrl"', 'from "../../utils/shared/mediaUrl.js"'],
  ['from "../../utils/aiDialogue"', 'from "../../utils/interview/aiDialogue.js"'],
  ['from "../../utils/planSync"', 'from "../../utils/plans/planSync.js"'],
  ['from "../../api/http.js"', 'from "./http.js"'], // only in api/http.js itself - skip
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
    if (file.endsWith("api\\http.js") || file.endsWith("api/http.js")) {
      if (a.includes("./http.js")) continue;
    }
    c = c.split(a).join(b);
  }
  if (c !== orig) {
    fs.writeFileSync(file, c);
    console.log("fixed", path.relative(ROOT, file));
  }
}

console.log("pass2 done");
