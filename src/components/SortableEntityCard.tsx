'use client';

import React from 'react';
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
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: placement.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={placement.columnSpan === 2 ? 'col-span-full' : 'col-span-1'}
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
      />
    </div>
  );
};
