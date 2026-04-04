# ChallengeEditorPage

## Structure

- `ChallengeEditorPage.tsx`: route-level page for create, edit, and read-only view challenge modes.
  Existing challenges keep the same `Details`, `Resources`, and `Submissions` tabs in both edit and
  view routes; view mode only makes the details tab read-only and suppresses edit-only form controls.
- `ChallengeEditorPage.tsx` also renders challenge quick links in the right header action group for
  existing challenges (`Challenge`, `Review`, and `Forum` when present). In view mode it adds
  an `Edit` action only when the challenge is not completed.
- `components/ChallengeEditorForm.tsx`: React Hook Form container with autosave and manual save.
  In view mode it renders the existing challenge data in a disabled fieldset and omits save/launch
  footer actions.
- `components/*Field.tsx`: field-level components for each challenge section.
- `components/ReviewersField/*`: tabbed human/AI review configuration. Human reviewers stay on the challenge form, while AI reviewer configs load/save through the review API and sync saved AI workflows back into the challenge `reviewers` array. Existing AI configs are reloaded only when the challenge already has synced AI reviewer entries or the challenge changes, which avoids empty-config lookups on new challenges and prevents ordinary parent rerenders from refetching the same config in edit mode. Removing an AI config also detaches the synced AI workflow reviewers from the challenge. When AI reviewers exist without a persisted AI screening phase, the schedule editor injects a virtual `AI Screening` row after submission phases. This `Review` section is hidden for `Task` and `Marathon Match` challenges because those flows use dedicated reviewer assignment UIs.
- `ChallengeEditorPage.module.scss` and `components/ChallengeEditorForm.module.scss`: page and form layout styling, including the grouped `Prizes & Billing` layout that keeps the editable inputs together at fixed widths on larger screens and moves the billing summary underneath them.

## Validation Rules

The form uses `challengeBasicInfoSchema` from `src/apps/work/src/lib/schemas/challenge-editor.schema.ts`.

- `name`: required, max 200 chars; special and non-ASCII characters are allowed.
- `trackId`: required.
- `typeId`: required.
- `description`: required, minimum length enforced.
- `privateDescription`: optional.
- `funChallenge`: optional boolean, defaults to `false` (unchecked).
- `prizeSets`: placement prizes are required unless `funChallenge` is `true`.
- `assignedMemberId`: optional while drafting, but required before launching a `Task` challenge so the active task is scoped to its assignee instead of becoming publicly registrable.
- `wiproAllowed`: optional boolean, defaults to `false` (unchecked).
- `tags`: optional string array.
- `skills`: required unless billing account is listed in `SKILLS_OPTIONAL_BILLING_ACCOUNT_IDS`.
- `reviewer`: optional for task challenges.
- `reviewers`: when using `Save as Draft` from `NEW` status, non-task/non-marathon challenges must include reviewer coverage for configured review phases. If required phases are configured, each phase must have at least one member reviewer with a scorecard.
- `AI review configuration`: templates and manual configs autosave separately once valid, and the AI tab becomes read-only after the challenge has submissions.

## Autosave Behavior

- Autosave is implemented via `useAutosave`.
- Delay defaults to `AUTOSAVE_DELAY_MS` (10s).
- Autosave runs when form is dirty and valid, except in read-only view mode.
- Status values: `idle`, `saving`, `saved`, `error`.
- Last save time is shown in the footer.

## Field Components

