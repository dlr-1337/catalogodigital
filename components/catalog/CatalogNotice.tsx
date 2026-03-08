type CatalogNoticeProps = {
  title: string;
  description: string;
  tone?: "neutral" | "warning" | "error";
};

const toneClasses = {
  neutral: "border-line bg-panel text-ink",
  warning: "border-accent bg-panel text-ink",
  error: "border-accent-strong bg-panel text-ink",
};

export function CatalogNotice({
  title,
  description,
  tone = "neutral",
}: CatalogNoticeProps) {
  return (
    <section
      className={`rounded-[2rem] border px-6 py-10 shadow-[var(--shadow)] ${toneClasses[tone]}`}
    >
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="font-display text-3xl text-ink">{title}</p>
        <p className="text-sm leading-7 text-muted sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
