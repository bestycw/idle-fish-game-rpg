type TownServiceShellProps = {
  title: string;
  subtitle: string;
  body: string;
  onClose: () => void;
};

/** 悬赏榜 / 驿舍等通用壳 */
export function TownServiceShell({ title, subtitle, body, onClose }: TownServiceShellProps) {
  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-black/55 p-3 sm:items-center"
      role="dialog"
      aria-modal
    >
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-[#0c1016] p-4 shadow-2xl">
        <p className="font-mono text-[10px] text-muted-foreground">{subtitle}</p>
        <h2 className="font-display text-lg tracking-wide">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/85">{body}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
