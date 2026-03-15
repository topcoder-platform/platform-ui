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

import { Button } from '~/libs/ui'

import {
    ChallengePhase,
    CreateMarathonMatchConfigInput,
    MarathonMatchConfig,
    MarathonMatchDefaults,
    MarathonMatchPhaseConfig,
    MarathonMatchTester,
    MarathonMatchTesterSummary,
    UpdateMarathonMatchConfigInput,
} from '../../../../../lib/models'
import {
    createMarathonMatchConfig,
    fetchMarathonMatchConfig,
    fetchMarathonMatchDefaults,
    fetchTester,
    fetchTesters,
    updateMarathonMatchConfig,
} from '../../../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../../lib/utils'

import { TesterModal } from './TesterModal'
import styles from './MarathonMatchScorerSection.module.scss'

const DEFAULT_SCORER_NAME = 'Marathon Match Scorer'
const DEFAULT_SCORE_DIRECTION = 'MAXIMIZE'
const POLL_INTERVAL_MS = 5000
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
                <select onChange={props.onPhaseChange} value={props.phaseId}>
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
    if (phase.id) {
        return phase.id
    }

    return phase.phaseId || ''
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
    const [loadError, setLoadError] = useState<string | undefined>()
    const [saveError, setSaveError] = useState<string | undefined>()
    const [testerLoadError, setTesterLoadError] = useState<string | undefined>()
    const [showNewTesterModal, setShowNewTesterModal] = useState<boolean>(false)
    const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false)

    const phaseOptions = useMemo(
        (): PhaseOption[] => phases
            .map(phase => ({
                label: phase.name?.trim() || getChallengePhaseId(phase),
                value: getChallengePhaseId(phase),
            }))
            .filter(option => !!option.value),
        [phases],
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

    useEffect(() => {
        phaseListRef.current = phases
    }, [phases])

    useEffect(() => () => {
        isMountedRef.current = false
    }, [])

    useEffect(() => {
        let isMounted = true

        clearPollingTimer()
        setIsLoading(true)
        setLoadError(undefined)
        setSaveError(undefined)
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
        }
    }, [
        clearPollingTimer,
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
        onScorerConfigChange(hasUnsavedChanges, hasBlockingError)
    }, [
        hasBlockingError,
        hasUnsavedChanges,
        onScorerConfigChange,
    ])

    useEffect(() => {
        clearPollingTimer()

        if (selectedTester?.compilationStatus !== 'PENDING') {
            return undefined
        }

        pollingTimerRef.current = window.setTimeout(() => {
            loadTesterById(selectedTester.id, {
                clearSelectionOnFailure: false,
                setBlockingErrorOnFailure: false,
                showErrorToast: false,
            })
                .catch(() => undefined)
        }, POLL_INTERVAL_MS)

        return clearPollingTimer
    }, [
        clearPollingTimer,
        loadTesterById,
        selectedTester?.compilationStatus,
        selectedTester?.id,
    ])

    const currentTesterId = draft?.testerId || ''
    const currentVersionTarget = selectedTester
    const currentVersionMax = currentVersionTarget?.name
        ? maxTesterVersionByName[currentVersionTarget.name]
        : undefined
    const isReadyToSave = !!draft && !isSaving && !hasBlockingError && hasUnsavedChanges

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
                        <strong>Scorer compilation failed.</strong>
                        <div>{selectedTester.compilationError || 'Compilation failed without an error message.'}</div>
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
        </div>
    )
}

export default MarathonMatchScorerSection
