import { useState } from 'react';

const STORAGE_KEY = 'moyu_hub_onboard_v1';

const STEPS = [
  '主线路程点「进入」打第一战，留意战前提示与本场词缀。',
  '历练 → 猎装试炼刷装；缺对症 T3 时第二章后开镜渊。',
  '伙伴 → 布阵：前排满 3 格可触发铁壁共鸣，进战可见加成。',
] as const;

export function HubOnboarding() {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'done';
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'done');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const isLast = step >= STEPS.length - 1;

  return (
    <div className="rounded-xl border border-teal-500/35 bg-teal-950/40 px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.14em] text-teal-300/90">
          新手上路 {step + 1}/{STEPS.length}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          跳过
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{STEPS[step]}</p>
      <div className="mt-3 flex gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-lg border border-border/70 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            上一步
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
          className="rounded-lg bg-teal-600/90 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
        >
          {isLast ? '知道了' : '下一步'}
        </button>
      </div>
    </div>
  );
}
