import React from 'react';
import { EntityType } from '@/domain/entities';
import {
  User,
  Skull,
  MapPin,
  Shield,
  AlertTriangle,
  Coins,
  Compass,
  Castle,
  DoorOpen,
  Dice5,
  MessageSquareQuote,
  Image as ImageIcon,
  ListOrdered
} from 'lucide-react';

export type ThemeSkin = 'parchment' | 'cyberpunk' | 'gothic' | 'minimalist';

export interface SkinStyle {
  containerClass: string;
  headerClass: string;
  titleClass: string;
  tagClass: string;
  bodyClass: string;
  badgeClass: string;
  borderClass: string;
}

export const THEME_SKINS: Record<ThemeSkin, SkinStyle> = {
  parchment: {
    containerClass: 'bg-[#fcf8ee] text-[#2c2416] border-[#c2a677] shadow-[2px_2px_8px_rgba(44,36,22,0.12)]',
    headerClass: 'border-b-[#c2a677] bg-[#f4ecd8]/60 text-[#3b2e1a]',
    titleClass: 'font-serif font-bold text-[#4a2e12]',
    tagClass: 'bg-[#e2d5b8] text-[#523e1b] border-[#cbb991]',
    bodyClass: 'font-serif text-[#2c2416]',
    badgeClass: 'bg-[#5c2416] text-[#faf0d9]',
    borderClass: 'border-[#c2a677]',
  },
  gothic: {
    containerClass: 'bg-[#1b1c20] text-[#e0e2ec] border-[#44474f] shadow-[0_4px_12px_rgba(0,0,0,0.5)]',
    headerClass: 'border-b-[#44474f] bg-[#282a30] text-[#cfd0d8]',
    titleClass: 'font-serif tracking-wide font-bold text-[#e89078]',
    tagClass: 'bg-[#31333a] text-[#cfd0d8] border-[#4a4d56]',
    bodyClass: 'font-sans text-[#cfd0d8]',
    badgeClass: 'bg-[#8c1d18] text-white',
    borderClass: 'border-[#44474f]',
  },
  cyberpunk: {
    containerClass: 'bg-[#0f141c] text-[#00f3ff] border-[#00f3ff]/40 shadow-[0_0_15px_rgba(0,243,255,0.15)]',
    headerClass: 'border-b-[#00f3ff]/30 bg-[#16202c] text-[#ffe600]',
    titleClass: 'font-mono uppercase tracking-wider font-extrabold text-[#00f3ff]',
    tagClass: 'bg-[#00f3ff]/10 text-[#00f3ff] border-[#00f3ff]/40',
    bodyClass: 'font-mono text-[#a3d9ff]',
    badgeClass: 'bg-[#ff0055] text-black font-bold',
    borderClass: 'border-[#00f3ff]/40',
  },
  minimalist: {
    containerClass: 'bg-white text-neutral-900 border-neutral-200 shadow-sm',
    headerClass: 'border-b-neutral-200 bg-neutral-50 text-neutral-800',
    titleClass: 'font-sans font-semibold text-neutral-900',
    tagClass: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    bodyClass: 'font-sans text-neutral-700',
    badgeClass: 'bg-neutral-900 text-white',
    borderClass: 'border-neutral-200',
  },
};

export function getEntityIcon(type: EntityType, className = 'w-4 h-4') {
  switch (type) {
    case 'npc':
      return <User className={className} />;
    case 'enemy':
      return <Skull className={className} />;
    case 'location':
      return <MapPin className={className} />;
    case 'item':
      return <Shield className={className} />;
    case 'trap':
      return <AlertTriangle className={className} />;
    case 'treasure':
      return <Coins className={className} />;
    case 'region':
      return <Compass className={className} />;
    case 'adventure_site':
      return <Castle className={className} />;
    case 'area':
      return <DoorOpen className={className} />;
    case 'random_event_list':
      return <Dice5 className={className} />;
    case 'rumor_list':
      return <MessageSquareQuote className={className} />;
    case 'image':
      return <ImageIcon className={className} />;
    case 'generic_list':
      return <ListOrdered className={className} />;
  }
}
