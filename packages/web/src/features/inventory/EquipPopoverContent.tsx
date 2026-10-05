import { Popover } from 'radix-ui';
import type { ReactNode } from 'react';
import { equipPopoverContentClass, equipPopoverScrollClass } from './equipPopoverStyles';

const VIEWPORT_PAD = 24;

type EquipPopoverContentProps = {
  rarity?: string;
  children: ReactNode;
  /** 格子在行囊里优先朝下，避免左右顶出屏 */
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  footer?: ReactNode;
  showArrow?: boolean;
  onContentMouseEnter?: () => void;
  onContentMouseLeave?: () => void;
};

export function EquipPopoverContent({
  rarity,
  children,
  side = 'bottom',
  align = 'center',
  footer,
  showArrow = false,
  onContentMouseEnter,
  onContentMouseLeave,
}: EquipPopoverContentProps) {
  return (
    <Popover.Portal>
      <Popover.Content
        side={side}
        align={align}
        sideOffset={10}
        collisionPadding={VIEWPORT_PAD}
        sticky="partial"
        avoidCollisions
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={onContentMouseEnter}
        onMouseLeave={onContentMouseLeave}
        className={equipPopoverContentClass(rarity)}
      >
        <div className={equipPopoverScrollClass}>{children}</div>
        {footer}
        {showArrow ? <Popover.Arrow className="fill-background" width={12} height={7} /> : null}
      </Popover.Content>
    </Popover.Portal>
  );
}

