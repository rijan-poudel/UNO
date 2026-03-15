'use client';

import { useEffect, useState } from 'react';
import type { GameRules } from '../types/rules';
import { defaultRules } from '../types/rules';

const ONLINE_PLAYER_NAME_KEY = 'uno.online.playerName';

function getStoredProfileName(): string {
  if (typeof window === 'undefined') return 'Player 1';
  try {
    const stored = window.localStorage.getItem(ONLINE_PLAYER_NAME_KEY);
    return stored && stored.trim() ? stored.trim().slice(0, 18) : 'Player 1';
  } catch {
    return 'Player 1';
  }
}

interface SettingsModalProps {
  open: boolean;
  rules: Partial<GameRules>;
  friendCode?: string;
  onCopyFriendCode?: () => void;
  onChange: (rules: Partial<GameRules>) => void;
  onClose: () => void;
}

interface RuleToggle {
  key: keyof GameRules;
  label: string;
  description: string;
}

const RULE_TOGGLES: RuleToggle[] = [
  { key: 'stackDraw2', label: 'Stack +2', description: 'Chain draw-two cards together.' },
  { key: 'stackWild4', label: 'Stack +4', description: 'Chain wild-four cards together.' },
  { key: 'allowWild4OnDraw2', label: '+4 counters +2', description: 'Wild four can answer a draw two.' },
  { key: 'allowDiscardAll', label: 'Discard All card', description: 'Enable the Discard All card that drops all cards in that card color.' },
  { key: 'allowShuffleCard', label: 'Shuffle Hands card', description: 'Enable the wild shuffle card (choose color after shuffling all hands).' },
  { key: 'drawUntilPlayable', label: 'Draw until playable', description: 'Keep drawing until a card matches.' },
  { key: 'reverseActsAsSkipInTwoPlayer', label: 'Reverse = Skip (2p)', description: 'Reverse skips in heads-up.' },
  { key: 'mustDeclareUno', label: 'Must call UNO', description: 'Missed UNO can be penalised.' },
  { key: 'allowStartingActionCard', label: 'Action start card', description: 'Action card can open the game.' },
  { key: 'allowDoublePlaySameNumber', label: 'Double play', description: 'Play two same-number cards at once.' },
  { key: 'canFinishWithActionCard', label: 'Finish with action card', description: 'Players can go out on skip, reverse, +2 or wilds.' },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-checked={on}
      role="switch"
      style={{
        width: 40,
        height: 24,
        border: `1.5px solid ${on ? 'var(--ui-text)' : 'var(--ui-line)'}`,
        background: on ? 'var(--ui-text)' : 'transparent',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 20 : 3,
          width: 14,
          height: 14,
          background: on ? 'var(--ui-bg)' : 'var(--ui-muted)',
          transition: 'left 0.15s cubic-bezier(0.22,1,0.36,1), background 0.15s',
        }}
      />
    </button>
  );
}

export default function SettingsModal({
  open,
  rules,
  friendCode,
  onCopyFriendCode,
  onChange,
  onClose,
}: SettingsModalProps) {
  const [tab, setTab] = useState<'profile' | 'controls'>('controls');
  const [profileName, setProfileName] = useState(getStoredProfileName);

  useEffect(() => {
    if (!open) return;
    try {
      const value = profileName.trim() || 'Player 1';
      window.localStorage.setItem(ONLINE_PLAYER_NAME_KEY, value);
    } catch {
      // Ignore storage issues.
    }
  }, [profileName, open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        background: 'color-mix(in srgb, var(--ui-bg) 58%, #000 42%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '88dvh',
          overflowY: 'auto',
          background: 'var(--ui-surface)',
          border: '1px solid var(--ui-line)',
          padding: 18,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: '0.05em', color: 'var(--ui-text)' }}>
            Settings
          </p>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--ui-line)',
              background: 'transparent',
              color: 'var(--ui-muted)',
              padding: '8px 10px',
              cursor: 'pointer',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Close
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: 'var(--ui-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Grouped by task to keep setup clear
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--ui-line)' }}>
          <button
            type="button"
            onClick={() => setTab('profile')}
            style={{
              border: 'none',
              borderRight: '1px solid var(--ui-line)',
              background: tab === 'profile' ? 'var(--ui-text)' : 'transparent',
              color: tab === 'profile' ? 'var(--ui-bg)' : 'var(--ui-text)',
              padding: '12px 10px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >Profile</button>
          <button
            type="button"
            onClick={() => setTab('controls')}
            style={{
              border: 'none',
              background: tab === 'controls' ? 'var(--ui-text)' : 'transparent',
              color: tab === 'controls' ? 'var(--ui-bg)' : 'var(--ui-text)',
              padding: '12px 10px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >Controls</button>
        </div>

        {tab === 'profile' ? (
          <div style={{
            border: '1px solid var(--ui-line)',
            padding: 14,
            display: 'grid',
            gap: 10,
          }}>
            <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
              Player name
            </p>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value.slice(0, 18))}
              maxLength={18}
              placeholder="Player 1"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--ui-line)',
                fontFamily: "'Courier Prime', monospace",
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ui-text)',
                padding: '4px 0',
                width: '100%',
              }}
            />

            <div style={{ height: 1, background: 'var(--ui-line)' }} />

            <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ui-muted)' }}>
              Friend code
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <div style={{
                border: '1px solid var(--ui-line)',
                padding: '10px 12px',
                fontFamily: "'Courier Prime', monospace",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--ui-text)',
              }}>
                {friendCode || 'Syncing...'}
              </div>
              <button
                type="button"
                onClick={onCopyFriendCode}
                style={{
                  border: '1px solid var(--ui-line)',
                  background: 'transparent',
                  color: 'var(--ui-text)',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >Copy</button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ui-muted)' }}>
              Share this code with friends so they can send room invites.
            </p>
          </div>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ui-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Controls / House Rules (shared by local and online)
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              gap: 16, alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--ui-line)',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ui-text)' }}>Starting hand size</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ui-muted)', lineHeight: 1.45 }}>How many cards each player is dealt at the start.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const cur = rules.startingHandSize ?? defaultRules.startingHandSize;
                    if (cur > 1) onChange({ ...rules, startingHandSize: cur - 1 });
                  }}
                  style={{
                    width: 28, height: 28,
                    border: '1.5px solid var(--ui-line)',
                    background: 'transparent', color: 'var(--ui-text)',
                    cursor: 'pointer', fontSize: 16, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >−</button>
                <span style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 15, fontWeight: 700, color: 'var(--ui-text)',
                  minWidth: 24, textAlign: 'center',
                }}>{rules.startingHandSize ?? defaultRules.startingHandSize}</span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = rules.startingHandSize ?? defaultRules.startingHandSize;
                    if (cur < 15) onChange({ ...rules, startingHandSize: cur + 1 });
                  }}
                  style={{
                    width: 28, height: 28,
                    border: '1.5px solid var(--ui-line)',
                    background: 'transparent', color: 'var(--ui-text)',
                    cursor: 'pointer', fontSize: 16, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >+</button>
              </div>
            </div>

            <div style={{ display: 'grid' }}>
              {RULE_TOGGLES.map(({ key, label, description }, i) => {
                const isOn = !!(rules[key as keyof typeof rules] ?? defaultRules[key]);
                return (
                  <div
                    key={key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 16,
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: i < RULE_TOGGLES.length - 1 ? '1px solid var(--ui-line)' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ui-text)' }}>{label}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ui-muted)', lineHeight: 1.45 }}>{description}</p>
                    </div>
                    <Toggle
                      on={isOn}
                      onClick={() => onChange({ ...rules, [key]: !isOn })}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
