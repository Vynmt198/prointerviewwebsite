import { Star, MapPin, Briefcase, Video, BadgeCheck } from "lucide-react";
import { MENTOR_BOOKING_COPY } from "../../constants/brandVoice";

const TZ_LOCATION = {
  "Asia/Ho_Chi_Minh": "TP. Hồ Chí Minh",
  "Asia/Hanoi": "Hà Nội",
  "Asia/Bangkok": "Bangkok",
};

function formatVnd(amount) {
  return `${Number(amount || 0).toLocaleString("vi-VN")} VND`;
}

function locationLabel(timezone) {
  const tz = String(timezone || "").trim();
  return TZ_LOCATION[tz] || "Việt Nam";
}

function experienceLabel(years) {
  const n = Number(years) || 0;
  if (n <= 0) return "Kinh nghiệm đang cập nhật";
  return `${n} năm kinh nghiệm`;
}

function displayTitle(mentor) {
  const title = (mentor.title || "").trim();
  const company = (mentor.company || "").trim();
  if (title && title.toLowerCase() !== "mentor") {
    return company && company !== "—" ? `${title} · ${company}` : title;
  }
  if (mentor.field) return mentor.field;
  return "Mentor ProInterview";
}

/** Giá buổi mentor 1:1 (chưa có dịch vụ Review CV). */
function resolveMentorSessionOffer(mentor) {
  const hourly = Number(mentor.price) || 0;
  const fromApi = Array.isArray(mentor.sessionTypes) ? mentor.sessionTypes : [];
  const mock = fromApi.find((s) => s?.type === "mock_interview");

  return {
    label: MENTOR_BOOKING_COPY.sessionTitle,
    price: mock?.price ?? hourly,
    minutes: mock?.durationMinutes ?? 60,
    icon: Video,
  };
}

function StarRating({ rating, reviewCount }) {
  const value = Number(rating) || 0;
  const filled = Math.round(value);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-bold text-slate-900">{value > 0 ? value.toFixed(1) : "—"}</span>
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`size-4 ${
              i <= filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
            }`}
          />
        ))}
      </span>
      <span className="text-slate-500">
        ({reviewCount} {reviewCount === 1 ? "đánh giá" : "đánh giá"})
      </span>
    </div>
  );
}

export function MentorListCard({ mentor, onOpenProfile, onBook }) {
  const bio = (mentor.bio || "").trim();
  const offer = resolveMentorSessionOffer(mentor);
  const OfferIcon = offer.icon;
  const avatarSrc =
    mentor.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name || "M")}&background=ede9fe&color=6d28d9`;

  return (
    <article className="grid grid-cols-1 gap-4 border-b border-slate-200/90 py-6 last:border-b-0 md:grid-cols-[88px_minmax(0,1fr)_200px] md:items-start md:gap-5 md:py-7 lg:grid-cols-[88px_minmax(0,1fr)_220px]">
      <button
        type="button"
        onClick={onOpenProfile}
        className="relative mx-auto shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8037f4] md:mx-0"
      >
        <img
          src={avatarSrc}
          alt=""
          className="size-20 rounded-full border-2 border-violet-100 object-cover md:size-[88px]"
        />
        {mentor.available ? (
          <span
            className="absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-500"
            title="Có lịch trống"
          />
        ) : null}
      </button>

      <div className="min-w-0">
          <button
            type="button"
            onClick={onOpenProfile}
            className="group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8037f4] rounded-sm"
          >
            <h3 className="flex flex-wrap items-center gap-1.5 text-lg font-bold text-slate-900 group-hover:text-[#8037f4]">
              {mentor.name}
              {mentor.isVerified ? (
                <BadgeCheck className="size-5 shrink-0 fill-amber-400 text-white" aria-label="Mentor đã xác minh" />
              ) : null}
            </h3>
            <p className="mt-0.5 text-sm font-medium text-slate-600">{displayTitle(mentor)}</p>
          </button>

          <div className="mt-2">
            <StarRating rating={mentor.rating} reviewCount={mentor.reviews ?? 0} />
          </div>

          <ul className="mt-2.5 space-y-1 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden />
              {locationLabel(mentor.timezone)}
            </li>
            <li className="flex items-center gap-2">
              <Briefcase className="size-4 shrink-0 text-slate-400" aria-hidden />
              {experienceLabel(mentor.experience)}
            </li>
          </ul>

          {bio ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{bio}</p>
          ) : null}

          {mentor.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
      </div>

      <div className="flex w-full flex-col gap-3 md:w-auto md:justify-self-end">
        <div className="flex items-start gap-2.5 text-sm text-slate-700">
          <OfferIcon className="mt-0.5 size-4 shrink-0 text-violet-500" aria-hidden />
          <div>
            <p className="font-semibold text-slate-800">{offer.label}</p>
            <p className="text-slate-600">
              <span className="font-bold text-slate-900">{formatVnd(offer.price)}</span>
              <span className="text-slate-500"> / {offer.minutes} phút</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBook}
          className="mt-1 w-full rounded-lg bg-[#8037f4] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          Đặt lịch
        </button>
      </div>
    </article>
  );
}
