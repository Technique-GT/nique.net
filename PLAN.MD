# Article Review & Publishing Flow — Phased Checklist (Dashboard + Backend)

## Phase 1 — Roles & States

- [x] Define roles: owner (draft/edit/request review/manage authors), admin (all + publish/unpublish/request changes/transfer), non-owner author (edit only when unlocked; no author management).
- [x] Track states: `reviewStatus` = `draft` | `in_review` | `changes_requested` | `published`.
- [x] Track flags: `hasPendingChanges` for edits not yet live; keep `published` boolean + `publishedAt` for live visibility.
- [ ] Add metadata: `reviewedAt`, `reviewedBy`, optional `reviewNotes` (when admin requests changes).

## Phase 2 — State Transitions

- [x] Draft → Request review (owner/admin): set `in_review`, lock non-admin edits, notify admins.
- [x] In review → Publish (admin): set `published=true`, `reviewStatus=published`, clear `hasPendingChanges`, set `reviewedAt/by`.
- [x] In review → Changes requested (admin): set `changes_requested`, store `reviewNotes`, unlock for edits, keep `published` unchanged.
- [x] Changes requested → Draft/editable: allow owner/authors to edit; they can request review again.
- [x] Published edits: saving sets `hasPendingChanges=true` and `reviewStatus=changes_requested` (or `draft`) while keeping `published=true` so the live version stays up; admin publish applies pending changes and clears the flag.

## Phase 3 — Locking & Permissions (Server)

- [x] Enforce locks: reject PUT/PATCH content changes when `reviewStatus=in_review` for non-admins (409/423); allow admin override.
- [x] Allow edits when `changes_requested` or `draft` per role; block author management unless owner/admin.
- [x] Saving a published article by non-admin sets `hasPendingChanges=true` and requires re-review; do not auto-unpublish.

## Phase 4 — API Surface (`/api/admin/articles`)

- [x] `POST /:id/request-review` (owner/admin) → `in_review`.
- [x] `POST /:id/unrequest-review` (owner/admin) → back to `draft`.
- [x] `POST /:id/request-changes` (admin, optional `reviewNotes`) → `changes_requested`.
- [x] `POST /:id/publish` (admin) → apply pending edits, set `published=true`, `reviewStatus=published`, clear pending flag, set `reviewedAt/by`.
- [x] `POST /:id/unpublish` (admin) → set `published=false`, `reviewStatus=draft`.
- [x] `PATCH /:id` (save edits) → enforce locks, set `hasPendingChanges` when editing a published article.

## Phase 5 — Dashboard UX

- [x] Editor: disable autosave/manual save for non-admin when `in_review`; show lock banner; allow edits in `draft/changes_requested`; surface 409/423 as “locked for review”.
- [x] Buttons: Request Review (draft/changes_requested), Cancel Review (in_review), Admin Request Changes, Admin Publish/Unpublish.
- [x] Badges: show `in_review`, `changes_requested`, `pending changes` (`hasPendingChanges`).
- [x] Library: respect permissions; disable quick publish/unpublish when `in_review` for non-admin; require admin; show state badges and `hasPendingChanges` indicator.
- [x] Author controls hidden for non-owner authors (with server enforcement backing it).

## Acceptance Checklist

- [x] Owner can request review → article locks for them/other authors; admin sees it.
- [x] Admin can publish or request changes; publish makes it live; request changes unlocks and records notes.
- [x] Edits to a published article keep it visible; mark pending changes and require re-review before updates go live.
- [x] Server blocks non-admin edits during review and allows them otherwise according to state.
- [x] Dashboard reflects states/badges and honors permissions in editor and list views.
- Article organization
- Article page layout changes?
- fix captions on article page (text size smaller than body text) -- done
- sports article change to featured story -- done
- change media wiring -- done
- migrate media IDs to URL strings (articles/users) and drop media collection data -- done
- footer (copyright) (Copyright c 2026, Alec Grosswald, Editor-in-Chief, Technique) -- 2
- wire up spotify -- 3
- optimize for mobile -- 4
- TODO: start adding smaller features
- fix rich text editor font size (not storing)
- increase body text size (14pt) -- done
- remove paragraph indents, decrease article width -- done
- user table
- ad sense
- expandable rows in comments and slivers table
- opinion articles duplicates showing up
- season scoreboard sports APIs? look up
- adding user not responding to db
- big migration
