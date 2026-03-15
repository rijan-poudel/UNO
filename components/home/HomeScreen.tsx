'use client';

import { HomeUtilityBar, ModeRow, PageShell, SectionDivider, UnoWordmark } from '../ui/PageChrome';

interface HomeScreenProps {
  themeLabel: string;
  onTheme: () => void;
  onSettings: () => void;
  onComputer: () => void;
  onFriends: () => void;
}

export default function HomeScreen({
  themeLabel,
  onTheme,
  onSettings,
  onComputer,
  onFriends,
}: HomeScreenProps) {
  return (
    <PageShell>
      <HomeUtilityBar themeLabel={themeLabel} onTheme={onTheme} onSettings={onSettings} />

      <section style={{ width: 'min(760px, 100%)', margin: '0 auto', display: 'grid', gap: 32 }}>
        <div>
          <UnoWordmark />
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: "'Courier Prime', monospace",
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}
          >
            Local multiplayer · House rules
          </p>
        </div>

        <SectionDivider />

        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "'Courier Prime', monospace",
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ui-muted)',
            }}
          >
            01 / Start
          </p>
          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: "'Bebas Neue', cursive",
              fontSize: 34,
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            Choose Your Table
          </h2>
        </div>

        <div>
          <ModeRow label="With Computer" desc="Play against bots on this device" onClick={onComputer} />
          <ModeRow label="With Friends" desc="Create or join a room with friends" onClick={onFriends} last />
        </div>

        <SectionDivider />

        <p
          style={{
            margin: 0,
            fontFamily: "'Courier Prime', monospace",
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ui-muted)',
          }}
        >
          Ad-free · No account required · Press settings for rules
        </p>
      </section>
    </PageShell>
  );
}