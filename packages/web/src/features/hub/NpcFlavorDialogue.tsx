import { PrologueDialogueBubble } from './prologue/PrologueDialogueBubble';

type NpcFlavorDialogueProps = {
  npcName: string;
  epithet: string | null;
  lines: string[];
  onClose: () => void;
};

/** 地图/场间 · 闲聊（不推进节点） */
export function NpcFlavorDialogue({
  npcName,
  epithet,
  lines,
  onClose,
}: NpcFlavorDialogueProps) {
  const title = epithet ? `${npcName} · ${epithet}` : npcName;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 sm:items-center"
      role="dialog"
      aria-modal
      aria-label={`与${npcName}对话`}
    >
      <div className="flex max-h-[min(70vh,24rem)] w-full max-w-md flex-col rounded-2xl border border-primary/30 bg-gradient-to-b from-[#121820] to-[#0a0e14] shadow-2xl">
        <header className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">场间闲聊</p>
            <h2 className="font-display text-lg tracking-wide">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border/60 px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-primary"
          >
            跳过
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
          {lines.map((text, i) => (
            <PrologueDialogueBubble key={i} speaker={npcName} text={text} />
          ))}
        </div>
        <footer className="border-t border-border/40 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
          >
            返回地图
          </button>
        </footer>
      </div>
    </div>
  );
}
