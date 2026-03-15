'use client';

interface FriendInviteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  autoFocus?: boolean;
}

export default function FriendInviteInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'FRIEND CODE',
  buttonLabel = 'Send Invite',
  autoFocus = false,
}: FriendInviteInputProps) {
  return (
    <>
      <style>{`
        .friend-invite-input:focus,
        .friend-invite-input:focus-visible,
        .friend-invite-button:focus,
        .friend-invite-button:focus-visible {
          outline: none;
          box-shadow: none;
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, borderTop: '1px solid var(--ui-line)', paddingTop: 12 }}>
      <input
        className="friend-invite-input setup-input"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        maxLength={8}
        placeholder={placeholder}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--ui-line)',
          fontFamily: "'Courier Prime', monospace",
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--ui-text)',
          padding: '2px 0',
          width: '100%',
          outline: 'none',
          boxShadow: 'none',
          transition: 'border-bottom-color 0.12s',
          textTransform: 'uppercase',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !disabled) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <button
        className="friend-invite-button"
        type="button"
        disabled={disabled}
        onClick={onSend}
        style={{
          padding: '10px 14px',
          border: '1px solid var(--ui-line)',
          background: 'transparent',
          color: 'var(--ui-text)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          outline: 'none',
          boxShadow: 'none',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >{buttonLabel}</button>
      </div>
    </>
  );
}
