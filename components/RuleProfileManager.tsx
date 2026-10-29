// Pick a game, pin it to home, or edit a separate custom copy.
"use client";
import {
  useState,
  useSyncExternalStore,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  Check,
  Star,
  Copy,
  Pencil,
  Trash2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { GameRules } from "../types/rules";
import {
  ORIGINAL_MODES,
  matchesPreset,
  getTableMood,
} from "../lib/rulePresets";
import {
  getAllProfiles,
  getFavoriteProfileIds,
  getActiveProfileId,
  saveRuleProfile,
  deleteRuleProfile,
  toggleFavorite,
  replaceFavorite,
  setActiveProfileId,
  subscribeRuleProfiles,
  getRuleProfilesRevision,
  getServerRuleProfilesRevision,
  type RuleProfile,
} from "../lib/customRuleProfiles";
import Modal from "./Modal";
import UnoCard from "./UnoCard";
import type { Card } from "../types/card";

interface Props {
  rules: Partial<GameRules>;
  onChange: (
    rules: Partial<GameRules>,
  ) => void | boolean | Promise<void | boolean>;
  children: (
    rules: GameRules,
    onChange: (rules: GameRules) => void,
  ) => ReactNode;
}
function profileTitle(profile: RuleProfile): string {
  return profile.isOriginal
    ? profile.id === "classic"
      ? "Classic UNO"
      : (ORIGINAL_MODES.find((mode) => mode.id === profile.id)?.shortLabel ??
        profile.name)
    : profile.name;
}
function ProfileMark({ profile }: { profile: RuleProfile }) {
  const card: Card = {
    id: `profile-${profile.id}`,
    color: profile.rules.gameMode === "classic" ? "red" : "wild",
    value:
      profile.rules.gameMode === "classic"
        ? "7"
        : profile.rules.gameMode === "no_mercy"
          ? "wildDraw10"
          : "wild",
  };
  return (
    <span className="rule-profile-mark" aria-hidden="true">
      <UnoCard card={card} sizeMultiplier={0.34} />
    </span>
  );
}
export default function RuleProfileManager({
  rules,
  onChange,
  children,
}: Props) {
  useSyncExternalStore(
    subscribeRuleProfiles,
    getRuleProfilesRevision,
    getServerRuleProfilesRevision,
  );
  const profiles = getAllProfiles();
  const favorites = getFavoriteProfileIds();
  const selected =
    profiles.find(
      (p) => p.id === getActiveProfileId() && matchesPreset(rules, p.rules),
    ) ?? profiles.find((p) => matchesPreset(rules, p.rules));
  const [draft, setDraft] = useState<{
    id?: string;
    name: string;
    rules: GameRules;
  } | null>(null);
  const [replacement, setReplacement] = useState<RuleProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const surface = useRef<HTMLDivElement>(null);
  const editing = draft !== null;
  const previousEditing = useRef(editing);
  useEffect(() => {
    if (previousEditing.current === editing) return;
    previousEditing.current = editing;
    const target = surface.current?.querySelector<HTMLElement>(
      editing ? "input" : '.rule-profile-select[aria-pressed="true"]',
    );
    (target ?? surface.current)?.focus();
  }, [editing]);
  const select = async (profile: RuleProfile) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    const previousId = getActiveProfileId();
    setActiveProfileId(profile.id);
    try {
      const result = await onChange({
        ...profile.rules,
        botDifficulty: rules.botDifficulty ?? "standard",
      });
      if (result === false) {
        setActiveProfileId(previousId);
        return false;
      }
      return true;
    } catch {
      setActiveProfileId(previousId);
      toast.error("Couldn’t change the game. Please try again.");
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const pin = (profile: RuleProfile) => {
    try {
      if (toggleFavorite(profile.id).needsReplacement) setReplacement(profile);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const edit = (profile: RuleProfile, copy = false) => {
    setConfirmDelete(false);
    setDraft({
      id: copy ? undefined : profile.id,
      name: copy
        ? `${profile.isOriginal ? ORIGINAL_MODES.find((m) => m.id === profile.id)?.shortLabel : profile.name} custom`.slice(
            0,
            30,
          )
        : profile.name,
      rules: { ...profile.rules },
    });
  };
  const removeDraft = async () => {
    const id = draft?.id;
    if (!id || pending.current) return;
    try {
      if (selected?.id === id && !(await select(profiles[0]))) return;
      deleteRuleProfile(id);
      setConfirmDelete(false);
      setDraft(null);
      toast.success("Profile deleted.");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  const cancelDelete = () => {
    setConfirmDelete(false);
    requestAnimationFrame(() =>
      deleteTrigger.current?.focus({ preventScroll: true }),
    );
  };
  if (draft)
    return (
      <Modal
        title="Custom profile"
        onClose={
          busy
            ? undefined
            : () => (confirmDelete ? cancelDelete() : setDraft(null))
        }
        className={`settings-modal settings-tone-${getTableMood(rules)}`}
      >
        <form
          className="rule-profile-editor"
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending.current || confirmDelete) return;
            try {
              const saved = saveRuleProfile(draft.name, draft.rules, draft.id);
              if (!(await select(saved))) {
                setDraft({
                  id: saved.id,
                  name: saved.name,
                  rules: saved.rules,
                });
                toast.error(
                  "Profile saved. Try again to use it at this table.",
                );
                return;
              }
              setDraft(null);
              toast.success(`Saved ${saved.name}.`);
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
        >
          <div className="settings-panel" ref={surface} tabIndex={-1}>
            <fieldset
              className="rule-editor-fields"
              disabled={busy || confirmDelete}
            >
              <label className="profile-name-form">
                <span className="field-label">Profile name</span>
                <input
                  value={draft.name}
                  maxLength={30}
                  required
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <p className="rule-profile-base">
                {
                  ORIGINAL_MODES.find((m) => m.id === draft.rules.gameMode)
                    ?.shortLabel
                }{" "}
                rules
              </p>
              {children(draft.rules, (next) =>
                setDraft({ ...draft, rules: next }),
              )}
              {draft.id && (
                <button
                  type="button"
                  className="settings-link rule-duplicate"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      id: undefined,
                      name: `${draft.name} copy`.slice(0, 30),
                    })
                  }
                >
                  <Copy size={16} /> Make a copy
                </button>
              )}
            </fieldset>
          </div>
          <div className="modal-footer rule-editor-actions">
            {confirmDelete ? (
              <>
                <p className="rule-delete-prompt">
                  Delete <strong>{draft.name}</strong>?
                </p>
                <button
                  key="keep-profile"
                  type="button"
                  className="button secondary small"
                  autoFocus
                  disabled={busy}
                  onClick={cancelDelete}
                >
                  Keep profile
                </button>
                <button
                  key="confirm-delete-profile"
                  type="button"
                  className="button secondary small rule-delete"
                  disabled={busy}
                  aria-busy={busy}
                  onClick={() => void removeDraft()}
                >
                  {busy ? "Deleting…" : "Delete profile"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="submit"
                  className="button primary small"
                  disabled={busy || !draft.name.trim()}
                >
                  {busy ? "Saving…" : "Save and use"}
                </button>
                <button
                  type="button"
                  className="button secondary small"
                  disabled={busy}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
                {draft.id && (
                  <button
                    ref={deleteTrigger}
                    type="button"
                    className="text-button rule-delete"
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </Modal>
    );
  return (
    <div className="rule-profile-list" ref={surface} tabIndex={-1}>
      <p className="rule-profile-caption">Pin up to 3 to Home.</p>
      {profiles.map((profile) => (
        <div
          className="rule-profile-row"
          key={profile.id}
          data-selected={selected?.id === profile.id || undefined}
        >
          <button
            type="button"
            className="rule-profile-select"
            aria-pressed={selected?.id === profile.id}
            aria-label={profile.name}
            disabled={busy}
            onClick={() => void select(profile)}
          >
            <ProfileMark profile={profile} />
            <span>
              <strong>
                {profileTitle(profile)}
                {selected?.id === profile.id && (
                  <Check
                    size={16}
                    className="rule-profile-active"
                    aria-hidden="true"
                  />
                )}
              </strong>
              <small>
                {profile.isOriginal
                  ? profile.id === "classic"
                    ? "Match colors & numbers"
                    : profile.id === "no_mercy"
                      ? "Stacking · swaps · knockouts"
                      : "Every card is wild"
                  : `${ORIGINAL_MODES.find((m) => m.id === profile.rules.gameMode)?.shortLabel} · custom`}
              </small>
            </span>
          </button>
          <div className="rule-profile-actions">
            <button
              type="button"
              className="icon-button"
              disabled={busy}
              aria-pressed={favorites.includes(profile.id)}
              aria-label={`${favorites.includes(profile.id) ? "Unpin" : "Pin"} ${profile.name}`}
              title={
                favorites.includes(profile.id)
                  ? "Unpin from home"
                  : "Pin to home"
              }
              onClick={() => pin(profile)}
            >
              <Star
                size={18}
                fill={
                  favorites.includes(profile.id) ? "var(--club-yellow)" : "none"
                }
              />
            </button>
            {!profile.isOriginal && (
              <button
                type="button"
                className="icon-button"
                disabled={busy}
                aria-label={`Edit ${profile.name}`}
                title="Edit rules"
                onClick={() => edit(profile)}
              >
                <Pencil size={17} />
              </button>
            )}
            {profile.isOriginal && (
              <button
                type="button"
                className="icon-button"
                disabled={busy}
                aria-label={`Copy ${profile.name}`}
                title="Make a custom copy"
                onClick={() => edit(profile, true)}
              >
                <Copy size={17} />
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="settings-link rule-profile-new"
        disabled={busy}
        onClick={() => edit(selected ?? profiles[0], true)}
      >
        <Plus size={17} /> Create custom profile
      </button>
      {replacement && (
        <Modal
          title="Pin to home"
          onClose={() => setReplacement(null)}
          className={`settings-modal favorite-replace-modal settings-tone-${getTableMood(rules)}`}
        >
          <div className="settings-panel">
            <p className="rule-profile-caption">
              Choose a slot for <strong>{replacement.name}</strong>.
            </p>
            <div className="favorite-replace-options">
              {favorites.map((id) => {
                const profile = profiles.find((p) => p.id === id);
                return (
                  profile && (
                    <button
                      key={id}
                      type="button"
                      className="favorite-replace-option-btn"
                      aria-label={`Replace ${profile.name} with ${replacement.name}`}
                      onClick={() => {
                        replaceFavorite(id, replacement.id);
                        setReplacement(null);
                      }}
                    >
                      <ProfileMark profile={profile} />
                      <span className="favorite-replace-text">
                        <strong>{profileTitle(profile)}</strong>
                        <small>Replace with {replacement.name}</small>
                      </span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  )
                );
              })}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => setReplacement(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
