'use client';

import type { GameRules } from '../types/rules';
import { defaultRules } from '../types/rules';

interface SettingsModalProps {
  open: boolean;
  rules: Partial<GameRules>;
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
  { key: 'drawUntilPlayable', label: 'Draw until playable', description: 'Keep drawing until a card matches.' },
  { key: 'reverseActsAsSkipInTwoPlayer', label: 'Reverse = Skip (2p)', description: 'Reverse skips in heads-up.' },
  { key: 'mustDeclareUno', label: 'Must call UNO', description: 'Missed UNO can be penalised.' },
  { key: 'allowStartingActionCard', label: 'Action start card', description: 'Action card can open the game.' },
  { key: 'allowDoublePlaySameNumber', label: 'Double play', description: 'Play two same-number cards at once.' },
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
        border: `1.5px solid ${on ? '#1a0f00' : 'rgba(26,15,0,0.2)'}`,
        background: on ? '#1a0f00' : 'transparent',
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
          background: on ? '#fff8f0' : 'rgba(26,15,0,0.28)',
          transition: 'left 0.15s cubic-bezier(0.22,1,0.36,1), background 0.15s',
        }}
      />
    </button>
  );
}

export default function SettingsModal({ open, rules, onChange, onClose }: SettingsModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95,
        background: 'rgba(26,15,0,0.42)',
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
          background: '#fff8f0',
          border: '1px solid rgba(26,15,0,0.18)',
          padding: 18,
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: '0.05em', color: '#1a0f00' }}>
            Settings
          </p>
          <button
            onClick={onClose}
            style={{
              border: '1px solid rgba(26,15,0,0.2)',
              background: 'transparent',
              color: 'rgba(26,15,0,0.6)',
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

        <p style={{ margin: 0, fontSize: 11, color: 'rgba(26,15,0,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Controls / House Rules (shared by local and online)
        </p>

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
                  borderBottom: i < RULE_TOGGLES.length - 1 ? '1px solid rgba(26,15,0,0.08)' : 'none',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a0f00' }}>{label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(26,15,0,0.36)', lineHeight: 1.45 }}>{description}</p>
                </div>
                <Toggle
                  on={isOn}
                  onClick={() => onChange({ ...rules, [key]: !isOn })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