- `ChallengeNameField`: text input.
- `ChallengeTrackField`: track selector from `useFetchChallengeTracks`.
- `ChallengeTypeField`: active type selector from `useFetchChallengeTypes`, excluding `Topgear Task` because that flow is not launchable from the work app editor. When the selected track is Design or QA, it also hides `Marathon Match` to match the legacy work-manager create flow and clears any now-invalid preselection.
- `ChallengeScheduleSection`: schedule editor for challenge start and phase dates. It keeps the detected timezone above the controls, renders the `Start Date` label and the `Scheduled` and `Immediately` start-mode radios on the same header row above the input with a green selected state, and recalculates root phase dates when the challenge start changes.
- `DesignWorkTypeField`: shown for Design + Challenge, with the legacy work-type options (`Application Front-End Design`, `Print/Presentation`, `Web Design`, `Widget or Mobile Screen Design`, `Wireframes`). The selected value is stored in challenge tags.
- `FunChallengeField`: shown for `Marathon Match` type and remains editable after creation so the form can switch between fun-challenge and standard marathon-match fields.
- `ReviewersField`: hidden for `Task` and `Marathon Match` challenges because manual reviewer assignment is handled elsewhere. On the human-review tab, each manual reviewer card keeps the legacy review-type dropdown and each manual reviewer phase selector hides registration/submission phases and any phase already assigned on another manual reviewer card, while preserving the card's current selection.
- `Submission Settings`: shown for Design `Challenge` and Design `First2Finish` types, and contains the final-deliverables, stock-art, submission-visibility, and submission-limit controls.
- `FinalDeliverablesField`: design-challenge file-type editor that persists the legacy `fileTypes` metadata payload used on challenge draft pages.
- `ChallengeDescriptionField`: public markdown spec editor.
- `ChallengePrivateDescriptionField`: optional private markdown spec editor.
- `TermsField`: advanced-option multi-select for challenge terms. The create route seeds the standard Topcoder terms entry automatically once the terms list loads, including immediately after the first draft-creation step assigns a challenge id, so the editor matches legacy work-manager defaults while still allowing the NDA toggle to add or remove the NDA term separately.
- `ChallengeTagsField`: multi creatable tag picker excluding special challenge tags.
- `ChallengeSkillsField`: async multi skills picker with billing-account-based required behavior.
- `ChallengePrizesField`: placement-prize editor with an inline USD/POINTS selector, descending-value validation for multi-prize setups, create-on-demand placement prize-set hydration when older payloads omit the placement set, and a multi-prize layout that keeps the first row stretched instead of reserving blank space for the delete action.
- `AssignedMemberField`: task-only assignee selector backed by member ids; persisted through the challenge `Submitter` resource assignment and restored from resources when task payloads omit the legacy field.
- `CopilotField`: clearable dropdown populated with copilot handles from the current project; persisted through the challenge `Copilot` resource assignment and restored from resources when draft payloads omit the legacy field. The initial `New` draft-creation step also saves any selected copilot assignment before the editor resets from fetched challenge data, so the basic-information selection survives the transition into the full draft form. A copilot is required whenever the copilot fee is greater than 0, and that rule is enforced by form validation before save or launch actions run.
- `CopilotFeeField`: optional copilot payment input that updates only the underlying copilot prize set, preserving placement prize edits and removing the copilot prize set when cleared so empty fees do not leave hidden validation errors.
- `ChallengeFeeField`: derived summary value that uses the challenge billing markup together with the current prize and reviewer estimates so draft saves do not fall back to a stale `challengeFee` snapshot. For point-based challenges, the derived fee only uses the USD-denominated billable total so point prizes do not inflate the dollar billing summary. When the challenge payload does not yet include billing, or challenge-api returns the draft's billing markup as `0` for the same project billing account, the editor hydrates billing-account id and markup from the parent project billing account so draft pages still show the correct fee.
- `ChallengeTotalField`: derived billing summary that always renders a dollar total. For point-based challenges it matches legacy work-manager behavior by counting only the USD-denominated copilot payment, excluding point prizes from the monetary total.
- `Billing Account Id`: read-only advanced-option display that shows the challenge billing-account id, falling back to the parent project billing account when the saved challenge payload has not populated billing yet.
- `ReviewTypeField`: task-only reviewer controls; enforces internal review type, allows searching any community reviewer handle, and persists the selection through the challenge `Iterative Reviewer` resource assignment.
- `Wipro Allowed` checkbox: advanced-option toggle that maps to the challenge `wiproAllowed` API flag. Only the checkbox control toggles the value so nearby text clicks do not change it accidentally.
- Saved selector values may come from legacy challenge fields or challenge resources. The editor restores task `assignedMemberId`, `copilot`, and task `reviewer` from matching resource assignments first, then falls back to legacy challenge payload shapes.
- Task-only assignee and reviewer handling follows the resolved challenge type whenever type metadata is present. Persisted task flags are only a fallback for incomplete legacy payloads that omit the type identity entirely.

## Conditional Sections

- `Prizes & Billing` is hidden when `funChallenge` is enabled.
- `Review` is hidden when the selected challenge type is `Task` or `Marathon Match`.

## API Integration

- Challenge fetch: `useFetchChallenge`.
- Challenge detail remount refresh: `useFetchChallenge` disables SWR request deduping for
  challenge details so reopening a challenge view right after a save still triggers a fresh
  challenge-api-v6 fetch instead of reusing stale cached detail data.
- Save create/update/delete: `createChallenge`, `patchChallenge`, `deleteChallenge`.
- Initial create refresh: after `createChallenge`, the form fetches full challenge details with `fetchChallenge` to avoid round-type regressions from sparse create responses and to surface the generated forum link for challenge types that provision a discussion on create.
- Skills search: `searchSkills`.
- Tracks fetch: `fetchChallengeTracks`.
- Markdown file uploads: `uploadChallengeAttachment`.
- AI review config CRUD: `fetchAiReviewConfigByChallenge`, `createAiReviewConfig`, `updateAiReviewConfig`, `deleteAiReviewConfig`.
- AI review templates: `fetchAiReviewTemplates`.

## Header Actions

- `Launch` is shown on the details tab for `DRAFT` challenges in the header for both view and edit routes, and again in the footer beside `Save Challenge` while editing.
- Task challenges cannot be launched until `Assigned Member` is set, which ensures the task is assigned before it becomes publicly visible.
- After the first successful save from `NEW` to `DRAFT`, the editor updates the launch affordance immediately so the user can launch without reloading.
- After the initial create request succeeds on the `/projects/:projectId/challenges/new` route, the
  page header immediately treats that record as an existing `NEW` challenge so the status pill and
  `Delete` action are available before the route transitions to the regular edit page.
- `Cancel` is shown on the details tab for `DRAFT` and `ACTIVE` challenges and uses the shared large secondary button treatment so it matches the footer action styling.
- `Mark Complete` is shown beside `Cancel` for `ACTIVE` task challenges when exactly one assignee can be resolved from the challenge submitter resources. It mirrors the legacy work-manager flow by confirming the task prize and assignee, patching the challenge to `COMPLETED`, and saving that assignee as the sole winner. The button remains hidden for copilots assigned to their own task, and it reuses the same shared large secondary styling as `Cancel`.
- `Delete` is shown for existing challenges in `NEW` status and requires confirmation.
- `Edit` is shown in read-only view mode for existing challenges unless the challenge status is `COMPLETED`.
