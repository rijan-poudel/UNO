// A visible profile choice: no identity inferred from names or seat IDs.
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
  const selectedLabel = PLAYER_AVATARS.find(
    (avatar) => avatar.id === selected,
  )?.label;
  return (
    <fieldset className="avatar-picker">
      <legend>Your avatar</legend>
      <p className="muted">
        Choose how you appear at the table. Saved on this device.
      </p>
      <div className="avatar-picker-content">
        <div className="avatar-preview" aria-hidden="true">
          <PlayerAvatar seed="profile-preview" avatarId={selected} large />
        </div>
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
                <Check
                  className="avatar-selected"
                  size={16}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <span className="avatar-choice-status" role="status">
        {selectedLabel} selected
      </span>
    </fieldset>
  );
}
