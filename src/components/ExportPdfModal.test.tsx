import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportPdfModal } from './ExportPdfModal';
import { Page } from '@/store/scenarioStore';

describe('ExportPdfModal', () => {
  const mockPages: Page[] = [
    {
      id: 'page-1',
      scenarioId: 'scen-1',
      pageNumber: 1,
      title: 'The Whispering Woods',
      pageSize: 'A4',
      columnCount: 2,
      themeSkin: 'parchment',
    },
    {
      id: 'page-2',
      scenarioId: 'scen-1',
      pageNumber: 2,
      title: 'Sunken Crypts',
      pageSize: 'A4',
      columnCount: 1,
      themeSkin: 'gothic',
    },
    {
      id: 'page-3',
      scenarioId: 'scen-1',
      pageNumber: 3,
      title: 'Boss Chamber',
      pageSize: 'A4',
      columnCount: 2,
      themeSkin: 'parchment',
    },
  ];

  it('renders with "All Pages" selected by default and prints all pages', () => {
    const onConfirmPrint = vi.fn();
    const onClose = vi.fn();

    render(
      <ExportPdfModal
        isOpen={true}
        onClose={onClose}
        pages={mockPages}
        activePageId="page-2"
        scenarioTitle="The Sunken Citadel"
        onConfirmPrint={onConfirmPrint}
      />
    );

    // Modal title & subtitle
    expect(screen.getByText('Export to PDF / Print')).toBeInTheDocument();
    expect(screen.getByText(/The Sunken Citadel • 3 pages total/i)).toBeInTheDocument();

    // Default option is All Pages (3 pages)
    const allRadio = screen.getByRole('radio', { name: /all pages/i });
    expect(allRadio).toBeChecked();

    // Confirm button shows 3 pages
    const printButton = screen.getByRole('button', { name: /print to pdf \(3\)/i });
    expect(printButton).toBeInTheDocument();

    // Click print
    fireEvent.click(printButton);

    expect(onConfirmPrint).toHaveBeenCalledWith(['page-1', 'page-2', 'page-3']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows switching to "Current Page Only" and exports only active page', () => {
    const onConfirmPrint = vi.fn();
    const onClose = vi.fn();

    render(
      <ExportPdfModal
        isOpen={true}
        onClose={onClose}
        pages={mockPages}
        activePageId="page-2"
        scenarioTitle="The Sunken Citadel"
        onConfirmPrint={onConfirmPrint}
      />
    );

    // Switch to Current Page
    const currentRadio = screen.getByRole('radio', { name: /current page only/i });
    fireEvent.click(currentRadio);
    expect(currentRadio).toBeChecked();

    // Confirm button now says 1 page
    const printButton = screen.getByRole('button', { name: /print to pdf \(1\)/i });
    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);

    expect(onConfirmPrint).toHaveBeenCalledWith(['page-2']);
  });

  it('allows custom selection of pages', () => {
    const onConfirmPrint = vi.fn();
    const onClose = vi.fn();

    render(
      <ExportPdfModal
        isOpen={true}
        onClose={onClose}
        pages={mockPages}
        activePageId="page-1"
        scenarioTitle="The Sunken Citadel"
        onConfirmPrint={onConfirmPrint}
      />
    );

    // Select custom mode
    const customRadio = screen.getByRole('radio', { name: /custom page selection/i });
    fireEvent.click(customRadio);

    // Clear all
    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    // Toggle Page 1 and Page 3
    fireEvent.click(screen.getByText('Page 1: The Whispering Woods'));
    fireEvent.click(screen.getByText('Page 3: Boss Chamber'));

    // Print button should show 2 pages
    const printButton = screen.getByRole('button', { name: /print to pdf \(2\)/i });
    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);

    expect(onConfirmPrint).toHaveBeenCalledWith(['page-1', 'page-3']);
  });
});
