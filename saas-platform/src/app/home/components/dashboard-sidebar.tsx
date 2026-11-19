'use client';

import { Home, LogOut, ScanLine, Heart, User, X } from 'lucide-react';
import Image from 'next/image';
import type { DashboardTab } from '../types';
import styles from '../dashboard.module.css';

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  displayName: string;
  email: string;
  isOpen: boolean;
  onNavigate: (tab: DashboardTab) => void;
  onClose: () => void;
  onLogout: () => void;
}

const items = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'ai-scan', label: 'AI Vibe Scan', icon: ScanLine },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: User },
] as const;

export function DashboardSidebar({ activeTab, displayName, email, isOpen, onNavigate, onClose, onLogout }: DashboardSidebarProps) {
  return (
    <>
      {isOpen && <button aria-label="Close navigation" className={styles.mobileBackdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Dashboard sidebar">
        <a href="/home" className={styles.brand} aria-label="VibeTune home">
          <Image src="/assets/brand/vibetune_logo_v1.png" alt="" width={34} height={34} />
          <span>VibeTune</span>
        </a>
        <nav className={styles.nav} aria-label="Main navigation">
          {items.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onNavigate(id)} className={`${styles.navButton} ${activeTab === id ? styles.navButtonActive : ''}`}>
              <Icon size={18} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarPoster}>
          <strong>MORE FEELING.<br />LESS FILTER.</strong>
          <span>VIBETUNE / ISSUE NO. 06</span>
        </div>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">{displayName.charAt(0).toUpperCase() || 'V'}</span>
          <div className={styles.identityCopy}><strong>{displayName}</strong><span>{email}</span></div>
        </div>
        <button type="button" onClick={onLogout} className={`${styles.navButton} ${styles.logout}`}><LogOut size={18} aria-hidden="true" />Log out</button>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="absolute right-3 top-3 grid h-9 w-9 place-items-center md:hidden"><X size={18} /></button>
      </aside>
    </>
  );
}
