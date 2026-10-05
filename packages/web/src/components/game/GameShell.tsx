import { cn } from '@/lib/utils';

type GameShellProps = {
  brand?: string;
  subtitle?: string;
  status?: React.ReactNode;
  notice?: string | null;
  /** 关闭居中提示（遮罩/卡片点击） */
  onDismissNotice?: () => void;
  /** 底栏导航等；战斗页可隐藏 */
  dock?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** 战斗等需要更宽主舞台 */
  layout?: 'home' | 'focus';
  /** 角色详情等：隐藏大标题，省出一屏高度 */
  hideBrand?: boolean;
  /** 主内容区整页滚动（Hub/召唤等）；战斗/战前由页内分区滚 */
  scrollMain?: boolean;
};

/**
 * 自适应壳：
 * - 窄屏：单列舞台 + 底栏（偏 A）
 * - 宽屏：加大内容区，由页面内部自行双栏（偏 C）
 * - focus：锁死视口高度，交由页内分区滚动
 */
export function GameShell({
  brand = '摸鱼修仙',
  subtitle,
  status,
  notice,
  onDismissNotice,
  dock,
  children,
  className,
  layout = 'home',
  hideBrand = false,
  scrollMain = false,
}: GameShellProps) {
  const showHeader = !hideBrand || Boolean(status);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'mx-auto flex w-full min-h-0 flex-1 flex-col px-3 sm:px-5',
          hideBrand ? 'pt-2 sm:pt-3' : 'pt-4 sm:pt-6',
          layout === 'home' ? 'max-w-6xl' : 'max-w-5xl',
          dock ? 'pb-0' : 'pb-6',
          className,
        )}
      >
        {showHeader ? (
          <header
            className={cn(
              'flex flex-wrap items-end justify-between gap-2',
              hideBrand ? 'mb-2 sm:mb-2.5' : 'mb-3 sm:mb-4 sm:gap-3',
            )}
          >
            {!hideBrand ? (
              <div className="min-w-0">
                <h1 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl lg:text-4xl">
                  {brand}
                </h1>
                {subtitle ? (
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
                ) : null}
              </div>
            ) : null}
            {status ? (
              <div className={cn('min-w-0', hideBrand ? 'w-full' : 'w-full lg:w-auto lg:max-w-[65%]')}>
                {status}
              </div>
            ) : null}
          </header>
        ) : null}

        <main
          className={cn(
            'min-h-0 flex-1',
            scrollMain
              ? 'app-main-scroll overflow-y-auto'
              : 'flex flex-col overflow-hidden',
          )}
        >
          {children}
        </main>
      </div>

      {notice ? (
        <button
          type="button"
          aria-live="polite"
          aria-label="关闭提示"
          onClick={() => onDismissNotice?.()}
          className="fixed inset-0 z-[55] flex cursor-default items-center justify-center bg-black/45 px-5 backdrop-blur-[2px] sm:px-8"
        >
          <div
            role="status"
            className="game-notice-pop max-w-[min(100%,22rem)] cursor-pointer rounded-xl border border-primary/55 bg-card/96 px-5 py-4 text-center shadow-[0_12px_48px_rgba(0,0,0,0.55)] sm:max-w-md sm:px-6 sm:py-4"
          >
            <p
              className={cn(
                'leading-snug',
                notice.length > 72
                  ? 'font-mono text-xs leading-relaxed text-foreground/95 sm:text-sm'
                  : 'font-display text-base tracking-wide text-primary sm:text-lg',
              )}
            >
              {notice}
            </p>
            <p className="mt-2.5 font-mono text-[10px] tracking-wide text-muted-foreground">
              点击关闭
            </p>
          </div>
        </button>
      ) : null}

      {dock ? (
        <div className="z-20 w-full shrink-0 border-border/60 bg-background/95 backdrop-blur-md">
          <div className={cn('mx-auto w-full', layout === 'home' ? 'max-w-6xl' : 'max-w-5xl')}>
            {dock}
          </div>
        </div>
      ) : null}
    </div>
  );
}
