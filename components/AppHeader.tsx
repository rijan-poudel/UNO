// The title and a single profile entry point keep the current task in focus.
"use client";
import { UnoWordmark } from "./ui/PageChrome";
import ProfileMenu, { type ProfileMenuProps } from "./ProfileMenu";
export default function AppHeader(props: ProfileMenuProps) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <UnoWordmark compact />
      </div>
      <div className="header-actions">
        <ProfileMenu {...props} />
      </div>
    </header>
  );
}
