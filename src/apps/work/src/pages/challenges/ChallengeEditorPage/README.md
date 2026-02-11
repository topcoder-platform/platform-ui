# ChallengeEditorPage

## Structure

- `ChallengeEditorPage.tsx`: route-level page for create/edit challenge modes.
- `components/ChallengeEditorForm.tsx`: React Hook Form container with autosave and manual save.
- `components/*Field.tsx`: field-level components for each challenge section.
- `ChallengeEditorPage.module.scss` and `components/ChallengeEditorForm.module.scss`: page and form layout styling.

## Validation Rules

The form uses `challengeBasicInfoSchema` from `src/apps/work/src/lib/schemas/challenge-editor.schema.ts`.

- `name`: required, max 200 chars, letters/numbers/spaces only.
- `trackId`: required.
- `typeId`: required.
- `description`: required, minimum length enforced.
- `privateDescription`: optional.
- `tags`: optional string array.
- `skills`: required unless billing account is listed in `SKILLS_OPTIONAL_BILLING_ACCOUNT_IDS`.

## Autosave Behavior

- Autosave is implemented via `useAutosave`.
- Delay defaults to `AUTOSAVE_DELAY_MS` (10s).
- Autosave runs when form is dirty and valid.
- Status values: `idle`, `saving`, `saved`, `error`.
- Last save time is shown in the footer.

## Field Components

- `ChallengeNameField`: text input with sanitization.
- `ChallengeTrackField`: track selector from `useFetchChallengeTracks`.
- `ChallengeTypeField`: active type selector from `useFetchChallengeTypes`.
- `ChallengeDescriptionField`: public markdown spec editor.
- `ChallengePrivateDescriptionField`: optional private markdown spec editor.
- `ChallengeTagsField`: multi creatable tag picker excluding special challenge tags.
- `ChallengeSkillsField`: async multi skills picker with billing-account-based required behavior.

## API Integration

- Challenge fetch: `useFetchChallenge`.
- Save create/update: `createChallenge`, `patchChallenge`.
- Skills search: `searchSkills`.
- Tracks fetch: `fetchChallengeTracks`.
- Markdown file uploads: `uploadChallengeAttachment`.
