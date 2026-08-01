import { cn } from '@/lib/utils';

export type NavTab = 'hub' | 'gacha' | 'characters' | 'bag';

type TabDef = {
  id: NavTab;
  label: string;
  /** 简笔图标路径（viewBox 0 0 24 24）；可多 path 组合成形 */
  paths: string[];
};

/**
 * 主流养成手游底栏语感：
 * 冒险 · 召唤 · 伙伴 · 背包
 * 四格平铺，不做中间凸起圆（易显得「图标出框」）
 */
const TABS: TabDef[] = [
  {
    id: 'hub',
    label: '冒险',
    paths: [
      'M4 20V8l8-5 8 5v12h-5v-6H9v6H4zm5-8h6v2H9v-2z',
    ],
  },
  {
    id: 'gacha',
    label: '召唤',
    paths: [
      'M10 5.5h6.5a1.5 1.5 0 0 1 1.5 1.5V17h-1.2V7.5a.8.8 0 0 0-.8-.8H10V5.5z',
      'M6.5 8h8.5A1.5 1.5 0 0 1 16.5 9.5v9A1.5 1.5 0 0 1 15 20H6.5A1.5 1.5 0 0 1 5 18.5v-9A1.5 1.5 0 0 1 6.5 8zm1.5 3v1.2h5.5V11H8zm0 2.8v1.2h5.5v-1.2H8z',
    ],
  },
  {
    id: 'characters',
    label: '伙伴',
    paths: [
      'M12 12a4 4 0 1 0-0.01-8A4 4 0 0 0 12 12zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14z',
    ],
  },
  {
    id: 'bag',
    label: '背包',
    paths: [
      'M8 7V6a4 4 0 0 1 8 0v1h3v13H5V7h3zm2 0h4V6a2 2 0 1 0-4 0v1z',
    ],
  },
];

type BottomNavProps = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  className?: string;
};

function TabIcon({ paths, className }: { paths: string[]; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn('size-[1.35rem]', className)}
      fill="currentColor"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function BottomNav({ active, onChange, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'relative grid grid-cols-4 border-t border-border/80 bg-[#10161f]/95 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md',
        'pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1',
        className,
      )}
      aria-label="主导航"
    >
      {TABS.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-1 pb-2 pt-2 transition',
              on ? 'text-primary' : 'text-muted-foreground hover:text-foreground/90',
            )}
          >
            <TabIcon
              paths={tab.paths}
              className={cn(on && 'drop-shadow-[0_0_6px_rgba(226,160,74,0.55)]')}
            />
            <span className="text-[11px] font-medium tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
