import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { BaseModal, Button } from '~/libs/ui'

import {
    ChallengePhase,
    CreateMarathonMatchConfigInput,
    MarathonMatchConfig,
    MarathonMatchConfigType,
    MarathonMatchDefaults,
    MarathonMatchPhaseConfig,
    MarathonMatchScoreDirection,
    MarathonMatchTester,
    MarathonMatchTesterSummary,
    MarathonMatchTestSubmissionResponse,
    MarathonMatchTestSubmissionStatusResponse,
    UpdateMarathonMatchConfigInput,
} from '../../../../../lib/models'
import {
    createMarathonMatchConfig,
    fetchMarathonMatchConfig,
    fetchMarathonMatchDefaults,
    fetchMarathonMatchTestSubmissionStatus,
    fetchTester,
    fetchTesters,
    rerunMarathonMatchScores,
    updateMarathonMatchConfig,
    uploadMarathonMatchTestSubmission,
} from '../../../../../lib/services'
import {
    formatDateTime,
    showErrorToast,
    showInfoToast,
    showSuccessToast,
} from '../../../../../lib/utils'

import { TesterModal } from './TesterModal'
import styles from './MarathonMatchScorerSection.module.scss'

const DEFAULT_SCORER_NAME = 'Marathon Match Scorer'
const DEFAULT_SCORE_DIRECTION = 'MAXIMIZE'
const POLL_INTERVAL_MS = 5000
const TEST_SUBMISSION_TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED'])
const PHASE_LABELS = {
    example: 'Example',
    provisional: 'Provisional',
    system: 'System',
} as const
const PHASE_CONFIG_TYPES = {
    example: 'EXAMPLE',
    provisional: 'PROVISIONAL',
    system: 'SYSTEM',
} as const
const PHASE_DEFAULTS = {
    example: {
        numberOfTests: 10,
        phaseName: 'Submission',
        startSeed: 1,
    },
    provisional: {
        numberOfTests: 20,
        phaseName: 'Submission',
        startSeed: 753376358,
    },
    system: {
        numberOfTests: 50,
        phaseName: 'Review',
        startSeed: 1651246628,
    },
} as const
const SCORE_DIRECTION_OPTIONS: Array<{
    label: string
    value: MarathonMatchScoreDirection
}> = [
    {
        label: 'Maximize',
        value: 'MAXIMIZE',
    },
    {
        label: 'Minimize',
        value: 'MINIMIZE',
    },
]

type PhaseDraftKey = keyof typeof PHASE_LABELS

interface NumericInputState {
    compileTimeout: string
    exampleNumberOfTests: string
    exampleStartSeed: string
    provisionalNumberOfTests: string
    provisionalStartSeed: string
    systemNumberOfTests: string
    systemStartSeed: string
    testTimeout: string
}

interface PhaseValidationErrors {
    numberOfTests?: string
    phaseId?: string
    startSeed?: string
}

interface ValidationErrors {
    compileTimeout?: string
    example: PhaseValidationErrors
    reviewScorecardId?: string
    taskDefinitionName?: string
    taskDefinitionVersion?: string
    testTimeout?: string
    testerId?: string
    provisional: PhaseValidationErrors
    system: PhaseValidationErrors
}

interface TesterGroup {
    name: string
    testers: MarathonMatchTesterSummary[]
}

interface PhaseOption {
    label: string
    value: string
}

interface TestSubmissionPhaseOption {
    label: string
    value: MarathonMatchConfigType
}

type TestSubmissionResultState =
    | MarathonMatchTestSubmissionResponse
    | MarathonMatchTestSubmissionStatusResponse
    | undefined

/**
 * Normalizes a validation submission status for comparisons and display.
 * @param status Raw status returned by marathon-match-api.
 * @returns Uppercase status text, or `UNKNOWN` when absent.
 * Used by validation-run polling and modal rendering.
 */
function normalizeTestSubmissionStatus(status?: string): string {
    const normalizedStatus = status?.trim()
        .toUpperCase()

    return normalizedStatus || 'UNKNOWN'
}

/**
 * Checks whether validation submission polling should stop.
 * @param status Raw status returned by marathon-match-api.
 * @returns True when the validation run reached a terminal state.
 * Used by `pollTestSubmissionStatus` after each status response.
 */
function isTerminalTestSubmissionStatus(status?: string): boolean {
    return TEST_SUBMISSION_TERMINAL_STATUSES.has(normalizeTestSubmissionStatus(status))
}

/**
 * Formats a numeric score for the validation result modal.
 * @param score Optional final aggregate score.
 * @returns Display-ready score text.
 * Used by `renderTestSubmissionResultModal`.
 */
function formatTestSubmissionScore(score?: number): string {
    return typeof score === 'number' && Number.isFinite(score)
        ? score.toLocaleString(undefined, { maximumFractionDigits: 6 })
        : 'Not available'
}

/**
 * Formats a validation-run progress value as a percentage.
 * @param progress Optional progress value from 0 to 1.
 * @returns Display-ready progress text.
 * Used by inline validation status and the result modal.
 */
function formatTestSubmissionProgress(progress?: number): string {
    if (typeof progress !== 'number' || !Number.isFinite(progress)) {
        return 'Pending'
    }

    return `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`
}

/**
 * Formats completed/total/failed testcase counts.
 * @param result Validation run status response with optional testcase counters.
 * @returns Compact testcase count summary.
 * Used by `renderTestSubmissionResultModal`.
 */
function formatTestSubmissionTests(result: MarathonMatchTestSubmissionStatusResponse): string {
    const completed = result.completedTests ?? 0
    const total = result.totalTests ?? 0
    const failed = result.failedTests ?? 0

    if (!total) {
        return failed
            ? `${failed} failed`
            : 'Not available'
    }

    return `${completed}/${total} complete${failed ? `, ${failed} failed` : ''}`
}

/**
 * Formats validation-run metadata for a read-only modal preview.
 * @param value Optional metadata object or array returned by the scorer.
 * @returns Pretty JSON text, or an empty string when no metadata exists.
 * Used by `renderJsonPreview`.
 */
function formatJsonPreview(value?: Record<string, unknown> | Record<string, unknown>[]): string {
    if (!value) {
        return ''
    }

    return JSON.stringify(value, undefined, 2)
}

/**
 * Checks whether a validation result includes full status fields.
 * @param result Upload response or status response stored in component state.
 * @returns True when the response has final/polling fields from the status endpoint.
 * Used before rendering the validation result modal.
 */
function isTestSubmissionStatusResponse(
    result: MarathonMatchTestSubmissionResponse | MarathonMatchTestSubmissionStatusResponse | undefined,
): result is MarathonMatchTestSubmissionStatusResponse {
    return !!result && 'fileName' in result
}

interface PhaseConfigCardProps {
    errors: PhaseValidationErrors
    label: string
    numberOfTestsValue: string
    onNumberOfTestsChange: (event: ChangeEvent<HTMLInputElement>) => void
    onPhaseChange: (event: ChangeEvent<HTMLSelectElement>) => void
    onStartSeedChange: (event: ChangeEvent<HTMLInputElement>) => void
    options: PhaseOption[]
    phaseId: string
    startSeedValue: string
}

interface LoadTesterByIdOptions {
    clearSelectionOnFailure?: boolean
    setBlockingErrorOnFailure?: boolean
    showErrorToast?: boolean
}

interface CompilationErrorModalProps {
    onClose: () => void
    tester: MarathonMatchTester
}

/**
 * Renders the inputs for a single marathon match phase configuration.
 * Used by `MarathonMatchScorerSection` for example, provisional, and system phases.
 */
