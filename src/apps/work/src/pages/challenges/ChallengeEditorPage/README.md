# ChallengeEditorPage

## Structure

- `ChallengeEditorPage.tsx`: route-level page for create, edit, and read-only view challenge modes.
  Existing challenges keep the same `Details`, `Resources`, and `Submissions` tabs in both edit and
  view routes; view mode only makes the details tab read-only and suppresses edit-only form controls.
  Marathon Match submissions show an operator-only runner-log action that opens the ECS runner output
  returned by the marathon-match API.
  The read-only `Review` section also renders a configuration summary before the human/AI tabs so AI
  gating details remain visible even though the surrounding form fieldset is disabled.
- `ChallengeEditorPage.tsx` also renders challenge quick links in the right header action group for
  existing challenges (`Challenge`, `Review`, and `Forum` when present). In view mode it adds
  an `Edit` action only when the challenge is not completed.
- `components/ChallengeEditorForm.tsx`: React Hook Form container with autosave and manual save.
  In view mode it renders the existing challenge data in a disabled fieldset and omits save/launch
  footer actions. Manual saves from an existing `/edit` route, including trailing-slash variants,
  navigate back to the matching `/view` route after the update succeeds. When challenge detail
  revalidation returns a fresher snapshot for the same challenge id, the form rehydrates from that
  updated payload while still avoiding resets over in-progress edits, then reapplies that snapshot
  once the form becomes clean again even if the refreshed payload did not bump the challenge's
  `updated` timestamp. Local post-create draft state remains visible until a fetched challenge
  payload is available, so the create route can expand to the full editor immediately after the
  initial draft is created.
- `components/*Field.tsx`: field-level components for each challenge section.
- `components/ReviewersField/*`: tabbed human/AI review configuration. Human reviewers stay on the challenge form, while AI reviewer configs load/save through the review API and sync saved AI workflows back into the challenge `reviewers` array. Existing AI configs are reloaded once per saved challenge even if the challenge payload is temporarily missing synced AI reviewer rows, while still avoiding empty-config lookups for unsaved challenges, ordinary parent rerenders in edit mode, and same-session re-fetches right after a config is intentionally removed. Removing an AI config also detaches the synced AI workflow reviewers from the challenge. In read-only view mode the tab switcher remains clickable so users can inspect AI config details inside the disabled challenge form, and the review summary surfaces the human-review table, AI workflow details, resolved scorecard names, review flow, and estimated reviewer cost without requiring edits. Repeated human-review rows that share the same resource role now consume persisted challenge-resource assignments in row order so every assigned reviewer still appears once in the summary, and mixed legacy resource layouts continue into the generic `Reviewer` fallback pool when a phase-specific role runs out of persisted assignments. The editor hydration, editable tab, summary, and post-save reset now tolerate persisted resource rows that only expose role names, member handles, or member ids instead of the full modern payload shape, so refreshed drafts and newly saved drafts reopen with the saved reviewer assignments intact. Initial persisted-resource hydration also keeps running while the form is still in its mount-time normalization window, so internal dirty flags from compatibility fields do not block restored copilot or reviewer assignments after a full refresh. The AI-gating failure path keeps the locked state grouped under the gate so the diagram matches the legacy work-manager layout, including `AI_GATING` configs whose workflows do not explicitly mark `isGating`. On narrow screens the review-flow diagram switches to a compact portrait branch: submission stays full width, the `AI Gate` and `Locked` states sit side by side as narrower cards, the `< threshold` connector sits between those two cards, and the human-review path continues only from the gate column. When AI reviewers exist without a persisted AI screening phase, the schedule editor injects a virtual `AI Screening` row after submission phases. This `Review` section is hidden for `Task` and `Marathon Match` challenges because those flows use dedicated reviewer assignment UIs.
- `ChallengeEditorPage.module.scss` and `components/ChallengeEditorForm.module.scss`: page and form layout styling, including the grouped `Prizes & Billing` layout that keeps the challenge-prizes and copilot-fee inputs at fixed widths on larger screens, preserves whitespace to the right, and moves the billing summary underneath them.

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
- `AI review configuration`: templates and manual configs autosave separately once valid, switching a template-backed config to manual mode keeps its copied settings but clears the template link on save, and the AI tab becomes read-only after the challenge has submissions.

## Autosave Behavior

- Autosave is implemented via `useAutosave`.
- Delay defaults to `AUTOSAVE_DELAY_MS` (10s).
- Autosave runs when form is dirty and valid, except in read-only view mode.
- Autosave keeps the current editor values in place after patch responses so in-flight typing is
  not replaced by challenge-api normalized content.
- Status values: `idle`, `saving`, `saved`, `error`.
- Last save time is shown in the footer.

## Field Components

