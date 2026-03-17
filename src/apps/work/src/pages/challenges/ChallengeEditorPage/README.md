# ChallengeEditorPage

## Structure

- `ChallengeEditorPage.tsx`: route-level page for create/edit challenge modes.
- `ChallengeEditorPage.tsx` also renders quick links inline with the header status in edit/view mode
  (`Review`, `Forum` when present, `Project`, and `Community`).
- `components/ChallengeEditorForm.tsx`: React Hook Form container with autosave and manual save.
- `components/*Field.tsx`: field-level components for each challenge section.
- `components/ReviewersField/*`: tabbed human/AI reviewer configuration. Human reviewers stay on the challenge form, while AI reviewer configs load/save through the review API and sync saved AI workflows back into the challenge `reviewers` array. This section is hidden for `Task` and `Marathon Match` challenges because those flows use dedicated reviewer assignment UIs.
- `ChallengeEditorPage.module.scss` and `components/ChallengeEditorForm.module.scss`: page and form layout styling.

## Validation Rules

The form uses `challengeBasicInfoSchema` from `src/apps/work/src/lib/schemas/challenge-editor.schema.ts`.

- `name`: required, max 200 chars; special and non-ASCII characters are allowed.
- `trackId`: required.
- `typeId`: required.
- `description`: required, minimum length enforced.
- `privateDescription`: optional.
- `funChallenge`: optional boolean, defaults to `false` (unchecked).
- `prizeSets`: placement prizes are required unless `funChallenge` is `true`.
- `wiproAllowed`: optional boolean, defaults to `false` (unchecked).
- `tags`: optional string array.
- `skills`: required unless billing account is listed in `SKILLS_OPTIONAL_BILLING_ACCOUNT_IDS`.
- `reviewer`: required for task challenges when `legacy.reviewType` is `INTERNAL`.
- `reviewers`: when using `Save as Draft` from `NEW` status, non-task/non-marathon challenges must include reviewer coverage for configured review phases. If required phases are configured, each phase must have at least one member reviewer with a scorecard.
- `AI review configuration`: templates and manual configs autosave separately once valid, and the AI tab becomes read-only after the challenge has submissions.

## Autosave Behavior

- Autosave is implemented via `useAutosave`.
- Delay defaults to `AUTOSAVE_DELAY_MS` (10s).
- Autosave runs when form is dirty and valid.
- Status values: `idle`, `saving`, `saved`, `error`.
- Last save time is shown in the footer.

## Field Components

- `ChallengeNameField`: text input.
- `ChallengeTrackField`: track selector from `useFetchChallengeTracks`.
- `ChallengeTypeField`: active type selector from `useFetchChallengeTypes`.
- `DesignWorkTypeField`: shown for Design + Challenge, with the legacy work-type options (`Application Front-End Design`, `Print/Presentation`, `Web Design`, `Widget or Mobile Screen Design`, `Wireframes`). The selected value is stored in challenge tags.
- `FunChallengeField`: shown for `Marathon Match` type and remains editable after creation so the form can switch between fun-challenge and standard marathon-match fields.
- `ReviewersField`: hidden for `Task` and `Marathon Match` challenges because manual reviewer assignment is handled elsewhere.
- `ChallengeDescriptionField`: public markdown spec editor.
- `ChallengePrivateDescriptionField`: optional private markdown spec editor.
- `ChallengeTagsField`: multi creatable tag picker excluding special challenge tags.
- `ChallengeSkillsField`: async multi skills picker with billing-account-based required behavior.
- `AssignedMemberField`: task-only assignee selector backed by member ids; persisted through the challenge `Submitter` resource assignment and restored from resources when task payloads omit the legacy field.
- `CopilotField`: clearable dropdown populated with copilot handles from the current project; persisted through the challenge `Copilot` resource assignment and restored from resources when draft payloads omit the legacy field.
- `CopilotFeeField`: optional copilot payment input that updates only the underlying copilot prize set, preserving placement prize edits and removing the copilot prize set when cleared so empty fees do not leave hidden validation errors.
- `ReviewTypeField`: task-only reviewer controls; enforces internal review type, requires selecting a reviewer from project members, and persists the selection through the challenge `Iterative Reviewer` resource assignment.
- `Wipro Allowed` checkbox: advanced-option toggle that maps to the challenge `wiproAllowed` API flag.
- Saved selector values may come from legacy challenge fields or challenge resources. The editor restores task `assignedMemberId`, `copilot`, and task `reviewer` from matching resource assignments first, then falls back to legacy challenge payload shapes.

## Conditional Sections

- `Prizes & Billing` is hidden when `funChallenge` is enabled.
- `Reviewers` is hidden when the selected challenge type is `Task` or `Marathon Match`.

## API Integration

- Challenge fetch: `useFetchChallenge`.
- Save create/update/delete: `createChallenge`, `patchChallenge`, `deleteChallenge`.
- Initial create refresh: after `createChallenge`, the form fetches full challenge details with `fetchChallenge` to avoid round-type regressions from sparse create responses.
- Skills search: `searchSkills`.
- Tracks fetch: `fetchChallengeTracks`.
- Markdown file uploads: `uploadChallengeAttachment`.
- AI review config CRUD: `fetchAiReviewConfigByChallenge`, `createAiReviewConfig`, `updateAiReviewConfig`, `deleteAiReviewConfig`.
- AI review templates: `fetchAiReviewTemplates`.

## Header Actions

- `Launch` is shown on the details tab for `DRAFT` challenges.
- `Cancel` is shown on the details tab for `ACTIVE` challenges.
- `Delete` is shown for existing challenges in `NEW` status and requires confirmation.
