import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search as MagnifyingGlass,
  Star,
  Filter as Funnel,
  Clock,
  CheckCircle,
  ChevronDown as CaretDown,
  X,
  Loader2 as CircleNotch,
  Users,
  Zap as Lightning,
  BadgeCheck as SealCheck,
  AlertCircle,
} from "lucide-react";
import { fetchMentors } from "../../utils/mentorApi";
import { FIELDS } from "../../data/mockData";

const EXPERIENCE_OPTIONS = ["Tất cả", "1-3 năm", "4-6 năm", "7+ năm"];
const PRICE_OPTIONS = [
  { label: "Tất cả", min: 0, max: Infinity },
  { label: "Dưới 280k", min: 0, max: 280000 },
  { label: "280k - 320k", min: 280000, max: 320000 },
  { label: "Trên 320k", min: 320000, max: Infinity },
];
const RATING_OPTIONS = ["Tất cả", "4.5+", "4.0+", "3.5+"];

export function Mentors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState("Tất cả");
  const [selectedExp, setSelectedExp] = useState("Tất cả");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedRating, setSelectedRating] = useState("Tất cả");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchMentors()
      .then((data) => { 
        console.log("Mentors loaded:", data); 
        setMentors(data); 
        setLoading(false); 
      })
      .catch((e) => { 
        console.error("Error loading mentors:", e);
        setError(String(e)); 
        setLoading(false); 
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredMentors = useMemo(() => {
    console.log("Filtering mentors. Total mentors:", mentors.length);
    console.log("Filters:", { search, selectedField, selectedExp, selectedPrice, selectedRating, availableOnly });
    const filtered = mentors.filter((m) => {
      const matchSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase()) || m.title.toLowerCase().includes(search.toLowerCase()) || m.field.toLowerCase().includes(search.toLowerCase()) || m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchField = selectedField === "Tất cả" || m.field === selectedField;
      const matchExp =
        selectedExp === "Tất cả" ||
        (selectedExp === "1-3 năm" && m.experience <= 3) ||
        (selectedExp === "4-6 năm" && m.experience >= 4 && m.experience <= 6) ||
        (selectedExp === "7+ năm" && m.experience >= 7);
      const priceRange = PRICE_OPTIONS[selectedPrice];
      const matchPrice = m.price >= priceRange.min && m.price <= priceRange.max;
      const matchRating =
        selectedRating === "Tất cả" ||
        (selectedRating === "4.5+" && m.rating >= 4.5) ||
        (selectedRating === "4.0+" && m.rating >= 4.0) ||
        (selectedRating === "3.5+" && m.rating >= 3.5);
      const matchAvail = !availableOnly || m.available;
      return matchSearch && matchField && matchExp && matchPrice && matchRating && matchAvail;
    });
    console.log("Filtered mentors count:", filtered.length);
    return filtered;
  }, [search, selectedField, selectedExp, selectedPrice, selectedRating, availableOnly, mentors]);

  // Dropdown Component
  const Dropdown = ({ 
    id, 
    label, 
    value, 
    icon 
  }) => {
    const isOpen = openDropdown === id;
    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : id)}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all"
          style={{
            background: value !== "Tất cả" ? "rgba(110,53,232,0.12)" : "rgba(255,255,255,0.92)",
            borderColor: value !== "Tất cả" ? "rgba(110,53,232,0.45)" : "rgba(148,71,255,0.22)",
            color: value !== "Tất cả" ? "#6E35E8" : "#334155",
          }}
        >
          {icon}
          <span className="max-w-[150px] truncate text-slate-700">
            {label}:{" "}
            <strong className={value !== "Tất cả" ? "text-violet-700" : "text-slate-900"}>
              {value}
            </strong>
          </span>
          <CaretDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 top-full z-50 mt-2 max-h-[300px] min-w-[200px] overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
            style={{ boxShadow: "0 16px 40px rgba(15,23,42,0.14)" }}
          >
            {id === "field" && (
              <>
                {["Tất cả", ...FIELDS].map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setSelectedField(f);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                      selectedField === f
                        ? "bg-violet-100 font-semibold text-violet-700"
                        : "text-slate-700 hover:bg-violet-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </>
            )}

            {id === "exp" && (
              <>
                {EXPERIENCE_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      setSelectedExp(e);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                      selectedExp === e
                        ? "bg-violet-100 font-semibold text-violet-700"
                        : "text-slate-700 hover:bg-violet-50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </>
            )}

            {id === "price" && (
              <>
                {PRICE_OPTIONS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setSelectedPrice(i);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                      selectedPrice === i
                        ? "bg-violet-100 font-semibold text-violet-700"
                        : "text-slate-700 hover:bg-violet-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </>
            )}

            {id === "rating" && (
              <>
                {RATING_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRating(r);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                      selectedRating === r
                        ? "bg-violet-100 font-semibold text-violet-700"
                        : "text-slate-700 hover:bg-violet-50"
                    }`}
                  >
                    {r === "Tất cả" ? r : (
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {r}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mentors-light pi-page-dashboard-bg relative min-h-full w-full overflow-hidden font-sans text-slate-900 antialiased selection:bg-[rgba(196,255,71,0.28)] selection:text-slate-900">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="fixed top-[-22%] left-[-12%] h-[760px] w-[760px] rounded-full bg-[#d4ff00]/48 blur-[135px]" />
        <div className="fixed bottom-[-22%] right-[-10%] h-[820px] w-[820px] rounded-full bg-[#9447ff]/34 blur-[150px]" />
      </div>
      <style>{`
        .mentors-light.pi-page-dashboard-bg {
          background: linear-gradient(165deg, #f8f4ff 0%, #f5f8ff 45%, #f7f4ff 100%);
        }
        .mentors-light .card-premium {
          background: linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(246,248,255,0.95) 100%) !important;
          border-color: rgba(148,71,255,0.16) !important;
          box-shadow: 0 14px 30px rgba(15,23,42,0.1) !important;
        }
        .mentors-light .text-white { color: #0f172a !important; }
        .mentors-light .text-zinc-300,
        .mentors-light .text-zinc-200 { color: #334155 !important; }
        .mentors-light .text-white\\/65,
        .mentors-light .text-white\\/60,
        .mentors-light .text-white\\/55,
        .mentors-light .text-white\\/50,
        .mentors-light .text-white\\/45,
        .mentors-light .text-white\\/40 { color: #64748b !important; }
        .mentors-light .text-zinc-500,
        .mentors-light .text-zinc-400 { color: #475569 !important; }
        .mentors-light .text-violet-200,
        .mentors-light .text-violet-100,
        .mentors-light .text-\\[\\#c4b5fd\\] { color: #6E35E8 !important; }
        .mentors-light .border-white\\/12,
        .mentors-light .border-white\\/10,
        .mentors-light .border-white\\/8 { border-color: rgba(148,71,255,0.14) !important; }
        .mentors-light .bg-white\\/\\[0\\.06\\],
        .mentors-light .bg-white\\/\\[0\\.05\\] { background-color: rgba(255,255,255,0.86) !important; }
        .mentors-light header { border-bottom-color: rgba(148,71,255,0.16) !important; }
        .mentors-light header .absolute.inset-0 {
          opacity: .05 !important;
          background-image: linear-gradient(rgba(148,71,255,0.16) 1px,transparent 1px),linear-gradient(90deg,rgba(148,71,255,0.16) 1px,transparent 1px) !important;
        }
      `}</style>
      <header className="relative z-10 pb-2 pt-8 sm:pb-4 sm:pt-10">
        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Users
              className="size-6 shrink-0 text-lime-900"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 sm:text-[11px]">
              Mentor 1:1
            </span>
          </div>
          <h1 className="mb-4 max-w-4xl text-3xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Tìm Mentor{" "}
            <span className="text-[#6E35E8]">
              phù hợp.
            </span>
          </h1>
          <p className="mb-8 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 sm:text-lg">
            Đặt lịch phỏng vấn 1-1 với các HR/Manager từ Shopee, Grab, VNG và 200+ công ty hàng đầu
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { icon: Users, value: "500+", label: "Mentor chuyên nghiệp" },
              { icon: Lightning, value: "24/7", label: "Đặt lịch bất kỳ lúc nào" },
              { icon: SealCheck, value: "4.8★", label: "Điểm hài lòng trung bình" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                  <s.icon className="h-4 w-4 text-violet-700" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-7xl px-6 pb-12 pt-3">

      {/* Search + Filters in one block */}
      <div ref={dropdownRef} className="mb-6">
        <div className="rounded-2xl border border-violet-200/55 bg-white/95 p-4 shadow-[0_12px_34px_rgba(76,29,149,0.08)]">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#6E35E8]/50 focus:shadow-md focus:outline-none"
                placeholder="Tìm theo tên, ngành, kỹ năng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className={`flex w-[170px] items-center justify-center gap-3 rounded-2xl border px-5 py-3 text-sm font-bold transition-all ${
                showFilters
                  ? "border-[#b6e93f] bg-[#d4ff6a]/75 text-[#1f2d00]"
                  : "border-slate-300 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/40"
              }`}
            >
              <Funnel className="h-4 w-4" />
              {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 rounded-2xl border border-violet-200/45 bg-white/82 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Funnel className="w-4 h-4 text-[#6E35E8]" />
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-900">Bộ lọc</h2>
                {(selectedField !== "Tất cả" || selectedExp !== "Tất cả" || selectedPrice !== 0 || selectedRating !== "Tất cả" || availableOnly) && (
                  <button
                    onClick={() => {
                      setSelectedField("Tất cả");
                      setSelectedExp("Tất cả");
                      setSelectedPrice(0);
                      setSelectedRating("Tất cả");
                      setAvailableOnly(false);
                    }}
                    className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-violet-100 hover:text-violet-700"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    availableOnly
                      ? "border-emerald-400/45 bg-emerald-100 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400/35"
                  }`}
                >
                  <CheckCircle
                    className={`h-4 w-4 ${availableOnly ? "fill-emerald-500 text-emerald-500" : "text-slate-400"}`}
                  />
                  Có lịch trống
                </button>

                <Dropdown id="field" label="Lĩnh vực" value={selectedField} />
                <Dropdown id="exp" label="Kinh nghiệm" value={selectedExp} />
                <Dropdown id="price" label="Giá" value={PRICE_OPTIONS[selectedPrice].label} />
                <Dropdown
                  id="rating"
                  label="Đánh giá"
                  value={selectedRating}
                  icon={selectedRating !== "Tất cả" ? <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> : null}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-5">
        <p className="rounded-2xl border border-violet-200/55 bg-white/88 px-4 py-3 text-sm text-slate-600 shadow-[0_8px_24px_rgba(76,29,149,0.07)]">
          {loading ? (
            "Đang tải..."
          ) : (
            <>
              Tìm thấy <span className="font-semibold text-slate-900">{filteredMentors.length}</span> mentor phù hợp
            </>
          )}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card-premium overflow-hidden animate-pulse">
              <div className="p-5 pb-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-3/4 rounded-full bg-white/10" />
                    <div className="h-3 w-1/2 rounded-full bg-white/8" />
                    <div className="h-3 w-2/5 rounded-full bg-white/8" />
                  </div>
                </div>
                <div className="mb-3 flex gap-1.5">
                  <div className="h-5 w-16 rounded-full bg-white/10" />
                  <div className="h-5 w-20 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
                <div className="h-4 w-20 rounded-full bg-white/10" />
                <div className="h-8 w-16 rounded-xl bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-orange-300/90" />
          <p className="font-medium text-white/55">Không thể tải danh sách mentor</p>
          <button
            onClick={() => { setLoading(true); fetchMentors().then((d) => { setMentors(d); setLoading(false); setError(null); }); }}
            className="mt-3 text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "#6E35E8" }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Mentor Grid */}
      {!loading && !error && (filteredMentors.length === 0 ? (
        <div className="text-center py-20">
          <MagnifyingGlass className="mx-auto mb-4 h-12 w-12 text-white/25" />
          <p className="font-medium text-white/55">Không tìm thấy mentor phù hợp</p>
          <p className="mt-1 text-sm text-white/40">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor.id}
              className="card-premium group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1"
              onClick={() => navigate(`/mentors/${mentor.id}`)}
            >
              <div className="h-1 w-full bg-gradient-to-r from-[#6E35E8] to-[#9B6DFF]" />

              <div className="p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={mentor.avatar}
                      alt={mentor.name}
                      className="h-14 w-14 rounded-2xl border-2 border-violet-500/25 object-cover"
                    />
                    {mentor.available && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#0c0818]"
                        style={{ background: "#22c55e" }}
                        title="Có lịch trống"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-black tracking-tight text-slate-900">
                      {mentor.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-white/60">{mentor.title}</p>
                    <p className="mt-0.5 text-xs font-semibold text-violet-200">{mentor.company}</p>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" style={{ color: "#FFD600", fill: "#FFD600" }} />
                    <span className="text-sm font-black text-slate-900">{mentor.rating}</span>
                    <span className="text-xs text-white/50">({mentor.reviews} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <Clock className="h-3 w-3" />
                    {mentor.responseTime}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {mentor.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    <span className="text-sm font-black text-slate-900">
                      {mentor.price.toLocaleString("vi")}đ
                    </span>
                    <span className="text-xs text-white/50"> / giờ</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/booking/${mentor.id}`); }}
                    className="rounded-xl bg-gradient-to-br from-[#6E35E8] to-[#8B4DFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-900/40 transition-opacity hover:opacity-90"
                  >
                    Đặt lịch
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      </div>
    </div>
  );
}