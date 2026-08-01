import { useMemo } from 'react';
import type { BattleEvent, BattleState } from '@moyu/game-core';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { logTone } from '@/lib/tones';

export function eventTone(ev: BattleEvent): string {
  if (ev.code === 'crit') return 'log-crit';
  if (ev.code === 'status_apply') {
    const st = String(ev.payload.status ?? '');
    if (/眩晕|沉默|混乱|禁疗|流血|破甲|迟缓|沉眠|狂乱/.test(st)) return 'log-special';
    return 'log-status';
  }
  if (ev.code === 'status_remove' || ev.code === 'status_block') return 'log-special';
  if (ev.code === 'follow_up') return 'log-special';
  if (ev.code === 'resist') return 'log-resist';
  if (ev.code === 'heal') return 'log-heal';
  if (ev.code === 'shield_gain') return 'log-shield';
  if (ev.code === 'block' || ev.code === 'dodge') return 'log-mitigation';
  if (ev.code === 'unit_down') return 'log-down';
  return '';
}

export function formatEventLine(ev: BattleEvent): string {
  const p = ev.payload;
  switch (ev.code) {
    case 'turn_start':
      return `${p.actor} 行动开始，能量 +${p.qiGain}（${p.qi}/${p.maxQi}）。`;
    case 'action':
      return `${p.actor} 使用${p.action}。`;
    case 'hit':
      return `${p.actor}→${p.target}，伤害 ${p.amount}${p.knockdown ? '，击倒' : ''}。`;
    case 'crit':
      return `${p.actor}→${p.target}【暴击】，伤害 ${p.amount}${p.knockdown ? '，击倒' : ''}。`;
    case 'heal':
      return `${p.actor} 为 ${p.target} 回复 ${p.amount} 点生命。`;
    case 'shield_gain':
      return `${p.actor} 获得 ${p.amount} 点护盾。`;
    case 'resist':
      return `${p.target} 抵抗了 ${p.status}。`;
    case 'status_apply':
      return `${p.target} 获得 ${p.status}（${p.duration} 动）。`;
    case 'status_block':
      return `${p.target} ${p.reason ?? '免疫'}，未能挂上 ${p.status}。`;
    case 'status_remove':
      return `${p.target} 的 ${p.status} 被${p.reason ?? '移除'}。`;
    case 'follow_up':
      return `${p.actor} 连击→${p.target}，伤害 ${p.amount}。`;
    case 'block':
      return `${p.target} 格挡，伤害降至 ${p.amount}。`;
    case 'dodge':
      return `${p.target} 闪避。`;
    case 'unit_down':
      return `${p.target} 倒下。`;
    case 'qi_gain':
      return `${p.actor} 能量 +${p.qiGain}（${p.qi}/${p.maxQi}）。`;
    case 'battle_end':
      return p.result === 'won' ? '战斗胜利。' : '队伍溃败。';
    default:
      return '';
  }
}

export function BattleLog({ battle, tall }: { battle: BattleState; tall?: boolean }) {
  const lines = useMemo(() => {
    if (battle.events.length > 0) {
      return [...battle.events]
        .reverse()
        .map((ev) => {
          const text = formatEventLine(ev);
          if (!text) return null;
          return { key: `${ev.turn}-${ev.code}-${text}`, text, tone: eventTone(ev) };
        })
        .filter(Boolean) as { key: string; text: string; tone: string }[];
    }
    return [...battle.log].reverse().map((line, i) => ({
      key: `${line}-${i}`,
      text: line,
      tone: /【暴击】|暴击/.test(line)
        ? 'log-crit'
        : /获得|沉默|眩晕|混乱|禁疗|流血|破甲|迟缓/.test(line)
          ? 'log-special'
          : '',
    }));
  }, [battle.events, battle.log]);

  return (
    <ScrollArea
      className={cn(
        'rounded-md border border-border/80 bg-card/50 font-mono',
        tall ? 'h-[min(48vh,380px)]' : 'h-[min(36vh,280px)]',
      )}
    >
      <div className="space-y-1 p-3 text-[13px] leading-relaxed">
        {lines.map((line, idx) => (
          <p
            key={line.key}
            style={{ animationDelay: `${Math.min(idx, 8) * 20}ms` }}
            className={cn('log-line-enter', logTone(line.tone))}
          >
            <span className="mr-1.5 text-muted-foreground/50">›</span>
            {/【暴击】/.test(line.text) ? (
              <>
                {line.text.split('【暴击】')[0]}
                <span className="font-semibold text-primary">【暴击】</span>
                {line.text.split('【暴击】')[1]}
              </>
            ) : (
              line.text
            )}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
