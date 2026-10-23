import { UnoWordmark } from "../components/ui/PageChrome";

export default function Loading() {
  return (
    <main className="loading-screen" aria-live="polite">
      <UnoWordmark />
      <p>Getting the table ready…</p>
    </main>
  );
}
