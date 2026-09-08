import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

export type ThemeType = 'cyber-dark' | 'midnight-oled' | 'nordic-light' | 'sunset-amber';

interface ThemeOption {
  id: ThemeType;
  label: string;
  icon: string;
  color: string;
}

const THEMES: ThemeOption[] = [
  { id: 'cyber-dark', label: 'Nebula Obsidian', icon: '🌌', color: '#818cf8' },
  { id: 'midnight-oled', label: 'Cyber Emerald', icon: '⚡', color: '#2dd4bf' },
  { id: 'nordic-light', label: 'Alabaster Studio (Light)', icon: '🏛️', color: '#6366f1' },
  { id: 'sunset-amber', label: 'Dune Rose Noir', icon: '🌅', color: '#fb923c' },
];

export const ThemeSelector: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('nexus_theme') as ThemeType) || 'cyber-dark';
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('nexus_theme', currentTheme);
  }, [currentTheme]);

  const activeOption = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="theme-picker-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Visual Theme"
      >
        <Palette size={15} color={activeOption.color} />
        <span>{activeOption.icon} {activeOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="card"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 220,
              padding: 8,
              zIndex: 100,
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Visual Theme
            </div>

            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  justifyContent: 'space-between',
                  background: currentTheme === theme.id ? 'var(--bg-tag)' : 'transparent',
                  borderColor: currentTheme === theme.id ? 'var(--primary)' : 'transparent',
                  color: currentTheme === theme.id ? 'var(--primary)' : 'var(--text-primary)',
                  padding: '8px 12px',
                }}
                onClick={() => {
                  setCurrentTheme(theme.id);
                  setIsOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{theme.icon}</span>
                  <span style={{ fontSize: '0.82rem' }}>{theme.label}</span>
                </div>
                {currentTheme === theme.id && <Check size={14} color={theme.color} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
