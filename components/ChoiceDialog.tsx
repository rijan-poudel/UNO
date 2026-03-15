'use client';

interface ChoiceDialogAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface ChoiceDialogProps {
  eyebrow: string;
  title: string;
  description: string;
  actions: ChoiceDialogAction[];
}

export default function ChoiceDialog({ eyebrow, title, description, actions }: ChoiceDialogProps) {
  return (
    <>
      <style>{`
        @keyframes choiceFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes choiceSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .choice-action {
          transition: opacity 0.12s ease, color 0.12s ease, border-color 0.12s ease;
          cursor: pointer;
        }
        .choice-action:hover { opacity: 0.82; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 70,
          background: 'rgba(255,248,240,0.72)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          animation: 'choiceFadeIn 0.18s ease',
        }}
      >
        <div
          style={{
            width: 'min(460px, 100%)',
            background: 'var(--ui-surface)',
            border: '1px solid var(--ui-text)',
            padding: '32px 28px 24px',
            display: 'grid',
            gap: 24,
            animation: 'choiceSlideUp 0.2s ease',
          }}
        >
          <div>
            <p style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}>{eyebrow}</p>
            <h2 style={{
              margin: '8px 0 0',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 32,
              letterSpacing: '0.04em',
              color: 'var(--ui-text)',
              lineHeight: 1,
            }}>{title}</h2>
          </div>

          <p style={{
            margin: 0,
            fontFamily: "'Courier Prime', monospace",
            fontSize: 12,
            lineHeight: 1.6,
            letterSpacing: '0.04em',
            color: 'var(--ui-text)',
          }}>{description}</p>

          <div style={{ display: 'grid', gap: 8 }}>
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="choice-action"
                style={action.variant === 'primary'
                  ? {
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: 22,
                      letterSpacing: '0.18em',
                      background: 'var(--ui-text)',
                      color: 'var(--ui-bg)',
                      border: 'none',
                      padding: '18px 0',
                      width: '100%',
                    }
                  : {
                      fontFamily: "'Courier Prime', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: '1px solid var(--ui-line)',
                      color: 'var(--ui-muted)',
                      padding: '10px 12px',
                      width: '100%',
                    }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}