- `ChallengeNameField`: text input.
- `ChallengeTrackField`: track selector from `useFetchChallengeTracks`.
- `ChallengeTypeField`: active type selector from `useFetchChallengeTypes`, excluding `Topgear Task` because that flow is not launchable from the work app editor. When the selected track is Design or QA, it also hides `Marathon Match` to match the legacy work-manager create flow and clears any now-invalid preselection.
- `ChallengeScheduleSection`: schedule editor for challenge start and phase dates. It keeps the detected timezone above the controls, renders the `Start Date` label with the `Scheduled` and `Immediately` start-mode radios aligned to the end of that header row above the input with a green selected state, persists the selected start mode in challenge metadata so saved `/edit` and `/view` routes reopen with the correct radio state, recalculates root phase dates when the challenge start changes, honors a completed predecessor phase's actual end date when deriving successor schedule rows, and keeps completed phases' end-date and duration controls locked to match legacy work-manager behavior. `Task` challenges hide this editable section across create, edit, and read-only view routes to match legacy work-manager behavior.
- `DesignWorkTypeField`: shown for Design + Challenge, with the legacy work-type options (`Application Front-End Design`, `Print/Presentation`, `Web Design`, `Widget or Mobile Screen Design`, `Wireframes`). The selected value is stored in challenge tags.
- `FunChallengeField`: shown for `Marathon Match` type and remains editable after creation so the form can switch between fun-challenge and standard marathon-match fields.
- `ReviewersField`: hidden for `Task` and `Marathon Match` challenges because manual reviewer assignment is handled elsewhere. On the human-review tab, each manual reviewer card keeps the legacy review-type dropdown, backfills missing legacy review-type values from the matching default reviewer or iterative-review phase fallback, and each manual reviewer phase selector hides registration/submission phases and any phase already assigned on another manual reviewer card while preserving the card's current selection. Manual reviewer counts are capped before rendering member assignment controls so closed public opportunities cannot create an unbounded number of member selectors.
- `Submission Settings`: shown for Design `Challenge` and Design `First2Finish` types, and contains the final-deliverables, stock-art, and submission-visibility controls.
- `FinalDeliverablesField`: design-challenge file-type editor that persists the legacy `fileTypes` metadata payload used on challenge draft pages.
- `MaximumSubmissionsField`: non-visual compatibility field that rewrites the legacy `submissionLimit` metadata to the unlimited-only payload so design challenges no longer expose submission-cap controls. It defers dirtying that automatic normalization until the editor finishes its initial resource hydration, including the first render after asynchronously loaded challenge details arrive, which preserves copilot restoration before autosave/manual-save starts treating the metadata rewrite as a user change.
- `ChallengeDescriptionField`: public markdown spec editor.
- `ChallengePrivateDescriptionField`: optional private markdown spec editor.
- `TermsField`: advanced-option multi-select for challenge terms. The create route seeds the standard Topcoder terms entry automatically once the terms list loads, including immediately after the first draft-creation step assigns a challenge id, so the editor matches legacy work-manager defaults while still allowing the NDA toggle to add or remove the NDA term separately.
- `ChallengeTagsField`: multi creatable tag picker excluding special challenge tags.
- `ChallengeSkillsField`: async multi skills picker with billing-account-based required behavior.
- `ChallengePrizesField`: placement-prize editor with an inline USD/POINTS selector that uses the challenge editor's green selected state, keeps the `Challenge Prizes` header on one line, and stays right-aligned above the fixed-width prize inputs. Each row always shows a numbered `Prize X` label, multi-prize setups allow tied lower placements while still rejecting prize increases for lower places, older payloads that omit the placement set are hydrated on demand, and only removable rows render the delete action so the first prize stays aligned with the selector.
- `AssignedMemberField`: task-only assignee selector backed by member ids; persisted through the challenge `Submitter` resource assignment and restored from resources when task payloads omit the legacy field.
- `CopilotField`: clearable dropdown populated with copilot handles from the current project; persisted through the challenge `Copilot` resource assignment and restored from resources when draft payloads omit the legacy field. Persisted selections are matched case-insensitively so refreshes still show the saved copilot even when the resource payload and project-member option list disagree on handle casing, and member-id-only copilot resources are normalized back to handles during refresh hydration. Save-time form resets also reload the persisted copilot resource before the editor reopens the saved draft, so sparse challenge responses do not blank the field. When a refreshed draft still carries a legacy member-id-only copilot resource, the next save deletes that stale resource before writing the canonical handle-based assignment so the challenge does not keep duplicate copilot rows. The initial `New` draft-creation step also saves any selected copilot assignment before the editor resets from fetched challenge data, so the basic-information selection survives the transition into the full draft form. A copilot is required whenever the copilot fee is greater than 0, and that rule is enforced by form validation before save or launch actions run.
- `CopilotFeeField`: optional copilot payment input that updates only the underlying copilot prize set, preserving placement prize edits and removing the copilot prize set when cleared so empty fees do not leave hidden validation errors.
- `ChallengeFeeField`: derived summary value that uses the challenge billing markup together with the current prize and reviewer estimates so draft saves do not fall back to a stale `challengeFee` snapshot. It uses the same reviewer-cost estimate shown in `Review cost` and always renders two decimal places. For point-based challenges, the derived fee only uses the USD-denominated billable total so point prizes do not inflate the dollar billing summary. When the challenge payload does not yet include billing, or challenge-api returns the draft's billing markup as `0` for the same project billing account, the editor hydrates billing-account id and markup from the parent project billing account so draft pages still show the correct fee.
- `ChallengeTotalField`: derived billing summary that always renders a dollar total and adds the current challenge fee on top of the billable subtotal from placement prizes, copilot fee, and estimated review cost. For point-based challenges it matches legacy work-manager behavior by counting only the USD-denominated copilot payment and its derived fee, excluding point prizes from the monetary total.
- `Billing Account Id`: read-only `Prizes & Billing` summary value that shows the challenge billing-account id, falling back to the parent project billing account when the saved challenge payload has not populated billing yet.
- `Payment Creator`: read-only `Prizes & Billing` summary value that shows the challenge creator handle. If the challenge `createdBy` value is a numeric user id, the editor resolves it through the member profile API so later viewers see the original creator handle instead of the raw id.
- `ReviewTypeField`: task-only reviewer controls; enforces internal review type, allows searching any community reviewer handle, and persists the selection through the challenge `Iterative Reviewer` resource assignment.
- `Wipro Allowed` checkbox: advanced-option toggle that maps to the challenge `wiproAllowed` API flag. Only the checkbox control toggles the value so nearby text clicks do not change it accidentally.
- Saved selector values may come from legacy challenge fields or challenge resources. The editor restores task `assignedMemberId`, `copilot`, and task `reviewer` from matching resource assignments first, falls back to role-name matches when resource rows are missing role ids, and then falls back to legacy challenge payload shapes.
- Task-only assignee and reviewer handling follows the resolved challenge type whenever type metadata is present. Persisted task flags are only a fallback for incomplete legacy payloads that omit the type identity entirely.

