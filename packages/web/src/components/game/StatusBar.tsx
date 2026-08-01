import { getStaminaView, type PlayerState } from '@moyu/game-core';
import { cn } from '@/lib/utils';

type StatusBarProps = {
  player: PlayerState;
  chapterLabel?: string;
  className?: string;
  /** 顶栏系统入口（邮件 / 设置） */
  onMail?: () => void;
  onSettings?: () => void;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums text-foreground/95">{value}</span>
    </span>
  );
}

export function StatusBar({
  player,
  chapterLabel,
  className,
  onMail,
  onSettings,
}: StatusBarProps) {
  const stamina = getStaminaView(player);
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/70 pb-3 font-mono text-[11px] tracking-wide text-muted-foreground',
        className,
      )}
    >
      <Stat label="体力" value={`${stamina.current}/${stamina.max}`} />
      <span className="text-border">·</span>
      <Stat label="券" value={player.currencies?.ticket ?? 0} />
      <span className="text-border">·</span>
      <Stat label="石" value={player.gold} />
      <span className="text-border">·</span>
      <Stat label="修为" value={player.currencies?.xiuwei ?? 0} />
      <span className="text-border">·</span>
      <Stat label="胜" value={player.wins} />
      {chapterLabel ? (
        <>
          <span className="text-border">·</span>
          <span className="max-w-[14rem] truncate text-primary/85">{chapterLabel}</span>
        </>
      ) : null}
      {(onMail || onSettings) && (
        <span className="ml-auto flex items-center gap-2">
          {onMail ? (
            <button
              type="button"
              onClick={onMail}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              邮件
            </button>
          ) : null}
          {onSettings ? (
            <button
              type="button"
              onClick={onSettings}
              className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              设置
            </button>
          ) : null}
        </span>
      )}
    </div>
  );
}
