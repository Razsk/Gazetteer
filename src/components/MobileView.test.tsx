import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PageCanvas } from './PageCanvas';
import Home from '@/app/page';
import { useScenarioStore } from '@/store/scenarioStore';
import { createDefaultEntity } from '@/domain/entities';

// Mock useIsMobile hook
vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}));

import { useIsMobile } from '@/hooks/useIsMobile';

describe('Mobile Friendly View & Responsive Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScenarioStore.getState().resetStore();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('renders all elements in a single column on mobile even when elements are double column or page is 2-col', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const store = useScenarioStore.getState();
    const scenario = store.currentScenario!;
    const page = store.pages[0];

    // Set page to 2 columns
    store.updatePage(page.id, { columnCount: 2 });

    // Create 3 entities: 1 full-width (colSpan: 2) and 2 single-width (colSpan: 1)
    const ent1 = createDefaultEntity(scenario.id, 'adventure_site', 'Dragon Peak');
    const ent2 = createDefaultEntity(scenario.id, 'npc', 'Old Hermit');
    const ent3 = createDefaultEntity(scenario.id, 'trap', 'Spike Pit');

    store.addEntity(ent1);
    store.addEntity(ent2);
    store.addEntity(ent3);

    store.addPlacement(page.id, ent1.id, 0, 2); // Double column
    store.addPlacement(page.id, ent2.id, 0, 1); // Single column left
    store.addPlacement(page.id, ent3.id, 1, 1); // Single column right

    const updatedPage = store.pages[0];
    const { container } = render(<PageCanvas page={updatedPage} />);

    // In mobile single column, no 2-column container (.flex-row) should be rendered
    // All cards should be rendered inside w-full containers in sequential order
    const cardWrappers = container.querySelectorAll('.print-page > div > div.w-full');
    expect(cardWrappers.length).toBe(3);

    // Verify entity names appear
    expect(screen.getByText('Dragon Peak')).toBeDefined();
    expect(screen.getByText('Old Hermit')).toBeDefined();
    expect(screen.getByText('Spike Pit')).toBeDefined();

    // Verify mobile column badge indicator
    expect(screen.getByText(/Mobile: 1 Col/)).toBeDefined();
  });

  it('allows sliding top menu in and out as needed', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<Home />);

    const topNavbar = screen.getByTestId('top-navbar');
    expect(topNavbar.className).toContain('translate-y-0');

    // Click hide top menu button
    const hideTopBtn = screen.getByTestId('hide-top-menu-btn');
    fireEvent.click(hideTopBtn);

    // Top navbar should slide out (-translate-y-full)
    expect(topNavbar.className).toContain('-translate-y-full');

    // Floating pill button should appear
    const showTopBtn = screen.getByTestId('show-top-menu-btn');
    expect(showTopBtn).toBeDefined();

    // Click floating pill to slide top navbar back in
    fireEvent.click(showTopBtn);
    expect(topNavbar.className).toContain('translate-y-0');
  });

  it('allows sliding bottom menu in and out as needed', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<Home />);

    const bottomNav = screen.getByTestId('mobile-bottom-nav');
    expect(bottomNav.className).toContain('translate-y-0');

    // Click hide bottom menu button
    const hideBottomBtn = screen.getByTestId('hide-bottom-menu-btn');
    fireEvent.click(hideBottomBtn);

    // Bottom nav should slide down (translate-y-full)
    expect(bottomNav.className).toContain('translate-y-full');

    // Floating pill button should appear
    const showBottomBtn = screen.getByTestId('show-bottom-menu-btn');
    expect(showBottomBtn).toBeDefined();

    // Click floating pill to slide bottom nav back in
    fireEvent.click(showBottomBtn);
    expect(bottomNav.className).toContain('translate-y-0');
  });

  it('slides mobile sidebar drawer in and out via hamburger button and backdrop', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<Home />);

    const sidebar = screen.getByTestId('scenario-sidebar');
    // Initially closed on mobile (-translate-x-full)
    expect(sidebar.className).toContain('-translate-x-full');

    // Click mobile hamburger button
    const hamburgerBtn = screen.getByTestId('mobile-hamburger-btn');
    fireEvent.click(hamburgerBtn);

    // Sidebar should now slide in (translate-x-0) and backdrop should be present
    expect(sidebar.className).toContain('translate-x-0');
    const backdrop = screen.getByTestId('sidebar-mobile-backdrop');
    expect(backdrop).toBeDefined();

    // Click backdrop to slide sidebar back out
    fireEvent.click(backdrop);
    expect(sidebar.className).toContain('-translate-x-full');
  });

  it('toggles mobile actions drawer tray from top header and bottom nav', () => {
    (useIsMobile as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(<Home />);

    // Initially actions tray is not rendered
    expect(screen.queryByTestId('top-actions-tray')).toBeNull();

    // Click mobile actions toggle button in top bar
    const actionsBtn = screen.getByTestId('mobile-actions-toggle-btn');
    fireEvent.click(actionsBtn);

    // Tray should now be visible with quick mobile actions
    const tray = screen.getByTestId('top-actions-tray');
    expect(tray).toBeDefined();
    expect(within(tray).getByText('AI Create')).toBeDefined();
    expect(within(tray).getByText('AI Batch Edit')).toBeDefined();

    // Click backdrop to close
    const backdrop = screen.getByTestId('top-actions-backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByTestId('top-actions-tray')).toBeNull();
  });
});
