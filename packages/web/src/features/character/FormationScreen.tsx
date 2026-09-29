import type { PlayerState } from '@moyu/game-core';
import { FormationEditor } from './FormationEditor';

type FormationScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onBack: () => void;
  onOpenCharacter: (templateId: string) => void;
  pushNotice: (msg: string) => void;
};

/** 布阵独立页：九宫 + 可选池（从伙伴 Tab 进入） */
export function FormationScreen({
  player,
  setPlayer,
  onBack,
  onOpenCharacter,
  pushNotice,
}: FormationScreenProps) {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden pb-2">
      <header className="flex shrink-0 items-start justify-between gap-2">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            ← 返回
          </button>
          <h2 className="font-display mt-1 text-2xl tracking-wide">布阵</h2>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-primary/40 bg-primary/15 px-3 py-1.5 text-sm text-primary"
        >
          完成
        </button>
      </header>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <FormationEditor
          player={player}
          setPlayer={setPlayer}
          pushNotice={pushNotice}
          onOpenCharacter={onOpenCharacter}
        />
      </div>
    </div>
  );
}
