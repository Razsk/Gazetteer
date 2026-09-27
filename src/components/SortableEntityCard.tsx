'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Placement } from '@/store/scenarioStore';
import { Entity } from '@/domain/entities';
import { ThemeSkin } from './themeSkin';
import { EntityCard } from './EntityCard';

interface SortableEntityCardProps {
  placement: Placement;
  entity: Entity;
  pageSkin: ThemeSkin;
  isOverflowing?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  currentColumn?: 0 | 1;
  onToggleColumn?: () => void;
  onHeightChange?: (height: number) => void;
  isActive?: boolean;
  onActivate?: () => void;
}

export const SortableEntityCard: React.FC<SortableEntityCardProps> = ({
  placement,
  entity,
  pageSkin,
  isOverflowing,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  currentColumn,
  onToggleColumn,
  onHeightChange,
  isActive,
  onActivate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: placement.id });

  const nodeRef = useRef<HTMLDivElement | null>(null);

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      nodeRef.current = node;
    },
    [setNodeRef]
  );

  useEffect(() => {
    const el = nodeRef.current;
    if (!el || !onHeightChange) return;

    // Report initial height
    const h = el.getBoundingClientRect().height;
    if (h > 0) {
      onHeightChange(h);
    }

    const observer = new ResizeObserver((entries) => {
      if (isDragging) return;
      for (const entry of entries) {
        if (entry.target === el) {
          const height = entry.contentRect.height;
          if (height > 0) {
            onHeightChange(height);
          }
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeightChange, isDragging]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className="w-full"
    >
      <EntityCard
        placement={placement}
        entity={entity}
        pageSkin={pageSkin}
        isOverflowing={isOverflowing}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        isFirst={isFirst}
        isLast={isLast}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        currentColumn={currentColumn}
        onToggleColumn={onToggleColumn}
        isActive={isActive}
        onActivate={onActivate}
      />
    </div>
  );
};
