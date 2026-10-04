import { DEFAULT_HERO_NAME } from '@moyu/game-core';
import { useState } from 'react';

export function PrologueHeroNameStep({
  onContinue,
}: {
  onContinue: (name: string) => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="font-mono text-[10px] tracking-[0.14em] text-cyan-300/85">序章终幕 · 你是谁</p>
      <h2 className="font-display mt-1 text-xl tracking-wide sm:text-2xl">裂隙里，名字是锚点</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        输入你在本位面的称呼。原世界工位档案仍用真名，这里可以用外号或化名。
      </p>
      <label className="mt-4 block">
        <span className="font-mono text-[10px] text-muted-foreground">主角称呼 · 最多 12 字</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={DEFAULT_HERO_NAME}
          maxLength={12}
          className="mt-1.5 w-full rounded-xl border border-border/80 bg-background/60 px-3 py-3 font-display text-lg text-foreground outline-none ring-primary/40 focus:ring-2"
          autoComplete="nickname"
        />
      </label>
      <button
        type="button"
        onClick={() => onContinue(name.trim() || DEFAULT_HERO_NAME)}
        className="prologue-continue-in mt-auto w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110"
      >
        继续 · 个人偏好
      </button>
    </div>
  );
}
