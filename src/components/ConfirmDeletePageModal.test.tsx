import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeletePageModal } from './ConfirmDeletePageModal';

describe('ConfirmDeletePageModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ConfirmDeletePageModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        pageNumber={2}
        pageTitle="The Dark Crypt"
        elementCount={3}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders page details and warns about placed elements', () => {
    render(
      <ConfirmDeletePageModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        pageNumber={3}
        pageTitle="The Lower Tombs"
        elementCount={4}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Page 3?')).toBeInTheDocument();
    expect(screen.getByText('The Lower Tombs')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText(/canonical entities/i)).toBeInTheDocument();
  });

  it('triggers onConfirm and onClose when confirmed', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDeletePageModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        pageNumber={1}
        pageTitle="Entry"
        elementCount={0}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete page/i });
    fireEvent.click(deleteBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when cancelled', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDeletePageModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        pageNumber={1}
        elementCount={0}
      />
    );

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
