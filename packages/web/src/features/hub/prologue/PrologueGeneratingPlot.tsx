export function PrologueGeneratingPlot({ heroName }: { heroName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
      <div className="h-10 w-10 animate-pulse rounded-full border-2 border-cyan-400/50 border-t-cyan-200" />
      <p className="font-display text-base text-primary">正在编织卷一主线…</p>
      <p className="max-w-xs text-center font-mono text-[10px] leading-relaxed text-muted-foreground">
        {heroName} 的定参已写入 · 卷一节点文案一次性装入存档 · 马上进入冒险
      </p>
    </div>
  );
}
