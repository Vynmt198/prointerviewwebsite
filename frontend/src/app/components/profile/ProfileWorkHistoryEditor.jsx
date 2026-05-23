import { Plus, Trash2 } from "lucide-react";
import { emptyWorkEntry, formatWorkEntryPeriod } from "../../utils/profileWorkHistory";

export function ProfileWorkHistoryEditor({ entries, onChange, disabled = false }) {
  const list = Array.isArray(entries) && entries.length ? entries : [emptyWorkEntry()];

  const updateEntry = (index, patch) => {
    const next = list.map((e, i) => (i === index ? { ...e, ...patch } : e));
    onChange(next);
  };

  const addEntry = () => {
    onChange([...list, emptyWorkEntry()]);
  };

  const removeEntry = (index) => {
    if (list.length <= 1) {
      onChange([emptyWorkEntry()]);
      return;
    }
    onChange(list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-[#2D1B69]/55">
        Thêm từng mốc việc làm (quá khứ hoặc hiện tại). Chọn tháng bắt đầu / kết thúc; tick{" "}
        <strong className="text-[#2D1B69]/75">Đang làm việc</strong> nếu vẫn làm ở đó.
      </p>

      {list.map((entry, index) => (
        <div
          key={index}
          className="rounded-xl border border-[#6E35E8]/15 bg-[#f8f5ff]/60 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7a23e5]">
              {entry.isCurrent ? "Công việc hiện tại" : `Kinh nghiệm #${index + 1}`}
            </span>
            {!disabled && list.length > 1 ? (
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-[#7a23e5] hover:bg-[#6E35E8]/10"
              >
                <Trash2 size={12} /> Xóa
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              disabled={disabled}
              className="input-glass w-full disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Chức danh (VD: HR)"
              value={entry.role}
              onChange={(e) => updateEntry(index, { role: e.target.value })}
            />
            <input
              disabled={disabled}
              className="input-glass w-full disabled:cursor-not-allowed disabled:opacity-70"
              placeholder="Công ty (VD: FPT Software)"
              value={entry.company}
              onChange={(e) => updateEntry(index, { company: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#2D1B69]/45">
                Từ (tháng/năm)
              </span>
              <input
                type="month"
                disabled={disabled}
                className="input-glass w-full [color-scheme:light] disabled:cursor-not-allowed disabled:opacity-70"
                value={entry.startMonth}
                onChange={(e) => updateEntry(index, { startMonth: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#2D1B69]/45">
                Đến (tháng/năm)
              </span>
              <input
                type="month"
                disabled={disabled || entry.isCurrent}
                className="input-glass w-full [color-scheme:light] disabled:cursor-not-allowed disabled:opacity-70"
                value={entry.isCurrent ? "" : entry.endMonth}
                onChange={(e) => updateEntry(index, { endMonth: e.target.value })}
              />
            </label>
          </div>
          {formatWorkEntryPeriod(entry) ? (
            <p className="text-xs font-semibold text-[#7a23e5]">
              Thời gian: {formatWorkEntryPeriod(entry)}
            </p>
          ) : (
            <p className="text-xs text-[#2D1B69]/50">
              Chưa có thời gian — chọn tháng bắt đầu (và kết thúc nếu không còn làm).
            </p>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#2D1B69]/80">
            <input
              type="checkbox"
              disabled={disabled}
              checked={entry.isCurrent}
              className="size-4 rounded border-[#6E35E8]/30 text-[#6E35E8]"
              onChange={(e) => {
                const isCurrent = e.target.checked;
                updateEntry(index, {
                  isCurrent,
                  endMonth: isCurrent ? "" : entry.endMonth,
                });
                if (isCurrent) {
                  onChange(
                    list.map((item, i) => ({
                      ...item,
                      isCurrent: i === index,
                      endMonth: i === index ? "" : item.endMonth,
                    })),
                  );
                }
              }}
            />
            Đang làm việc tại đây
          </label>

          <textarea
            disabled={disabled}
            rows={2}
            className="input-glass w-full resize-y min-h-[56px] disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="Mô tả ngắn (tùy chọn)..."
            value={entry.note}
            onChange={(e) => updateEntry(index, { note: e.target.value })}
          />
        </div>
      ))}

      {!disabled ? (
        <button
          type="button"
          onClick={addEntry}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#6E35E8]/35 px-4 py-2.5 text-xs font-bold text-[#7a23e5] hover:bg-[#f8f5ff]"
        >
          <Plus size={14} /> Thêm kinh nghiệm
        </button>
      ) : null}
    </div>
  );
}
