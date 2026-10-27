// Choose one ready-made portrait. Custom avatar creation is deferred.
"use client";
import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import {
  PLAYER_AVATARS,
  getPlayerAvatar,
  savePlayerAvatar,
  subscribePlayerAvatar,
} from "../lib/playerAvatars";
import PlayerAvatar from "./PlayerAvatar";

export default function AvatarPicker() {
  const selected = useSyncExternalStore(
    subscribePlayerAvatar,
    getPlayerAvatar,
    () => "initials" as const,
  );
  return (
    <section className="avatar-picker" aria-label="Choose your avatar">
      <h3>Choose your avatar</h3>
      <div className="avatar-options">
        {PLAYER_AVATARS.map((avatar) => (
          <button
            type="button"
            key={avatar.id}
            aria-label={avatar.label}
            aria-pressed={selected === avatar.id}
            title={avatar.label}
            onClick={() => savePlayerAvatar(avatar.id)}
          >
            <PlayerAvatar seed="profile" avatarId={avatar.id} large />
            {selected === avatar.id && (
              <Check className="avatar-selected" size={16} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
