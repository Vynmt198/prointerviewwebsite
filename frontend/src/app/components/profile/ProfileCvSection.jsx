import { ChevronDown } from "lucide-react";

/** Tiêu đề mục — gạch chân ngắn dưới chữ (scoped `.profile-page`). */
export function ProfileSectionHeading({ children }) {
  return <span className="profile-cv-section-heading">{children}</span>;
}

/** Mục luôn mở — không có mũi tên (vd. Liên hệ tài khoản). */
export function ProfileCvStaticSection({ title, showDividerBelow = false, children }) {
  return (
    <section
      className={`profile-cv-static-section${showDividerBelow ? " profile-cv-accordion-item--split" : ""}`}
    >
      <ProfileSectionHeading>{title}</ProfileSectionHeading>
      <div className="profile-cv-static-body">{children}</div>
    </section>
  );
}

/** Hàng mục CV: tiêu đề + mũi tên; bấm để mở/đóng ô nhập. */
export function ProfileCvAccordionSection({
  title,
  isOpen,
  onToggle,
  showDividerBelow = false,
  children,
}) {
  return (
    <div
      className={`profile-cv-accordion-item${showDividerBelow ? " profile-cv-accordion-item--split" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="profile-cv-accordion-trigger"
      >
        <ProfileSectionHeading>{title}</ProfileSectionHeading>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`profile-cv-accordion-chevron shrink-0${isOpen ? " is-open" : ""}`}
          aria-hidden
        />
      </button>
      {isOpen ? <div className="profile-cv-accordion-panel">{children}</div> : null}
    </div>
  );
}

export function ProfileCvTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}) {
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      className="input-glass w-full resize-y min-h-[88px] disabled:cursor-not-allowed disabled:opacity-70"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}
