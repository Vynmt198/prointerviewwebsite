import React, { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { FileText, Briefcase, Search as MagnifyingGlass, Eye, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeTextRenderer(matchedKws, missingKws, side) {
  return ({ str }) => {
    if (!str.trim()) return str;

    // CV panel: only green (matched keywords appear in CV text)
    // JD panel: green (matched) + red (missing — required by JD but not in CV)
    const targets =
      side === "jd"
        ? [
            ...matchedKws.map(k => ({ kw: k, type: "matched" })),
            ...missingKws.map(k => ({ kw: k, type: "missing" })),
          ]
        : matchedKws.map(k => ({ kw: k, type: "matched" }));

    if (targets.length === 0) return str;

    const sorted = [...targets].sort((a, b) => b.kw.length - a.kw.length);
    const pattern = new RegExp(
      `(${sorted.map(t => escapeRegex(t.kw)).join("|")})`,
      "gi"
    );

    return str.replace(pattern, match => {
      const lower = match.toLowerCase();
      const isMatched = matchedKws.some(k => k.toLowerCase() === lower);
      if (isMatched)
        return `<mark style="background:#bbf7d0;color:#14532d;border-radius:3px;padding:0 4px;font-weight:700;border:1px solid #22c55e">${match}</mark>`;
      return `<mark style="background:#fecaca;color:#7f1d1d;border-radius:3px;padding:0 4px;font-weight:700;border:1px solid #f87171">${match}</mark>`;
    });
  };
}

// ─── Keyword chips summary ────────────────────────────────────────────────────
const chipMatched = {
  background: "#dcfce7",
  color: "#14532d",
  border: "1px solid #22c55e",
};
const chipMissing = {
  background: "#ffedd5",
  color: "#9a3412",
  border: "1px solid #ea580c",
};

function KeywordChips({ matchedKws, missingKws, side }) {
  const showMissing = (side === "cv" || side === "jd") && missingKws.length > 0;
  if (matchedKws.length === 0 && !showMissing) return null;

  return (
    <div
      className="flex-shrink-0 border-t border-slate-200 bg-slate-100 px-3 py-2.5"
      style={{ maxHeight: 112, overflowY: "auto" }}
    >
      <div className="flex flex-wrap gap-1.5">
        {matchedKws.map(kw => (
          <span
            key={`m-${kw}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold leading-tight"
            style={chipMatched}
          >
            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-800" strokeWidth={2.5} aria-hidden />
            {kw}
          </span>
        ))}
        {showMissing &&
          missingKws.map(kw => (
            <span
              key={`x-${kw}`}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold leading-tight"
              style={chipMissing}
            >
              <XCircle className="h-3 w-3 shrink-0 text-orange-800" strokeWidth={2.5} aria-hidden />
              {kw}
            </span>
          ))}
      </div>
    </div>
  );
}

// ─── Single document panel ───────────────────────────────────────────────────
function DocPanel({ title, fileName, icon, accentColor, file, matchedKws, missingKws, side }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [width, setWidth] = useState(null);

  const containerRef = useCallback(node => {
    if (node) setWidth(node.getBoundingClientRect().width);
  }, []);

  const textRenderer = useCallback(
    makeTextRenderer(matchedKws, missingKws, side),
    [matchedKws, missingKws, side]
  );

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white"
      style={{ height: 660 }}
    >
      {/* Panel header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0"
        style={{ background: accentColor }}
      >
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold leading-tight">{title}</p>
          <p className="text-white/70 text-[0.67rem] truncate">{fileName}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {matchedKws.length > 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold shadow-sm" style={{ background: "#dcfce7", color: "#14532d", border: "1px solid #22c55e" }}>
              ✓ {matchedKws.length} khớp
            </span>
          )}
          {missingKws.length > 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold shadow-sm" style={{ background: "#ffedd5", color: "#9a3412", border: "1px solid #ea580c" }}>
              ✗ {missingKws.length} thiếu
            </span>
          )}
        </div>
      </div>

      {/* PDF with highlighted text layer */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-100" style={{ minHeight: 0 }}>
        {file && width ? (
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => { setNumPages(numPages); setPageNumber(1); }}
            loading={
              <div className="flex items-center justify-center h-full text-gray-400 text-sm py-20">
                Đang tải PDF…
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full text-red-400 text-sm py-20">
                Không thể đọc file PDF
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={width - 8}
              customTextRenderer={textRenderer}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm py-20">
            Chưa có file PDF
          </div>
        )}
      </div>

      {/* Page navigation */}
      {numPages && numPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-1.5 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 font-medium">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Keyword chips summary */}
      <KeywordChips matchedKws={matchedKws} missingKws={missingKws} side={side} />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CVDocumentPreview({
  cvFile, jdFile,
  cvFileName, jdFileName,
  matchedKws = [],
  missingKws = [],
}) {
  const [expanded, setExpanded] = useState(true);
  const total = matchedKws.length + missingKws.length;

  return (
    <div className="mb-6">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(110,53,232,0.1)" }}
          >
            <Eye className="w-4 h-4" style={{ color: "#6E35E8" }} />
          </div>
          <div className="text-left">
            <h3 className="text-gray-900 font-semibold" style={{ fontSize: "0.9rem" }}>
              So sánh CV & JD — Keyword Highlight
            </h3>
            <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
              <span className="text-green-600 font-medium">{matchedKws.length} khớp</span>
              {" · "}
              <span className="text-red-500 font-medium">{missingKws.length} thiếu trong CV</span>
              {" · "}
              {total} từ khóa JD
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ color: "#6E35E8", background: "rgba(110,53,232,0.07)" }}
        >
          <MagnifyingGlass className="w-3.5 h-3.5" />
          {expanded ? "Thu gọn" : "Xem chi tiết"}
        </div>
      </button>

      {/* Legend */}
      {expanded && (
        <div className="flex flex-wrap gap-3 mb-4 px-1">
          {[
            { bg: "#bbf7d0", border: "#22c55e", label: "Từ khóa khớp (có trong CV)" },
            { bg: "#fed7aa", border: "#ea580c", label: "Từ khóa JD chưa có trong CV" },
          ].map(({ bg, border, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${border}` }} />
              <span className="text-slate-700 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Side-by-side panels */}
      {expanded && (
        <div className="grid md:grid-cols-2 gap-4">
          <DocPanel
            title="CV của bạn"
            fileName={cvFileName || "cv.pdf"}
            icon={<FileText className="w-4 h-4 text-white" />}
            accentColor="linear-gradient(135deg, #4F46E5, #7C3AED)"
            file={cvFile}
            matchedKws={matchedKws}
            missingKws={missingKws}
            side="cv"
          />
          <DocPanel
            title="Job Description"
            fileName={jdFileName || "jd.pdf"}
            icon={<Briefcase className="w-4 h-4 text-white" />}
            accentColor="linear-gradient(135deg, #7C3AED, #9333ea)"
            file={jdFile}
            matchedKws={matchedKws}
            missingKws={missingKws}
            side="jd"
          />
        </div>
      )}
    </div>
  );
}