## Conditional Sections

- `Prizes & Billing` is hidden when `funChallenge` is enabled.
- `Review` is hidden when the selected challenge type is `Task` or `Marathon Match`.

## API Integration

- Challenge fetch: `useFetchChallenge`.
- Challenge detail remount refresh: `useFetchChallenge` disables SWR request deduping for
  challenge details so reopening a challenge view right after a save still triggers a fresh
  challenge-api-v6 fetch instead of reusing stale cached detail data, and the editor form
  reapplies that refreshed same-id snapshot once it arrives.
- Save create/update/delete: `createChallenge`, `patchChallenge`, `deleteChallenge`.
- Initial create refresh: after `createChallenge`, the form fetches full challenge details with `fetchChallenge` to avoid round-type regressions from sparse create responses and to surface the generated forum link for challenge types that provision a discussion on create.
- Skills search: `searchSkills`.
- Tracks fetch: `fetchChallengeTracks`.
- Markdown file uploads: `uploadChallengeAttachment`.
- AI review config CRUD: `fetchAiReviewConfigByChallenge`, `createAiReviewConfig`, `updateAiReviewConfig`, `deleteAiReviewConfig`.
- AI review templates: `fetchAiReviewTemplates`.

## Header Actions

- `Launch` is shown on the details tab for `DRAFT` challenges in the header for both view and edit routes, and again in the footer beside `Save Challenge` while editing.
- The work app blocks launch attempts when the parent project billing account is inactive, expired, or has insufficient remaining funds, matching the legacy work-manager launch restriction.
- Task challenges cannot be launched until `Assigned Member` is set, which ensures the task is assigned before it becomes publicly visible.
- After the first successful save from `NEW` to `DRAFT`, the editor updates the launch affordance immediately so the user can launch without reloading.
- After the initial create request succeeds on the `/projects/:projectId/challenges/new` route, the
  page header immediately treats that record as an existing `NEW` challenge so the status pill and
  `Delete` action are available before the route transitions to the regular edit page.
- `Cancel` is shown on the details tab for existing `DRAFT` challenges on both view and edit routes, and for `ACTIVE` challenges while editing. It uses the shared large secondary button treatment so it matches the footer action styling.
- `Mark Complete` is shown on the details tab for existing `ACTIVE` task challenges in both view and edit routes when exactly one assignee can be resolved from the challenge submitter resources. It mirrors the legacy work-manager flow by confirming the task prize and assignee, patching the challenge to `COMPLETED`, and saving that assignee as the sole winner. The button remains hidden for copilots assigned to their own task, and it reuses the same shared large secondary styling as `Cancel`.
- `Delete` is shown for existing challenges in `NEW` status and requires confirmation.
- `Edit` is shown in read-only view mode for existing challenges unless the challenge status is `COMPLETED` or any `CANCELLED*` endpoint status, and it uses the same shared large secondary button treatment as the other header actions.