const PhaseConfigCard: FC<PhaseConfigCardProps> = (props: PhaseConfigCardProps) => (
    <div className={styles.phaseCard}>
        <div className={styles.sectionHeader}>
            <h4>{props.label}</h4>
            <p>
                Choose the challenge phase and execution settings for the
                {' '}
                {props.label.toLowerCase()}
                {' '}
                run.
            </p>
        </div>

        <div className={styles.phaseGrid}>
            <label className={styles.fieldGroup}>
                <span>Phase</span>
                <select
                    className={classNames(
                        styles.selectInput,
                        !props.phaseId && styles.selectPlaceholder,
                    )}
                    onChange={props.onPhaseChange}
                    value={props.phaseId}
                >
                    <option value=''>Select phase</option>
                    {props.options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {props.errors.phaseId
                    ? <small className={styles.fieldError}>{props.errors.phaseId}</small>
                    : undefined}
            </label>

            <label className={styles.fieldGroup}>
                <span>Start Seed</span>
                <input
                    inputMode='numeric'
                    onChange={props.onStartSeedChange}
                    type='number'
                    value={props.startSeedValue}
                />
                {props.errors.startSeed
                    ? <small className={styles.fieldError}>{props.errors.startSeed}</small>
                    : undefined}
            </label>

            <label className={styles.fieldGroup}>
                <span>Number of Tests</span>
                <input
                    inputMode='numeric'
                    min={1}
                    onChange={props.onNumberOfTestsChange}
                    type='number'
                    value={props.numberOfTestsValue}
                />
                {props.errors.numberOfTests
                    ? <small className={styles.fieldError}>{props.errors.numberOfTests}</small>
                    : undefined}
            </label>
        </div>
    </div>
)

/**
 * Displays saved scorer compilation diagnostics for a failed tester build.
 * @param props Modal visibility, close action, and failed tester details.
 * @returns The modal body used by `MarathonMatchScorerSection` for FAILED compilation status.
 */
const CompilationErrorModal: FC<CompilationErrorModalProps> = (
    props: CompilationErrorModalProps,
) => (
    <BaseModal
        open
        onClose={props.onClose}
        size='lg'
        title='Compilation Errors'
        buttons={(
            <div className={styles.modalActions}>
                <Button
                    label='Close'
                    onClick={props.onClose}
                    primary
                    type='button'
                />
            </div>
        )}
    >
        <div className={styles.modalContent}>
            <div className={styles.compilationErrorMeta}>
                <strong>
                    {props.tester.name}
                    {' '}
                    v
                    {props.tester.version}
                </strong>
                <span>{props.tester.className}</span>
            </div>
            <pre className={styles.compilationErrorOutput}>
                {props.tester.compilationError || 'Compilation failed without an error message.'}
            </pre>
        </div>
    </BaseModal>
)

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

/**
 * Builds a blocking tester-resolution error message for unresolved tester IDs.
 * Used when scorer actions must stay disabled until tester details load successfully.
 */
function buildTesterLoadErrorMessage(error: unknown): string {
    const baseMessage = getErrorMessage(error, 'Failed to load scorer details')

    return `${baseMessage}. Save and launch stay disabled until scorer details `
        + 'load successfully or you choose a different scorer.'
}

function normalizePhaseName(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

function getChallengePhaseId(phase: ChallengePhase): string {
    if (phase.phaseId) {
        return phase.phaseId
    }

    return phase.id || ''
}

function compareVersionStrings(left: string, right: string): number {
    const leftParts = left.split(/[.-]/)
    const rightParts = right.split(/[.-]/)
    const maxLength = Math.max(leftParts.length, rightParts.length)

    for (let index = 0; index < maxLength; index += 1) {
        const leftPart = leftParts[index] || '0'
        const rightPart = rightParts[index] || '0'
        const leftNumber = Number(leftPart)
        const rightNumber = Number(rightPart)

        if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
            if (leftNumber !== rightNumber) {
                return leftNumber - rightNumber
            }
        } else if (leftPart !== rightPart) {
            return leftPart.localeCompare(rightPart)
        }
    }

    return 0
}

function parseIntegerInput(value: string): number {
    const trimmedValue = value.trim()

    if (!trimmedValue || !/^-?\d+$/.test(trimmedValue)) {
        return Number.NaN
    }

    return Number(trimmedValue)
}

function getPreferredPhaseId(phases: ChallengePhase[], phaseName: string): string {
    const matchedPhase = phases.find(phase => normalizePhaseName(phase.name) === normalizePhaseName(phaseName))

    if (matchedPhase) {
        return getChallengePhaseId(matchedPhase)
    }

    return phases[0]
        ? getChallengePhaseId(phases[0])
        : ''
}

/**
 * Maps a persisted scorer phase selection back to the canonical challenge `phaseId`.
 * Accepts both canonical `phase.phaseId` and legacy challenge-phase `phase.id`.
 */
function normalizeConfiguredPhaseId(
    phaseId: string | undefined,
    phases: ChallengePhase[],
): string {
    const normalizedPhaseId = phaseId?.trim() || ''

    if (!normalizedPhaseId) {
        return ''
    }

    const matchedPhase = phases.find(phase => (
        getChallengePhaseId(phase) === normalizedPhaseId
        || phase.id?.trim() === normalizedPhaseId
    ))

    return matchedPhase
        ? getChallengePhaseId(matchedPhase)
        : normalizedPhaseId
}

/**
 * Normalizes a single scorer phase draft to use the canonical challenge `phaseId`.
 * Leaves undefined phase configs untouched.
 */
function normalizePhaseDraft(
    phaseConfig: MarathonMatchPhaseConfig | undefined,
    phases: ChallengePhase[],
): MarathonMatchPhaseConfig | undefined {
    if (!phaseConfig) {
        return phaseConfig
    }

    const normalizedPhaseId = normalizeConfiguredPhaseId(phaseConfig.phaseId, phases)

    return normalizedPhaseId === phaseConfig.phaseId
        ? phaseConfig
        : {
            ...phaseConfig,
            phaseId: normalizedPhaseId,
        }
}

/**
 * Normalizes all scorer phase selections in the current draft to canonical challenge `phaseId` values.
 * Used after loading challenge phases so legacy saved ids still render and resave correctly.
 */
function normalizeDraftPhaseSelections(
    draft: UpdateMarathonMatchConfigInput,
    phases: ChallengePhase[],
): UpdateMarathonMatchConfigInput {
    return {
        ...draft,
        example: normalizePhaseDraft(draft.example, phases),
        provisional: normalizePhaseDraft(draft.provisional, phases),
        system: normalizePhaseDraft(draft.system, phases),
    }
}

function createPhaseDraft(
    phaseKey: PhaseDraftKey,
    phaseId?: string,
): MarathonMatchPhaseConfig {
    return {
        configType: PHASE_CONFIG_TYPES[phaseKey],
        numberOfTests: PHASE_DEFAULTS[phaseKey].numberOfTests,
        phaseId: phaseId || '',
        startSeed: PHASE_DEFAULTS[phaseKey].startSeed,
    }
}

function buildDefaultDraft(
    defaults: MarathonMatchDefaults,
    phases: ChallengePhase[],
): UpdateMarathonMatchConfigInput {
    return {
        active: true,
        compileTimeout: defaults.compileTimeout,
        example: createPhaseDraft(
            'example',
            getPreferredPhaseId(phases, PHASE_DEFAULTS.example.phaseName),
        ),
        name: DEFAULT_SCORER_NAME,
        provisional: createPhaseDraft(
            'provisional',
            getPreferredPhaseId(phases, PHASE_DEFAULTS.provisional.phaseName),
        ),
        relativeScoringEnabled: true,
        reviewScorecardId: defaults.reviewScorecardId,
        scoreDirection: DEFAULT_SCORE_DIRECTION,
        system: createPhaseDraft(
            'system',
            getPreferredPhaseId(phases, PHASE_DEFAULTS.system.phaseName),
        ),
        taskDefinitionName: defaults.taskDefinitionName,
        taskDefinitionVersion: defaults.taskDefinitionVersion,
        testerId: '',
        testTimeout: defaults.testTimeout,
    }
}

function mapConfigToDraft(
    config: MarathonMatchConfig,
): UpdateMarathonMatchConfigInput {
    return {
        active: config.active,
        compileTimeout: config.compileTimeout,
        example: config.example || undefined,
        name: config.name,
        provisional: config.provisional || undefined,
        relativeScoringEnabled: config.relativeScoringEnabled,
        reviewScorecardId: config.reviewScorecardId,
        scoreDirection: config.scoreDirection,
        system: config.system || undefined,
        taskDefinitionName: config.taskDefinitionName,
        taskDefinitionVersion: config.taskDefinitionVersion,
        testerId: config.testerId,
        testTimeout: config.testTimeout,
    }
}

function buildNumericInputState(
    draft: UpdateMarathonMatchConfigInput,
): NumericInputState {
    return {
        compileTimeout: Number.isFinite(Number(draft.compileTimeout))
            ? String(draft.compileTimeout)
            : '',
        exampleNumberOfTests: Number.isFinite(Number(draft.example?.numberOfTests))
            ? String(draft.example?.numberOfTests)
            : '',
        exampleStartSeed: Number.isFinite(Number(draft.example?.startSeed))
            ? String(draft.example?.startSeed)
            : '',
        provisionalNumberOfTests: Number.isFinite(Number(draft.provisional?.numberOfTests))
            ? String(draft.provisional?.numberOfTests)
            : '',
        provisionalStartSeed: Number.isFinite(Number(draft.provisional?.startSeed))
            ? String(draft.provisional?.startSeed)
            : '',
        systemNumberOfTests: Number.isFinite(Number(draft.system?.numberOfTests))
            ? String(draft.system?.numberOfTests)
            : '',
        systemStartSeed: Number.isFinite(Number(draft.system?.startSeed))
            ? String(draft.system?.startSeed)
            : '',
        testTimeout: Number.isFinite(Number(draft.testTimeout))
            ? String(draft.testTimeout)
            : '',
    }
}

function buildPhaseValidationErrors(
    label: string,
    phaseConfig: MarathonMatchPhaseConfig | undefined,
): PhaseValidationErrors {
    const errors: PhaseValidationErrors = {}

    if (!phaseConfig?.phaseId?.trim()) {
        errors.phaseId = `${label} phase is required.`
    }

    if (!Number.isSafeInteger(phaseConfig?.startSeed)) {
        errors.startSeed = `${label} start seed must be a safe integer.`
    } else if ((phaseConfig?.startSeed || 0) < 0) {
        errors.startSeed = `${label} start seed must be 0 or greater.`
    }

    if (!Number.isSafeInteger(phaseConfig?.numberOfTests)) {
        errors.numberOfTests = `${label} test count must be an integer.`
    } else if ((phaseConfig?.numberOfTests || 0) < 1) {
        errors.numberOfTests = `${label} test count must be at least 1.`
    }

    return errors
}

function buildValidationErrors(
    draft: UpdateMarathonMatchConfigInput | undefined,
): ValidationErrors {
    if (!draft) {
        return {
            example: {},
            provisional: {},
            system: {},
        }
    }

    return {
        compileTimeout: !Number.isSafeInteger(draft.compileTimeout)
            ? 'Compile timeout must be an integer.'
            : Number(draft.compileTimeout) < 1
                ? 'Compile timeout must be at least 1.'
                : undefined,
        example: buildPhaseValidationErrors('Example', draft.example),
        provisional: buildPhaseValidationErrors('Provisional', draft.provisional),
        reviewScorecardId: draft.reviewScorecardId?.trim()
            ? undefined
            : 'Review scorecard ID is required.',
        system: buildPhaseValidationErrors('System', draft.system),
        taskDefinitionName: draft.taskDefinitionName?.trim()
            ? undefined
            : 'Task definition name is required.',
        taskDefinitionVersion: draft.taskDefinitionVersion?.trim()
            ? undefined
            : 'Task definition version is required.',
        testerId: draft.testerId?.trim()
            ? undefined
            : 'Scorer selection is required.',
        testTimeout: !Number.isSafeInteger(draft.testTimeout)
            ? 'Test timeout must be an integer.'
            : Number(draft.testTimeout) < 1
                ? 'Test timeout must be at least 1.'
                : undefined,
    }
}

function getValidationMessages(errors: ValidationErrors): string[] {
    return [
        errors.reviewScorecardId,
        errors.testerId,
        errors.testTimeout,
        errors.compileTimeout,
        errors.taskDefinitionName,
        errors.taskDefinitionVersion,
        errors.example.phaseId,
        errors.example.startSeed,
        errors.example.numberOfTests,
        errors.provisional.phaseId,
        errors.provisional.startSeed,
        errors.provisional.numberOfTests,
        errors.system.phaseId,
        errors.system.startSeed,
        errors.system.numberOfTests,
    ]
        .filter((message): message is string => !!message)
}

function normalizePhaseForComparison(
    phaseConfig: MarathonMatchPhaseConfig | undefined,
): Record<string, unknown> | undefined {
    if (!phaseConfig) {
        return undefined
    }

    return {
        configType: phaseConfig.configType,
        numberOfTests: Number.isFinite(Number(phaseConfig.numberOfTests))
            ? Number(phaseConfig.numberOfTests)
            : undefined,
        phaseId: phaseConfig.phaseId?.trim() || undefined,
        startSeed: Number.isFinite(Number(phaseConfig.startSeed))
            ? Number(phaseConfig.startSeed)
            : undefined,
    }
}

function serializeDraftForComparison(
    draft: UpdateMarathonMatchConfigInput | undefined,
): string {
    return JSON.stringify({
        active: draft?.active !== false,
        compileTimeout: Number.isFinite(Number(draft?.compileTimeout))
            ? Number(draft?.compileTimeout)
            : undefined,
        example: normalizePhaseForComparison(draft?.example),
        name: draft?.name?.trim() || DEFAULT_SCORER_NAME,
        provisional: normalizePhaseForComparison(draft?.provisional),
        relativeScoringEnabled: draft?.relativeScoringEnabled !== false,
        reviewScorecardId: draft?.reviewScorecardId?.trim() || undefined,
        scoreDirection: draft?.scoreDirection || DEFAULT_SCORE_DIRECTION,
        system: normalizePhaseForComparison(draft?.system),
        taskDefinitionName: draft?.taskDefinitionName?.trim() || undefined,
        taskDefinitionVersion: draft?.taskDefinitionVersion?.trim() || undefined,
        testerId: draft?.testerId?.trim() || undefined,
        testTimeout: Number.isFinite(Number(draft?.testTimeout))
            ? Number(draft?.testTimeout)
            : undefined,
    })
}

function upsertTester(
    testers: MarathonMatchTesterSummary[],
    tester: MarathonMatchTesterSummary,
): MarathonMatchTesterSummary[] {
    let nextTesters = [
        ...testers,
        tester,
    ]

    if (testers.some(item => item.id === tester.id)) {
        nextTesters = testers.map(item => (item.id === tester.id ? tester : item))
    }

    return nextTesters.slice()
        .sort((left, right) => {
            const nameComparison = left.name.localeCompare(right.name)

            if (nameComparison !== 0) {
                return nameComparison
            }

            return compareVersionStrings(right.version, left.version)
        })
}

function buildSaveInput(
    draft: UpdateMarathonMatchConfigInput,
): CreateMarathonMatchConfigInput {
    return {
        active: draft.active !== false,
        compileTimeout: Number(draft.compileTimeout),
        example: draft.example,
        name: draft.name?.trim() || DEFAULT_SCORER_NAME,
        provisional: draft.provisional,
        relativeScoringEnabled: draft.relativeScoringEnabled !== false,
        reviewScorecardId: draft.reviewScorecardId?.trim() || '',
        scoreDirection: draft.scoreDirection || DEFAULT_SCORE_DIRECTION,
        system: draft.system,
        taskDefinitionName: draft.taskDefinitionName?.trim() || '',
        taskDefinitionVersion: draft.taskDefinitionVersion?.trim() || '',
        testerId: draft.testerId?.trim() || '',
        testTimeout: Number(draft.testTimeout),
    }
}

/**
 * Builds test-submission phase choices from saved scorer phase configs.
 * Used by `MarathonMatchScorerSection` so validation upload only targets runnable saved phases.
 */
function getTestSubmissionPhaseOptions(
    config: MarathonMatchConfig | undefined,
): TestSubmissionPhaseOption[] {
    if (!config) {
        return []
    }

    return [
        {
            label: PHASE_LABELS.example,
            phaseConfig: config.example,
            value: PHASE_CONFIG_TYPES.example,
        },
        {
            label: PHASE_LABELS.provisional,
            phaseConfig: config.provisional,
            value: PHASE_CONFIG_TYPES.provisional,
        },
        {
            label: PHASE_LABELS.system,
            phaseConfig: config.system,
            value: PHASE_CONFIG_TYPES.system,
        },
    ]
        .filter(item => !!item.phaseConfig)
        .map(item => ({
            label: item.label,
            value: item.value as MarathonMatchConfigType,
        }))
}

function getPhaseInputKeys(
    phaseKey: PhaseDraftKey,
): {
    numberOfTestsKey: keyof NumericInputState
    startSeedKey: keyof NumericInputState
} {
    return {
        numberOfTestsKey: `${phaseKey}NumberOfTests`,
        startSeedKey: `${phaseKey}StartSeed`,
    } as {
        numberOfTestsKey: keyof NumericInputState
        startSeedKey: keyof NumericInputState
    }
}

export interface MarathonMatchScorerSectionProps {
    challengeId: string
    onScorerConfigChange: (hasUnsavedChanges: boolean, hasError: boolean) => void
    phases: ChallengePhase[]
}

/**
 * Manages the challenge-specific marathon match scorer configuration editor.
 * Used inside `ChallengeEditorForm` for created marathon match challenges.
 */
// eslint-disable-next-line complexity
export const MarathonMatchScorerSection: FC<MarathonMatchScorerSectionProps> = (
    props: MarathonMatchScorerSectionProps,
) => {
    const challengeId: string = props.challengeId
    const onScorerConfigChange: MarathonMatchScorerSectionProps['onScorerConfigChange']
        = props.onScorerConfigChange
    const phases: ChallengePhase[] = props.phases
    const phaseListRef = useRef<ChallengePhase[]>(phases)
    const isMountedRef = useRef<boolean>(true)
    const pollingTimerRef = useRef<number | undefined>()
    const testSubmissionPollingTimerRef = useRef<number | undefined>()

    const [config, setConfig] = useState<MarathonMatchConfig | undefined>()
    const [defaults, setDefaults] = useState<MarathonMatchDefaults | undefined>()
    const [testers, setTesters] = useState<MarathonMatchTesterSummary[]>([])
    const [selectedTester, setSelectedTester] = useState<MarathonMatchTester | undefined>()
    const [draft, setDraft] = useState<UpdateMarathonMatchConfigInput | undefined>()
    const [savedSnapshot, setSavedSnapshot] = useState<UpdateMarathonMatchConfigInput | undefined>()
    const [numericInputs, setNumericInputs] = useState<NumericInputState>({
        compileTimeout: '',
        exampleNumberOfTests: '',
        exampleStartSeed: '',
        provisionalNumberOfTests: '',
        provisionalStartSeed: '',
        systemNumberOfTests: '',
        systemStartSeed: '',
        testTimeout: '',
    })
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [isRerunning, setIsRerunning] = useState<boolean>(false)
    const [isUploadingTestSubmission, setIsUploadingTestSubmission] = useState<boolean>(false)
    const [loadError, setLoadError] = useState<string | undefined>()
    const [saveError, setSaveError] = useState<string | undefined>()
    const [rerunError, setRerunError] = useState<string | undefined>()
    const [testSubmissionError, setTestSubmissionError] = useState<string | undefined>()
    const [testerLoadError, setTesterLoadError] = useState<string | undefined>()
    const [selectedTestSubmissionFile, setSelectedTestSubmissionFile] = useState<File | undefined>()
    const [testSubmissionConfigType, setTestSubmissionConfigType] = useState<MarathonMatchConfigType>('PROVISIONAL')
    const [testSubmissionResult, setTestSubmissionResult] = useState<TestSubmissionResultState>()
    const [showTestSubmissionResultModal, setShowTestSubmissionResultModal] = useState<boolean>(false)
    const [showNewTesterModal, setShowNewTesterModal] = useState<boolean>(false)
    const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false)
    const [showCompilationErrorsModal, setShowCompilationErrorsModal] = useState<boolean>(false)

    const phaseOptions = useMemo(
        (): PhaseOption[] => phases
            .map(phase => ({
                label: phase.name?.trim() || getChallengePhaseId(phase),
                value: getChallengePhaseId(phase),
            }))
            .filter(option => !!option.value),
        [phases],
    )
    const testSubmissionPhaseOptions = useMemo(
        (): TestSubmissionPhaseOption[] => getTestSubmissionPhaseOptions(config),
        [config],
    )

    const validationErrors = useMemo(
        (): ValidationErrors => buildValidationErrors(draft),
        [draft],
    )
    const validationMessages = useMemo(
        (): string[] => getValidationMessages(validationErrors),
        [validationErrors],
    )
    const hasValidationError = validationMessages.length > 0
    const hasFailedTester = selectedTester?.compilationStatus === 'FAILED'
    const hasBlockingError = isLoading
        || !!loadError
        || !!testerLoadError
        || hasValidationError
        || hasFailedTester
    const hasUnsavedChanges = useMemo(
        (): boolean => serializeDraftForComparison(draft) !== serializeDraftForComparison(savedSnapshot),
        [draft, savedSnapshot],
    )
    const maxTesterVersionByName = useMemo(
        (): Record<string, string> => testers.reduce<Record<string, string>>((currentVersions, tester) => {
            const currentMaxVersion = currentVersions[tester.name]

            if (
                !currentMaxVersion
                || compareVersionStrings(tester.version, currentMaxVersion) > 0
            ) {
                currentVersions[tester.name] = tester.version
            }

            return currentVersions
        }, {}),
        [testers],
    )
    const testerGroups = useMemo(
        (): TesterGroup[] => {
            const groups = testers.reduce<Map<string, MarathonMatchTesterSummary[]>>((currentGroups, tester) => {
                const currentGroup = currentGroups.get(tester.name) || []
                currentGroup.push(tester)
                currentGroups.set(tester.name, currentGroup)

                return currentGroups
            }, new Map<string, MarathonMatchTesterSummary[]>())

            return Array.from(groups.entries())
                .sort(([leftName], [rightName]) => leftName.localeCompare(rightName))
                .map(([name, groupedTesters]) => ({
                    name,
                    testers: groupedTesters.slice()
                        .sort((left, right) => compareVersionStrings(right.version, left.version)),
                }))
        },
        [testers],
    )

    const clearPollingTimer = useCallback((): void => {
        if (pollingTimerRef.current === undefined) {
            return
        }

        window.clearTimeout(pollingTimerRef.current)
        pollingTimerRef.current = undefined
    }, [])

    /**
     * Clears the active validation-submission polling timeout.
     * @returns void
     * Used when a new validation upload starts, the selected file changes, or the component unmounts.
     */
    const clearTestSubmissionPollingTimer = useCallback((): void => {
        if (testSubmissionPollingTimerRef.current === undefined) {
            return
        }

        window.clearTimeout(testSubmissionPollingTimerRef.current)
        testSubmissionPollingTimerRef.current = undefined
    }, [])

    const handleOpenNewTesterModal = useCallback((): void => {
        setShowNewTesterModal(true)
    }, [])

    const handleOpenNewVersionModal = useCallback((): void => {
        setShowNewVersionModal(true)
    }, [])

    const handleCloseNewTesterModal = useCallback((): void => {
        setShowNewTesterModal(false)
    }, [])

    const handleCloseNewVersionModal = useCallback((): void => {
        setShowNewVersionModal(false)
    }, [])

    /**
     * Opens the failed scorer compilation diagnostics modal.
     * @returns void
     */
    const handleOpenCompilationErrorsModal = useCallback((): void => {
        setShowCompilationErrorsModal(true)
    }, [])

    /**
     * Closes the failed scorer compilation diagnostics modal.
     * @returns void
     */
    const handleCloseCompilationErrorsModal = useCallback((): void => {
        setShowCompilationErrorsModal(false)
    }, [])

    const loadTesterById = useCallback(
        async (
            testerId: string,
            options: LoadTesterByIdOptions = {},
        ): Promise<boolean> => {
            const clearSelectionOnFailure = options.clearSelectionOnFailure !== false
            const setBlockingErrorOnFailure = options.setBlockingErrorOnFailure !== false
            const shouldShowErrorToast = options.showErrorToast !== false

            try {
                const tester = await fetchTester(testerId)

                if (!isMountedRef.current) {
                    return false
                }

                setSelectedTester(tester)
                setTesterLoadError(undefined)
                setTesters(currentTesters => upsertTester(currentTesters, tester))

                return true
            } catch (error) {
                if (!isMountedRef.current) {
                    return false
                }

                const errorMessage = buildTesterLoadErrorMessage(error)

                if (clearSelectionOnFailure) {
                    setSelectedTester(undefined)
                }

                if (setBlockingErrorOnFailure) {
                    setTesterLoadError(errorMessage)
                }

                if (shouldShowErrorToast) {
                    showErrorToast(errorMessage)
                }

                return false
            }
        },
        [],
    )

    const updateDraft = useCallback(
        (updater: (currentDraft: UpdateMarathonMatchConfigInput) => UpdateMarathonMatchConfigInput): void => {
            setDraft(currentDraft => {
                const resolvedDraft = currentDraft || (defaults
                    ? buildDefaultDraft(defaults, phaseListRef.current)
                    : {
                        active: true,
                        name: DEFAULT_SCORER_NAME,
                        relativeScoringEnabled: true,
                        scoreDirection: DEFAULT_SCORE_DIRECTION,
                    })

                return updater(resolvedDraft)
            })
        },
        [
            defaults,
        ],
    )

    const handleTextInputChange = useCallback(
        (field: keyof UpdateMarathonMatchConfigInput) => (
            event: ChangeEvent<HTMLInputElement>,
        ): void => {
            const nextValue = event.target.value

            updateDraft(currentDraft => ({
                ...currentDraft,
                [field]: nextValue,
            }))
        },
        [updateDraft],
    )

    const handleCheckboxChange = useCallback(
        (field: keyof UpdateMarathonMatchConfigInput) => (
            event: ChangeEvent<HTMLInputElement>,
        ): void => {
            updateDraft(currentDraft => ({
                ...currentDraft,
                [field]: event.target.checked,
            }))
        },
        [updateDraft],
    )

    /**
     * Updates the scorer draft with the selected score direction.
     * @param event Radio change event carrying the selected marathon match score direction.
     * @returns void
     * Used by the Score Direction radios before persisting the scorer config payload.
     */
    const handleScoreDirectionChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            updateDraft(currentDraft => ({
                ...currentDraft,
                scoreDirection: event.target.value as MarathonMatchScoreDirection,
            }))
        },
        [updateDraft],
    )

    const handleNumericFieldChange = useCallback(
        (field: 'compileTimeout' | 'testTimeout') => (
            event: ChangeEvent<HTMLInputElement>,
        ): void => {
            const nextValue = event.target.value

            setNumericInputs(currentInputs => ({
                ...currentInputs,
                [field]: nextValue,
            }))
            updateDraft(currentDraft => ({
                ...currentDraft,
                [field]: parseIntegerInput(nextValue),
            }))
        },
        [updateDraft],
    )

    const handlePhaseSelectionChange = useCallback(
        (phaseKey: PhaseDraftKey) => (
            event: ChangeEvent<HTMLSelectElement>,
        ): void => {
            const selectedPhaseId = event.target.value

            updateDraft(currentDraft => ({
                ...currentDraft,
                [phaseKey]: {
                    ...(currentDraft[phaseKey] || createPhaseDraft(phaseKey)),
                    configType: PHASE_CONFIG_TYPES[phaseKey],
                    phaseId: selectedPhaseId,
                },
            }))
        },
        [updateDraft],
    )

    const handlePhaseNumericChange = useCallback(
        (
            phaseKey: PhaseDraftKey,
            field: 'numberOfTests' | 'startSeed',
        ) => (
            event: ChangeEvent<HTMLInputElement>,
        ): void => {
            const nextValue = event.target.value
            const phaseInputKeys: {
                numberOfTestsKey: keyof NumericInputState
                startSeedKey: keyof NumericInputState
            } = getPhaseInputKeys(phaseKey)

            setNumericInputs(currentInputs => ({
                ...currentInputs,
                [field === 'numberOfTests'
                    ? phaseInputKeys.numberOfTestsKey
                    : phaseInputKeys.startSeedKey]: nextValue,
            }))
            updateDraft(currentDraft => ({
                ...currentDraft,
                [phaseKey]: {
                    ...(currentDraft[phaseKey] || createPhaseDraft(phaseKey)),
                    configType: PHASE_CONFIG_TYPES[phaseKey],
                    [field]: parseIntegerInput(nextValue),
                },
            }))
        },
        [updateDraft],
    )

    const handleTesterSelectionChange = useCallback(
        async (event: ChangeEvent<HTMLSelectElement>): Promise<void> => {
            const testerId = event.target.value

            setSaveError(undefined)
            setTesterLoadError(undefined)
            clearPollingTimer()
            updateDraft(currentDraft => ({
                ...currentDraft,
                testerId,
            }))

            if (!testerId) {
                setSelectedTester(undefined)
                return
            }

            await loadTesterById(testerId)
        },
        [
            clearPollingTimer,
            loadTesterById,
            updateDraft,
        ],
    )

    const handleSaveScorerConfig = useCallback(
        async (): Promise<void> => {
            if (!draft) {
                return
            }

            if (hasValidationError) {
                setSaveError('Please fix scorer validation errors before saving.')
                showErrorToast('Please fix scorer validation errors before saving.')
                return
            }

            const blockingErrorMessage = loadError
                || testerLoadError
                || (hasFailedTester
                    ? 'Selected scorer compilation must succeed before saving.'
                    : undefined)
                || (isLoading
                    ? 'Scorer configuration is still loading.'
                    : undefined)

            if (blockingErrorMessage) {
                setSaveError(blockingErrorMessage)
                showErrorToast(blockingErrorMessage)
                return
            }

            setIsSaving(true)
            setSaveError(undefined)

            try {
                const payload = buildSaveInput(draft)
                const savedConfig = config
                    ? await updateMarathonMatchConfig(challengeId, payload)
                    : await createMarathonMatchConfig(challengeId, payload)
                const nextDraft = mapConfigToDraft(savedConfig)

                setConfig(savedConfig)
                setDraft(nextDraft)
                setSavedSnapshot(nextDraft)
                setNumericInputs(buildNumericInputState(nextDraft))
                setTestSubmissionError(undefined)
                setTestSubmissionResult(undefined)

                if (savedConfig.testerId) {
                    await loadTesterById(savedConfig.testerId, {
                        showErrorToast: false,
                    })
                }

                showSuccessToast('Scorer configuration saved')
            } catch (error) {
                const errorMessage = getErrorMessage(error, 'Failed to save scorer configuration')

                setSaveError(errorMessage)
                showErrorToast(errorMessage)
            } finally {
                setIsSaving(false)
            }
        },
        [
            config,
            draft,
            hasValidationError,
            hasFailedTester,
            isLoading,
            loadError,
            loadTesterById,
            testerLoadError,
            challengeId,
        ],
    )

    const handleSaveScorerConfigClick = useCallback((): void => {
        handleSaveScorerConfig()
            .catch(() => undefined)
    }, [handleSaveScorerConfig])

    const handleTesterCreated = useCallback(
        (tester: MarathonMatchTester): void => {
            setShowNewTesterModal(false)
            setShowNewVersionModal(false)
            setSelectedTester(tester)
            setTesterLoadError(undefined)
            setTesters(currentTesters => upsertTester(currentTesters, tester))
            updateDraft(currentDraft => ({
                ...currentDraft,
                testerId: tester.id,
            }))
        },
        [updateDraft],
    )

    const handleTesterSelectionChangeCapture = useCallback(
        (event: ChangeEvent<HTMLSelectElement>): void => {
            handleTesterSelectionChange(event)
                .catch(() => undefined)
        },
        [handleTesterSelectionChange],
    )

    const handleTestSubmissionPhaseChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>): void => {
            setTestSubmissionConfigType(event.target.value as MarathonMatchConfigType)
            setTestSubmissionError(undefined)
            setTestSubmissionResult(undefined)
        },
        [],
    )

    const handleTestSubmissionFileChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const nextFile = event.target.files?.[0]

            setSelectedTestSubmissionFile(nextFile)
            setTestSubmissionError(undefined)
            setTestSubmissionResult(undefined)
            setShowTestSubmissionResultModal(false)
            clearTestSubmissionPollingTimer()
        },
        [clearTestSubmissionPollingTimer],
    )

    useEffect(() => {
        phaseListRef.current = phases
    }, [phases])

    useEffect(() => () => {
        isMountedRef.current = false
        clearTestSubmissionPollingTimer()
    }, [clearTestSubmissionPollingTimer])

    useEffect(() => {
        let isMounted = true

        clearPollingTimer()
        setIsLoading(true)
        setLoadError(undefined)
        setSaveError(undefined)
        setRerunError(undefined)
        setTestSubmissionError(undefined)
        setTestSubmissionResult(undefined)
        setShowTestSubmissionResultModal(false)
        setSelectedTestSubmissionFile(undefined)
        clearTestSubmissionPollingTimer()
        setTesterLoadError(undefined)
        setSelectedTester(undefined)

        const loadScorerData = async (): Promise<void> => {
            try {
                const [
                    loadedDefaults,
                    loadedConfig,
                    loadedTesters,
                ] = await Promise.all([
                    fetchMarathonMatchDefaults(),
                    fetchMarathonMatchConfig(challengeId),
                    fetchTesters(),
                ])

                if (!isMounted) {
                    return
                }

                const initialDraft = loadedConfig
                    ? mapConfigToDraft(loadedConfig)
                    : buildDefaultDraft(loadedDefaults, phaseListRef.current)

                setDefaults(loadedDefaults)
                setConfig(loadedConfig)
                setDraft(initialDraft)
                setSavedSnapshot(initialDraft)
                setNumericInputs(buildNumericInputState(initialDraft))
                setTesters(loadedTesters)

                if (initialDraft.testerId?.trim()) {
                    await loadTesterById(initialDraft.testerId, {
                        showErrorToast: false,
                    })
                }
            } catch (error) {
                if (!isMounted) {
                    return
                }

                setLoadError(getErrorMessage(error, 'Failed to load scorer configuration'))
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadScorerData()
            .catch(() => undefined)

        return () => {
            isMounted = false
            clearPollingTimer()
            clearTestSubmissionPollingTimer()
        }
    }, [
        clearPollingTimer,
        clearTestSubmissionPollingTimer,
        loadTesterById,
        challengeId,
    ])

    useEffect(() => {
        if (config || !defaults || !draft || !phases.length) {
            return
        }

        const nextDraft: UpdateMarathonMatchConfigInput = {
            ...draft,
            example: draft.example?.phaseId
                ? draft.example
                : createPhaseDraft(
                    'example',
                    getPreferredPhaseId(phases, PHASE_DEFAULTS.example.phaseName),
                ),
            provisional: draft.provisional?.phaseId
                ? draft.provisional
                : createPhaseDraft(
                    'provisional',
                    getPreferredPhaseId(phases, PHASE_DEFAULTS.provisional.phaseName),
                ),
            system: draft.system?.phaseId
                ? draft.system
                : createPhaseDraft(
                    'system',
                    getPreferredPhaseId(phases, PHASE_DEFAULTS.system.phaseName),
                ),
        }
        const isSnapshotAligned = serializeDraftForComparison(draft) === serializeDraftForComparison(savedSnapshot)

        if (serializeDraftForComparison(nextDraft) === serializeDraftForComparison(draft)) {
            return
        }

        setDraft(nextDraft)
        setNumericInputs(buildNumericInputState(nextDraft))

        if (isSnapshotAligned) {
            setSavedSnapshot(nextDraft)
        }
    }, [
        config,
        defaults,
        draft,
        phases,
        savedSnapshot,
    ])

    useEffect(() => {
        if (!draft || !phases.length) {
            return
        }

        const nextDraft = normalizeDraftPhaseSelections(draft, phases)
        const isSnapshotAligned = serializeDraftForComparison(draft) === serializeDraftForComparison(savedSnapshot)

        if (serializeDraftForComparison(nextDraft) === serializeDraftForComparison(draft)) {
            return
        }

        setDraft(nextDraft)
        setNumericInputs(buildNumericInputState(nextDraft))

        if (isSnapshotAligned) {
            setSavedSnapshot(nextDraft)
        }
    }, [
        draft,
        phases,
        savedSnapshot,
    ])

    useEffect(() => {
        onScorerConfigChange(hasUnsavedChanges, hasBlockingError)
    }, [
        hasBlockingError,
        hasUnsavedChanges,
        onScorerConfigChange,
    ])

    useEffect(() => {
        if (selectedTester?.compilationStatus === 'FAILED') {
            return
        }

        setShowCompilationErrorsModal(false)
    }, [selectedTester?.compilationStatus])

    useEffect(() => {
        clearPollingTimer()

        if (selectedTester?.compilationStatus !== 'PENDING') {
            return undefined
        }

        let isCancelled = false

        /**
         * Refreshes the pending scorer status and schedules the next poll while it remains unresolved.
         * Used to keep the scorer summary in sync with background compilation without requiring a page reload.
         */
        const pollTesterStatus = async (): Promise<void> => {
            try {
                await loadTesterById(selectedTester.id, {
                    clearSelectionOnFailure: false,
                    setBlockingErrorOnFailure: false,
                    showErrorToast: false,
                })
            } finally {
                if (!isCancelled) {
                    pollingTimerRef.current = window.setTimeout(() => {
                        pollTesterStatus()
                            .catch(() => undefined)
                    }, POLL_INTERVAL_MS)
                }
            }
        }

        pollingTimerRef.current = window.setTimeout(() => {
            pollTesterStatus()
                .catch(() => undefined)
        }, POLL_INTERVAL_MS)

        return (): void => {
            isCancelled = true
            clearPollingTimer()
        }
    }, [
        clearPollingTimer,
        loadTesterById,
        selectedTester?.compilationStatus,
        selectedTester?.id,
    ])

    useEffect(() => {
        if (testSubmissionPhaseOptions.some(option => option.value === testSubmissionConfigType)) {
            return
        }

        setTestSubmissionConfigType(
            testSubmissionPhaseOptions[0]?.value || 'PROVISIONAL',
        )
    }, [
        testSubmissionConfigType,
        testSubmissionPhaseOptions,
    ])

    const currentTesterId = draft?.testerId || ''
    const currentVersionTarget = selectedTester
    const currentVersionMax = currentVersionTarget?.name
        ? maxTesterVersionByName[currentVersionTarget.name]
        : undefined
    const isReadyToSave = !!draft && !isSaving && !hasBlockingError && hasUnsavedChanges
    const canRerunScores = !!config
        && !hasUnsavedChanges
        && !hasBlockingError
        && !isRerunning
    const canUploadTestSubmission = !!config
        && !hasUnsavedChanges
        && !hasBlockingError
        && !isUploadingTestSubmission
        && !!selectedTestSubmissionFile
        && testSubmissionPhaseOptions.some(option => option.value === testSubmissionConfigType)
    const testSubmissionStatus = normalizeTestSubmissionStatus(testSubmissionResult?.status)
    const isTestSubmissionComplete = isTerminalTestSubmissionStatus(testSubmissionResult?.status)
    const modalTestSubmissionResult = isTestSubmissionStatusResponse(testSubmissionResult)
        ? testSubmissionResult
        : undefined

    /**
     * Starts polling a validation submission run until scoring reaches a terminal state.
     * @param testSubmissionId Validation run identifier returned by upload.
     * @returns void
     * Used by `handleUploadTestSubmission` after the ECS task is queued.
     */
    const startTestSubmissionStatusPolling = useCallback((testSubmissionId: string): void => {
        clearTestSubmissionPollingTimer()

        const pollStatus = async (): Promise<void> => {
            try {
                const statusResponse = await fetchMarathonMatchTestSubmissionStatus(
                    challengeId,
                    testSubmissionId,
                )

                if (!isMountedRef.current) {
                    return
                }

                setTestSubmissionResult(statusResponse)

                if (isTerminalTestSubmissionStatus(statusResponse.status)) {
                    clearTestSubmissionPollingTimer()
                    setShowTestSubmissionResultModal(true)

                    if (normalizeTestSubmissionStatus(statusResponse.status) === 'FAILED') {
                        showErrorToast('Validation scoring failed')
                    } else {
                        showSuccessToast('Validation scoring complete')
                    }

                    return
                }

                testSubmissionPollingTimerRef.current = window.setTimeout(() => {
                    pollStatus()
                        .catch(() => undefined)
                }, POLL_INTERVAL_MS)
            } catch (error) {
                if (!isMountedRef.current) {
                    return
                }

                const errorMessage = getErrorMessage(
                    error,
                    'Failed to fetch marathon match validation submission status',
                )

                clearTestSubmissionPollingTimer()
                setTestSubmissionError(errorMessage)
                showErrorToast(errorMessage)
            }
        }

        pollStatus()
            .catch(() => undefined)
    }, [
        challengeId,
        clearTestSubmissionPollingTimer,
    ])

    const handleUploadTestSubmission = useCallback(
        async (): Promise<void> => {
            if (!canUploadTestSubmission || !selectedTestSubmissionFile) {
                return
            }

            clearTestSubmissionPollingTimer()
            setIsUploadingTestSubmission(true)
            setTestSubmissionError(undefined)
            setTestSubmissionResult(undefined)
            setShowTestSubmissionResultModal(false)

            try {
                const uploadResponse = await uploadMarathonMatchTestSubmission(
                    challengeId,
                    {
                        configType: testSubmissionConfigType,
                        file: selectedTestSubmissionFile,
                    },
                )

                setTestSubmissionResult(uploadResponse)
                showSuccessToast('Validation scoring queued')
                startTestSubmissionStatusPolling(uploadResponse.testSubmissionId)
            } catch (error) {
                const errorMessage = getErrorMessage(
                    error,
                    'Failed to upload marathon match validation submission',
                )

                setTestSubmissionError(errorMessage)
                showErrorToast(errorMessage)
            } finally {
                setIsUploadingTestSubmission(false)
            }
        },
        [
            canUploadTestSubmission,
            challengeId,
            clearTestSubmissionPollingTimer,
            selectedTestSubmissionFile,
            startTestSubmissionStatusPolling,
            testSubmissionConfigType,
        ],
    )

    const handleUploadTestSubmissionClick = useCallback((): void => {
        handleUploadTestSubmission()
            .catch(() => undefined)
    }, [handleUploadTestSubmission])

    /**
     * Closes the validation submission result modal.
     * @returns void
     * Used by the modal close button and footer action.
     */
    const handleCloseTestSubmissionResultModal = useCallback((): void => {
        setShowTestSubmissionResultModal(false)
    }, [])

    const handleRerunScores = useCallback(
        async (): Promise<void> => {
            if (!canRerunScores) {
                return
            }

            setIsRerunning(true)
            setRerunError(undefined)

            try {
                const rerunResponse = await rerunMarathonMatchScores(challengeId)
                const failedCount = rerunResponse.results
                    .filter(result => !!result.error)
                    .length
                const launchedCount = rerunResponse.submissionsQueued - failedCount

                if (rerunResponse.submissionsQueued === 0) {
                    showInfoToast('No latest submissions found to rerun')
                } else if (failedCount > 0) {
                    showErrorToast(
                        `Rerun queued ${launchedCount}/${rerunResponse.submissionsQueued} submissions`,
                    )
                } else {
                    showSuccessToast(`Rerun queued ${rerunResponse.submissionsQueued} submissions`)
                }
            } catch (error) {
                const errorMessage = getErrorMessage(error, 'Failed to rerun marathon match scores')

                setRerunError(errorMessage)
                showErrorToast(errorMessage)
            } finally {
                setIsRerunning(false)
            }
        },
        [
            canRerunScores,
            challengeId,
        ],
    )

    const handleRerunScoresClick = useCallback((): void => {
        handleRerunScores()
            .catch(() => undefined)
    }, [handleRerunScores])

    if (loadError && !draft) {
        return <div className={styles.error}>{loadError}</div>
    }

    if (!draft) {
        return <div className={styles.loading}>Loading scorer configuration...</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div>
                    <h3>Marathon Match Scorer</h3>
                    <p>
                        Configure the scorer, review scorecard, and phase execution
                        settings used by the marathon match scoring flow.
                    </p>
                </div>

                {!hasUnsavedChanges && !hasBlockingError && config
                    ? <div className={styles.saveIndicator}>Scorer config saved</div>
                    : undefined}
            </div>

            {selectedTester?.compilationStatus === 'PENDING'
                ? (
                    <div className={styles.infoBanner}>
                        Scorer compilation is in progress. The status refreshes every 5 seconds.
                    </div>
                )
                : undefined}

            {selectedTester?.compilationStatus === 'FAILED'
                ? (
                    <div className={styles.error}>
                        <div className={styles.errorActionRow}>
                            <strong>Scorer compilation failed.</strong>
                            <button
                                className={styles.linkButton}
                                onClick={handleOpenCompilationErrorsModal}
                                type='button'
                            >
                                View compilation errors
                            </button>
                        </div>
                    </div>
                )
                : undefined}

            {saveError
                ? <div className={styles.error}>{saveError}</div>
                : undefined}

            <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h3>Scorer</h3>
                    <p>Select the compiled scorer that will execute challenge submissions.</p>
                </div>

                <div className={styles.testerToolbar}>
                    <label className={styles.fieldGroup}>
                        <span>Scorer</span>
                        <select
                            className={classNames(
                                styles.selectInput,
                                !currentTesterId && styles.selectPlaceholder,
                            )}
                            onChange={handleTesterSelectionChangeCapture}
                            value={currentTesterId}
                        >
                            <option value=''>Select scorer</option>
                            {testerGroups.map(group => (
                                <optgroup key={group.name} label={group.name}>
                                    {group.testers.map(tester => (
                                        <option key={tester.id} value={tester.id}>
                                            {tester.name}
                                            {' '}
                                            v
                                            {tester.version}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {validationErrors.testerId
                            ? <small className={styles.fieldError}>{validationErrors.testerId}</small>
                            : undefined}
                    </label>

                    <div className={styles.inlineActions}>
                        <Button
                            label='New Scorer'
                            onClick={handleOpenNewTesterModal}
                            secondary
                            size='sm'
                            type='button'
                        />
                        {selectedTester
                            ? (
                                <Button
                                    label='New Version'
                                    onClick={handleOpenNewVersionModal}
                                    secondary
                                    size='sm'
                                    type='button'
                                />
                            )
                            : undefined}
                    </div>
                </div>

                {testerLoadError
                    ? <div className={styles.error}>{testerLoadError}</div>
                    : undefined}

                {rerunError
                    ? <div className={styles.error}>{rerunError}</div>
                    : undefined}

                {testSubmissionError
                    ? <div className={styles.error}>{testSubmissionError}</div>
                    : undefined}

                {selectedTester
                    ? (
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>Selected Scorer</span>
                                <strong>
                                    {selectedTester.name}
                                    {' '}
                                    v
                                    {selectedTester.version}
                                </strong>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>Compilation Status</span>
                                <strong>{selectedTester.compilationStatus}</strong>
                            </div>
                            <div className={styles.summaryCard}>
                                <span className={styles.summaryLabel}>Main Class</span>
                                <strong>{selectedTester.className}</strong>
                            </div>
                        </div>
                    )
                    : testers.length === 0
                        ? <div className={styles.emptyState}>No scorers found yet. Create one to continue.</div>
                        : undefined}

                {config
                    ? (
                        <div className={styles.rerunActions}>
                            <div>
                                <h4>Score Operations</h4>
                                <p>Queue validation or latest submissions with the saved scorer config.</p>
                            </div>
                            <div className={styles.operationPanel}>
                                <div className={styles.testSubmissionGrid}>
                                    <label className={styles.fieldGroup}>
                                        <span>Validation Phase</span>
                                        <select
                                            className={styles.selectInput}
                                            disabled={
                                                isUploadingTestSubmission
                                                || testSubmissionPhaseOptions.length === 0
                                            }
                                            onChange={handleTestSubmissionPhaseChange}
                                            value={testSubmissionConfigType}
                                        >
                                            {testSubmissionPhaseOptions.length === 0
                                                ? (
                                                    <option value={testSubmissionConfigType}>
                                                        No saved phase configs
                                                    </option>
                                                )
                                                : testSubmissionPhaseOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>

                                    <label className={styles.fieldGroup}>
                                        <span>Test Submission</span>
                                        <input
                                            accept='.zip,application/zip,application/x-zip-compressed'
                                            disabled={isUploadingTestSubmission}
                                            onChange={handleTestSubmissionFileChange}
                                            type='file'
                                        />
                                    </label>

                                    <div className={styles.operationButton}>
                                        <Button
                                            disabled={!canUploadTestSubmission}
                                            label={
                                                isUploadingTestSubmission
                                                    ? 'Uploading...'
                                                    : 'Upload test submission'
                                            }
                                            loading={isUploadingTestSubmission}
                                            onClick={handleUploadTestSubmissionClick}
                                            secondary
                                            size='sm'
                                            type='button'
                                        />
                                    </div>
                                </div>

                                {testSubmissionResult && !isTestSubmissionComplete
                                    ? (
                                        <div className={styles.testSubmissionResult}>
                                            <span>
                                                Validation scoring
                                                {' '}
                                                {testSubmissionStatus.toLowerCase()}
                                            </span>
                                            <span>
                                                Progress
                                                {' '}
                                                {formatTestSubmissionProgress(
                                                    isTestSubmissionStatusResponse(testSubmissionResult)
                                                        ? testSubmissionResult.progress
                                                        : undefined,
                                                )}
                                            </span>
                                        </div>
                                    )
                                    : undefined}

                                <div className={styles.rerunButtonRow}>
                                    <Button
                                        disabled={!canRerunScores}
                                        label={isRerunning ? 'Rerunning...' : 'Rerun scores'}
                                        loading={isRerunning}
                                        onClick={handleRerunScoresClick}
                                        secondary
                                        size='sm'
                                        type='button'
                                    />
                                </div>
                            </div>
                        </div>
                    )
                    : undefined}
            </section>

            <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h3>Scorer Settings</h3>
                    <p>Set the scorecard, timeout, and runner task definition used by the scorer.</p>
                </div>

                <div className={styles.fieldGrid}>
                    <label className={styles.checkboxField}>
                        <input
                            checked={draft.active !== false}
                            onChange={handleCheckboxChange('active')}
                            type='checkbox'
                        />
                        <span>Active</span>
                    </label>

                    <label className={styles.checkboxField}>
                        <input
                            checked={draft.relativeScoringEnabled !== false}
                            onChange={handleCheckboxChange('relativeScoringEnabled')}
                            type='checkbox'
                        />
                        <span>Relative Scoring</span>
                    </label>

                    <fieldset className={styles.radioField}>
                        <legend>Score Direction</legend>
                        <div className={styles.radioOptions}>
                            {SCORE_DIRECTION_OPTIONS.map(option => (
                                <label
                                    className={styles.radioOption}
                                    key={option.value}
                                >
                                    <input
                                        checked={
                                            (draft.scoreDirection || DEFAULT_SCORE_DIRECTION) === option.value
                                        }
                                        name='marathon-match-score-direction'
                                        onChange={handleScoreDirectionChange}
                                        type='radio'
                                        value={option.value}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <label className={styles.fieldGroup}>
                        <span>Review Scorecard ID</span>
                        <input
                            onChange={handleTextInputChange('reviewScorecardId')}
                            type='text'
                            value={draft.reviewScorecardId || ''}
                        />
                        {validationErrors.reviewScorecardId
                            ? <small className={styles.fieldError}>{validationErrors.reviewScorecardId}</small>
                            : undefined}
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>Test Timeout (ms)</span>
                        <input
                            min={1}
                            onChange={handleNumericFieldChange('testTimeout')}
                            type='number'
                            value={numericInputs.testTimeout}
                        />
                        {validationErrors.testTimeout
                            ? <small className={styles.fieldError}>{validationErrors.testTimeout}</small>
                            : undefined}
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>Compile Timeout (ms)</span>
                        <input
                            min={1}
                            onChange={handleNumericFieldChange('compileTimeout')}
                            type='number'
                            value={numericInputs.compileTimeout}
                        />
                        {validationErrors.compileTimeout
                            ? <small className={styles.fieldError}>{validationErrors.compileTimeout}</small>
                            : undefined}
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>Task Definition Name</span>
                        <input
                            onChange={handleTextInputChange('taskDefinitionName')}
                            type='text'
                            value={draft.taskDefinitionName || ''}
                        />
                        {validationErrors.taskDefinitionName
                            ? <small className={styles.fieldError}>{validationErrors.taskDefinitionName}</small>
                            : undefined}
                    </label>

                    <label className={styles.fieldGroup}>
                        <span>Task Definition Version</span>
                        <input
                            onChange={handleTextInputChange('taskDefinitionVersion')}
                            type='text'
                            value={draft.taskDefinitionVersion || ''}
                        />
                        {validationErrors.taskDefinitionVersion
                            ? <small className={styles.fieldError}>{validationErrors.taskDefinitionVersion}</small>
                            : undefined}
                    </label>
                </div>
            </section>

            <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h3>Phase Execution</h3>
                    <p>Choose which challenge phases should run example, provisional, and system tests.</p>
                </div>

                <div className={styles.phaseCards}>
                    <PhaseConfigCard
                        errors={validationErrors.example}
                        label='Example'
                        numberOfTestsValue={numericInputs.exampleNumberOfTests}
                        onNumberOfTestsChange={handlePhaseNumericChange('example', 'numberOfTests')}
                        onPhaseChange={handlePhaseSelectionChange('example')}
                        onStartSeedChange={handlePhaseNumericChange('example', 'startSeed')}
                        options={phaseOptions}
                        phaseId={draft.example?.phaseId || ''}
                        startSeedValue={numericInputs.exampleStartSeed}
                    />
                    <PhaseConfigCard
                        errors={validationErrors.provisional}
                        label='Provisional'
                        numberOfTestsValue={numericInputs.provisionalNumberOfTests}
                        onNumberOfTestsChange={handlePhaseNumericChange('provisional', 'numberOfTests')}
                        onPhaseChange={handlePhaseSelectionChange('provisional')}
                        onStartSeedChange={handlePhaseNumericChange('provisional', 'startSeed')}
                        options={phaseOptions}
                        phaseId={draft.provisional?.phaseId || ''}
                        startSeedValue={numericInputs.provisionalStartSeed}
                    />
                    <PhaseConfigCard
                        errors={validationErrors.system}
                        label='System'
                        numberOfTestsValue={numericInputs.systemNumberOfTests}
                        onNumberOfTestsChange={handlePhaseNumericChange('system', 'numberOfTests')}
                        onPhaseChange={handlePhaseSelectionChange('system')}
                        onStartSeedChange={handlePhaseNumericChange('system', 'startSeed')}
                        options={phaseOptions}
                        phaseId={draft.system?.phaseId || ''}
                        startSeedValue={numericInputs.systemStartSeed}
                    />
                </div>
            </section>

            <section className={classNames(
                styles.validationCard,
                hasValidationError || hasFailedTester || loadError || testerLoadError
                    ? styles.validationCardInvalid
                    : styles.validationCardValid,
            )}
            >
                {hasValidationError || hasFailedTester || loadError || testerLoadError
                    ? (
                        <>
                            <div>
                                Scorer configuration needs attention before the challenge can be
                                {' '}
                                saved or launched.
                            </div>
                            <ul className={styles.validationList}>
                                {validationMessages.map(message => (
                                    <li key={message}>{message}</li>
                                ))}
                                {hasFailedTester
                                    ? (
                                        <li>
                                            Selected scorer compilation must succeed before challenge
                                            {' '}
                                            actions are re-enabled.
                                        </li>
                                    )
                                    : undefined}
                                {testerLoadError
                                    ? <li>{testerLoadError}</li>
                                    : undefined}
                                {loadError
                                    ? <li>{loadError}</li>
                                    : undefined}
                            </ul>
                        </>
                    )
                    : <div>Scorer configuration is valid and ready to save.</div>}
            </section>

            <div className={styles.footerActions}>
                <Button
                    disabled={!isReadyToSave}
                    label={isSaving ? 'Saving...' : 'Save Scorer Config'}
                    onClick={handleSaveScorerConfigClick}
                    primary
                    size='sm'
                    type='button'
                />
            </div>

            {showTestSubmissionResultModal && modalTestSubmissionResult
                ? (
                    <BaseModal
                        buttons={(
                            <Button
                                label='Close'
                                onClick={handleCloseTestSubmissionResultModal}
                                primary
                            />
                        )}
                        onClose={handleCloseTestSubmissionResultModal}
                        open
                        size='md'
                        title={
                            normalizeTestSubmissionStatus(modalTestSubmissionResult.status) === 'FAILED'
                                ? 'Validation Scoring Failed'
                                : 'Validation Scoring Complete'
                        }
                    >
                        <div className={styles.modalContent}>
                            <div className={styles.resultGrid}>
                                <div className={styles.resultItem}>
                                    <span>Status</span>
                                    <strong>{normalizeTestSubmissionStatus(modalTestSubmissionResult.status)}</strong>
                                </div>
                                <div className={styles.resultItem}>
                                    <span>Score</span>
                                    <strong>{formatTestSubmissionScore(modalTestSubmissionResult.score)}</strong>
                                </div>
                                <div className={styles.resultItem}>
                                    <span>Phase</span>
                                    <strong>{modalTestSubmissionResult.configType}</strong>
                                </div>
                                <div className={styles.resultItem}>
                                    <span>Tests</span>
                                    <strong>{formatTestSubmissionTests(modalTestSubmissionResult)}</strong>
                                </div>
                                <div className={styles.resultItem}>
                                    <span>Progress</span>
                                    <strong>{formatTestSubmissionProgress(modalTestSubmissionResult.progress)}</strong>
                                </div>
                                <div className={styles.resultItem}>
                                    <span>Completed</span>
                                    <strong>{formatDateTime(modalTestSubmissionResult.completedAt)}</strong>
                                </div>
                            </div>

                            {modalTestSubmissionResult.message
                                ? (
                                    <div className={styles.resultMessage}>
                                        {modalTestSubmissionResult.message}
                                    </div>
                                )
                                : undefined}

                            <div className={styles.resultMeta}>
                                <span>File</span>
                                <strong>{modalTestSubmissionResult.fileName}</strong>
                            </div>

                            {modalTestSubmissionResult.taskId
                                ? (
                                    <div className={styles.resultMeta}>
                                        <span>Task</span>
                                        <strong>{modalTestSubmissionResult.taskId}</strong>
                                    </div>
                                )
                                : undefined}

                            {modalTestSubmissionResult.cloudWatchLogsConsoleUrl
                                ? (
                                    <a
                                        className={styles.resultLink}
                                        href={modalTestSubmissionResult.cloudWatchLogsConsoleUrl}
                                        rel='noreferrer'
                                        target='_blank'
                                    >
                                        Open CloudWatch logs
                                    </a>
                                )
                                : undefined}

                            {formatJsonPreview(modalTestSubmissionResult.metadata)
                                ? (
                                    <div className={styles.resultJsonSection}>
                                        <span>Metadata</span>
                                        <pre>{formatJsonPreview(modalTestSubmissionResult.metadata)}</pre>
                                    </div>
                                )
                                : undefined}

                            {formatJsonPreview(modalTestSubmissionResult.currentReview)
                                ? (
                                    <div className={styles.resultJsonSection}>
                                        <span>Current Review</span>
                                        <pre>{formatJsonPreview(modalTestSubmissionResult.currentReview)}</pre>
                                    </div>
                                )
                                : undefined}

                            {formatJsonPreview(modalTestSubmissionResult.impactedReviews)
                                ? (
                                    <div className={styles.resultJsonSection}>
                                        <span>Impacted Reviews</span>
                                        <pre>{formatJsonPreview(modalTestSubmissionResult.impactedReviews)}</pre>
                                    </div>
                                )
                                : undefined}
                        </div>
                    </BaseModal>
                )
                : undefined}

            {showNewTesterModal
                ? (
                    <TesterModal
                        mode='create'
                        onClose={handleCloseNewTesterModal}
                        onCreated={handleTesterCreated}
                    />
                )
                : undefined}

            {showNewVersionModal && currentVersionTarget
                ? (
                    <TesterModal
                        existingTester={currentVersionTarget}
                        maxExistingVersion={currentVersionMax}
                        mode='version'
                        onClose={handleCloseNewVersionModal}
                        onCreated={handleTesterCreated}
                    />
                )
                : undefined}

            {showCompilationErrorsModal && selectedTester?.compilationStatus === 'FAILED'
                ? (
                    <CompilationErrorModal
                        onClose={handleCloseCompilationErrorsModal}
                        tester={selectedTester}
                    />
                )
                : undefined}
        </div>
    )
}

export default MarathonMatchScorerSection
