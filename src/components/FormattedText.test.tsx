import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormattedText } from './FormattedText';

describe('FormattedText component', () => {
  it('renders null when content is empty or null', () => {
    const { container: c1 } = render(<FormattedText content="" />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<FormattedText content={null} />);
    expect(c2.firstChild).toBeNull();

    const { container: c3 } = render(<FormattedText content={undefined} />);
    expect(c3.firstChild).toBeNull();
  });

  it('renders regular plain text without lists', () => {
    const { container } = render(<FormattedText content="Just a plain description." />);
    expect(screen.getByText('Just a plain description.')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  it('renders multiline text lists with * as a bullet list', () => {
    const text = `* Member of the Silver Vanguard
* Dislikes necromancers
* Carries an ancient brass key`;

    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Member of the Silver Vanguard')).toBeInTheDocument();
    expect(screen.getByText('Dislikes necromancers')).toBeInTheDocument();
    expect(screen.getByText('Carries an ancient brass key')).toBeInTheDocument();
    // Bullet marker should be rendered
    const bullets = container.querySelectorAll('span[aria-hidden="true"]');
    expect(bullets).toHaveLength(3);
    expect(bullets[0].textContent).toBe('•');
  });

  it('renders multiline text lists with 1. 2. 3. as a bullet list', () => {
    const text = `1. Target spellcasters first
2. Ambush from shadows
3. Retreat if HP falls below 10`;

    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Target spellcasters first')).toBeInTheDocument();
    expect(screen.getByText('Ambush from shadows')).toBeInTheDocument();
    expect(screen.getByText('Retreat if HP falls below 10')).toBeInTheDocument();
    // Bullet marker should be rendered for each
    const bullets = container.querySelectorAll('span[aria-hidden="true"]');
    expect(bullets).toHaveLength(3);
    expect(bullets[0].textContent).toBe('•');
  });

  it('renders lists with - and + and • as bullet lists', () => {
    const text = `- Potion of Healing
+ Scroll of Shield
• 50 gold coins`;

    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Potion of Healing')).toBeInTheDocument();
    expect(screen.getByText('Scroll of Shield')).toBeInTheDocument();
    expect(screen.getByText('50 gold coins')).toBeInTheDocument();
  });

  it('renders lists with parentheses numbering like 1) 2) 3)', () => {
    const text = `1) First tactic
2) Second tactic`;

    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
    expect(screen.getByText('First tactic')).toBeInTheDocument();
    expect(screen.getByText('Second tactic')).toBeInTheDocument();
  });

  it('renders single-line lists with * (e.g. "* item 1 * item 2")', () => {
    const text = `* Claws: +4 to hit * Bite: +4 to hit * Tail: DC 12 save`;
    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Claws: +4 to hit')).toBeInTheDocument();
    expect(screen.getByText('Bite: +4 to hit')).toBeInTheDocument();
    expect(screen.getByText('Tail: DC 12 save')).toBeInTheDocument();
  });

  it('renders single-line lists with 1. 2. 3. (e.g. "1. First 2. Second")', () => {
    const text = `1. Search the desk 2. Inspect the rug 3. Check behind the portrait`;
    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Search the desk')).toBeInTheDocument();
    expect(screen.getByText('Inspect the rug')).toBeInTheDocument();
    expect(screen.getByText('Check behind the portrait')).toBeInTheDocument();
  });

  it('renders intro text followed by single-line lists', () => {
    const text = `Actions: 1. Multiattack: Two attacks 2. Bite: 1d8 damage`;
    const { container } = render(<FormattedText content={text} />);
    expect(screen.getByText('Actions:')).toBeInTheDocument();
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
    expect(screen.getByText('Multiattack: Two attacks')).toBeInTheDocument();
    expect(screen.getByText('Bite: 1d8 damage')).toBeInTheDocument();
  });

  it('renders mixed text with introductory paragraphs, bullet lists, and trailing text', () => {
    const text = `The chamber is covered in thick cobwebs.

* A silver candelabra on the floor
* An old iron key under the rubble

Be wary of the collapsing ceiling.`;

    const { container } = render(<FormattedText content={text} />);
    expect(screen.getByText('The chamber is covered in thick cobwebs.')).toBeInTheDocument();
    expect(screen.getByText('Be wary of the collapsing ceiling.')).toBeInTheDocument();

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
    expect(screen.getByText('A silver candelabra on the floor')).toBeInTheDocument();
    expect(screen.getByText('An old iron key under the rubble')).toBeInTheDocument();
  });

  it('renders arrays of strings directly as a bullet list', () => {
    const items = ['First action', 'Second action', 'Third action'];
    const { container } = render(<FormattedText content={items} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('First action')).toBeInTheDocument();
  });

  it('renders nested / indented sub-items with indentation styling', () => {
    const text = `* Primary objective
  * Sub-task A
  * Sub-task B
* Secondary objective`;

    const { container } = render(<FormattedText content={text} />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(4);
    // Indented items have pl-3.5
    expect(listItems[1].className).toContain('pl-3.5');
    expect(listItems[2].className).toContain('pl-3.5');
    expect(listItems[0].className).not.toContain('pl-3.5');
    expect(listItems[3].className).not.toContain('pl-3.5');
  });

  it('supports inline markdown bold, italic, and code formatting', () => {
    const text = `* **Multiattack.** The creature makes *two* claw attacks with its \`claws\`.`;
    const { container } = render(<FormattedText content={text} />);

    const strong = container.querySelector('strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('Multiattack.');

    const em = container.querySelector('em');
    expect(em).not.toBeNull();
    expect(em?.textContent).toBe('two');

    const code = container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code?.textContent).toBe('claws');
  });

  it('does not mistakenly treat numbers inside prose as lists (e.g. 1.5 miles)', () => {
    const text = `He ran 1.5 miles at level 2. No list here.`;
    const { container } = render(<FormattedText content={text} />);
    expect(container.querySelectorAll('li')).toHaveLength(0);
    expect(screen.getByText('He ran 1.5 miles at level 2. No list here.')).toBeInTheDocument();
  });

  it('supports listStyle="numbered" to render sequential numbers', () => {
    const text = `* Discover the secret doorway
* Solve the runic puzzle
* Claim the artifact`;

    const { container } = render(<FormattedText content={text} listStyle="numbered" />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
    expect(screen.getByText('Discover the secret doorway')).toBeInTheDocument();
    expect(screen.getByText('Solve the runic puzzle')).toBeInTheDocument();
    expect(screen.getByText('Claim the artifact')).toBeInTheDocument();

    const markers = container.querySelectorAll('span[aria-hidden="true"]');
    expect(markers[0].textContent).toBe('1.');
    expect(markers[1].textContent).toBe('2.');
    expect(markers[2].textContent).toBe('3.');
  });

  it('supports listStyle="numbered" on arrays', () => {
    const items = ['Item Alpha', 'Item Beta', 'Item Gamma'];
    const { container } = render(<FormattedText content={items} listStyle="numbered" />);
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);

    const markers = container.querySelectorAll('span[aria-hidden="true"]');
    expect(markers[0].textContent).toBe('1.');
    expect(markers[1].textContent).toBe('2.');
    expect(markers[2].textContent).toBe('3.');
  });
});
