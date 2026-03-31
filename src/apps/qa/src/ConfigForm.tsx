/* eslint-disable complexity, max-len, no-void, ordered-imports/ordered-imports, react/jsx-no-bind, sort-keys, unicorn/no-null */
import { FC, FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import InputHandleAutocomplete from '~/apps/admin/src/platform/gamification-admin/src/game-lib/member-autocomplete/InputHandleAutocomplete'
import { MembersAutocompeteResult } from '~/apps/admin/src/platform/gamification-admin/src/game-lib/member-autocomplete/input-handle-functions'
import { LoadingSpinner } from '~/libs/ui'
import InputSelectReact, { InputSelectOption } from '~/libs/ui/lib/components/form/form-groups/form-input/input-select-react/InputSelectReact'

import { FLOW_DEFINITIONS, flowVariantToConfigKey, getFlowConfig } from './flows'
import {
    fetchChallengeTracksAsync,
    fetchChallengeTypesAsync,
    fetchMembersAsync,
    fetchProjectsAsync,
    fetchScorecardsAsync,
    fetchTimelineTemplatesAsync,
    saveFlowConfigAsync,
} from './service'
import type {
    AppConfig,
    ChallengeTrackOption,
    ChallengeTypeOption,
    DesignConfig,
    First2FinishConfig,
    FlowConfig,
    FlowVariant,
    FullChallengeConfig,
    ProjectOption,
    ScorecardOption,
    TimelineTemplateOption,
    TopgearConfig,
} from './types'

interface ConfigFormProps {
    config: AppConfig
    flow: FlowVariant
    onSaved: (config: AppConfig) => void
}

type ListInputs = {
    prizes: string
    prize: string
}

type FlowConfigState = FullChallengeConfig | First2FinishConfig | DesignConfig

const AUTO_SAVE_DELAY_MS = 750

/**
 * Merges fetched project options into the local project-option cache.
 *
 * @param current Currently cached project options.
 * @param next Newly fetched project options.
 * @returns Deduplicated project option list keyed by project id.
 */
function mergeProjectOptions(current: ProjectOption[], next: ProjectOption[]): ProjectOption[] {
    const merged = new Map<string, ProjectOption>()

    current.forEach(item => merged.set(item.id, item))
    next.forEach(item => merged.set(item.id, item))

    return Array.from(merged.values())
}

/**
 * Builds the selected option list required by single-value handle autocompletes.
 *
 * @param value Current member handle value.
 * @returns Matching select options for the current value.
 */
function createSingleHandleOptions(value?: string): InputSelectOption[] {
    const trimmedValue = value?.trim() || ''

    return trimmedValue
        ? [{ label: trimmedValue, value: trimmedValue }]
        : []
}

/**
 * Seeds the multi-handle autocomplete with stored handles.
 *
 * @param handles Persisted handle values.
 * @returns Seed member objects accepted by the shared autocomplete component.
 */
function mapHandlesToMembers(handles: string[]): MembersAutocompeteResult[] {
    return handles
        .filter(Boolean)
        .map(handle => ({
            firstName: '',
            handle,
            lastName: '',
            userId: handle,
        }))
}

/**
 * Applies a flow-scoped config update to the full QA app config.
 *
 * @param config Current QA app config.
 * @param flow Flow whose branch is being updated.
 * @param nextFlowConfig Updated branch config.
 * @returns App config with the requested flow branch replaced.
 */
function buildUpdatedAppConfig(
    config: AppConfig,
    flow: FlowVariant,
    nextFlowConfig: FlowConfigState,
): AppConfig {
    return {
        ...config,
        fullChallenge: flow === 'full'
            ? nextFlowConfig as FullChallengeConfig
            : config.fullChallenge,
        designChallenge: flow === 'design'
            ? nextFlowConfig as DesignConfig
            : config.designChallenge,
        designSingleChallenge: flow === 'designSingle'
            ? nextFlowConfig as FullChallengeConfig
            : config.designSingleChallenge,
        designFailScreeningChallenge: flow === 'designFailScreening'
            ? nextFlowConfig as DesignConfig
            : config.designFailScreeningChallenge,
        designFailReviewChallenge: flow === 'designFailReview'
            ? nextFlowConfig as DesignConfig
            : config.designFailReviewChallenge,
        first2finish: flow === 'first2finish'
            ? nextFlowConfig as First2FinishConfig
            : config.first2finish,
        topgear: flow === 'topgear' || flow === 'topgearLate'
            ? nextFlowConfig as TopgearConfig
            : config.topgear,
    }
}

/**
 * Serializes a flow config so autosave can detect real changes.
 *
 * @param config Flow config under edit.
 * @returns Stable JSON string for equality checks.
 */
function serializeFlowConfig(config: FlowConfigState): string {
    return JSON.stringify(config)
}

/**
 * Renders and persists the editable config form for the active QA flow.
 */
const ConfigForm: FC<ConfigFormProps> = (props: ConfigFormProps) => {
    const [types, setTypes] = useState<ChallengeTypeOption[]>([])
    const [tracks, setTracks] = useState<ChallengeTrackOption[]>([])
    const [timelineTemplates, setTimelineTemplates] = useState<TimelineTemplateOption[]>([])
    const [scorecards, setScorecards] = useState<ScorecardOption[]>([])
    const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([])
    const [isRefDataLoading, setIsRefDataLoading] = useState(false)
    const [refDataError, setRefDataError] = useState<string | null>(null)
    const [isScorecardsLoading, setIsScorecardsLoading] = useState(false)
    const [scorecardsError, setScorecardsError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [workingConfig, setWorkingConfig] = useState<AppConfig>(props.config)
    const [formConfig, setFormConfig] = useState<FlowConfigState>(
        () => getFlowConfig(props.config, props.flow) as FlowConfigState,
    )
    const [listInputs, setListInputs] = useState<ListInputs>({
        prizes: '',
        prize: '',
    })
    const autoSaveTimeoutRef = useRef<number | null>(null)
    const isHydratingFormRef = useRef(true)
    const lastSavedConfigRef = useRef<string>(
        serializeFlowConfig(getFlowConfig(props.config, props.flow) as FlowConfigState),
    )
    const saveRequestIdRef = useRef(0)

    const isFull = props.flow === 'full'
    const isFullLike = props.flow === 'full' || props.flow === 'designSingle'
    const isDesign = props.flow === 'design'
        || props.flow === 'designFailScreening'
        || props.flow === 'designFailReview'
    const iterativeLabel = props.flow === 'topgear'
        ? 'Topgear Task'
        : props.flow === 'topgearLate'
            ? 'Topgear Task (Late)'
            : 'First2Finish'
    const refDataStatus = isRefDataLoading
        ? 'Loading challenge types, tracks, and timeline templates...'
        : refDataError
    const scorecardsStatus = isScorecardsLoading ? 'Loading scorecards...' : scorecardsError
    const isScorecardsDisabled = isScorecardsLoading || Boolean(scorecardsError)

    const activeConfig = useMemo<FlowConfig>(
        () => getFlowConfig(workingConfig, props.flow),
        [props.flow, workingConfig],
    )
    const fullLikeConfig = isFullLike ? formConfig as FullChallengeConfig : undefined
    const designConfig = isDesign ? formConfig as DesignConfig : undefined
    const iterativeConfig = !isFullLike && !isDesign ? formConfig as First2FinishConfig : undefined

    const currentProjectOption = useMemo<ProjectOption>(() => {
        const currentProjectId = String(formConfig.projectId)

        return projectOptions.find(item => item.id === currentProjectId) || {
            id: currentProjectId,
            label: currentProjectId,
            name: currentProjectId,
        }
    }, [formConfig.projectId, projectOptions])

    const selectableProjectOptions = useMemo<InputSelectOption[]>(
        () => [
            currentProjectOption,
            ...projectOptions.filter(item => item.id !== currentProjectOption.id),
        ].map(item => ({
            label: item.label,
            value: item.id,
        })),
        [currentProjectOption, projectOptions],
    )

    const selectableTimelineTemplates = useMemo<TimelineTemplateOption[]>(() => {
        const shouldFilter = Boolean(formConfig.challengeTypeId && formConfig.challengeTrackId)
        const filtered = shouldFilter
            ? timelineTemplates.filter(template => (
                template.typeId === formConfig.challengeTypeId
                && template.trackId === formConfig.challengeTrackId
            ))
            : timelineTemplates

        if (
            formConfig.timelineTemplateId
            && !filtered.some(template => template.id === formConfig.timelineTemplateId)
        ) {
            const currentTemplate = timelineTemplates.find(
                template => template.id === formConfig.timelineTemplateId,
            )

            if (currentTemplate) {
                return [currentTemplate, ...filtered]
            }
        }

        return filtered
    }, [
        formConfig.challengeTrackId,
        formConfig.challengeTypeId,
        formConfig.timelineTemplateId,
        timelineTemplates,
    ])

    useEffect(() => {
        const loadReferenceData = async (): Promise<void> => {
            try {
                setIsRefDataLoading(true)
                setRefDataError(null)
                const [challengeTypes, challengeTracks, availableTimelineTemplates] = await Promise.all([
                    fetchChallengeTypesAsync(),
                    fetchChallengeTracksAsync(),
                    fetchTimelineTemplatesAsync(),
                ])
                setTypes(challengeTypes)
                setTracks(challengeTracks)
                setTimelineTemplates(availableTimelineTemplates)
            } catch {
                setRefDataError('Failed to load challenge types, tracks, and timeline templates.')
                setTypes([])
                setTracks([])
                setTimelineTemplates([])
            } finally {
                setIsRefDataLoading(false)
            }
        }

        void loadReferenceData()
    }, [])

    useEffect(() => {
        setWorkingConfig(props.config)
    }, [props.config])

    useEffect(() => {
        if (activeConfig === formConfig) {
            return
        }

        isHydratingFormRef.current = true
        lastSavedConfigRef.current = serializeFlowConfig(activeConfig as FlowConfigState)
        setFormConfig(activeConfig as FlowConfigState)
        setSaveError(null)
        setListInputs({
            prizes: (isFullLike || isDesign) && Array.isArray((activeConfig as FullChallengeConfig | DesignConfig).prizes)
                ? (activeConfig as FullChallengeConfig | DesignConfig).prizes.join(', ')
                : '',
            prize: !isFullLike && !isDesign && typeof (activeConfig as First2FinishConfig).prize === 'number'
                ? String((activeConfig as First2FinishConfig).prize)
                : '',
        })
    }, [activeConfig, formConfig, isDesign, isFullLike])

    useEffect(() => {
        setWorkingConfig(previous => buildUpdatedAppConfig(previous, props.flow, formConfig))
    }, [formConfig, props.flow])

    useEffect(() => {
        const loadScorecards = async (): Promise<void> => {
            setScorecardsError(null)

            if (!formConfig.challengeTypeId || !formConfig.challengeTrackId) {
                setScorecards([])
                setIsScorecardsLoading(false)
                return
            }

            const typeEntry = types.find(item => item.id === formConfig.challengeTypeId)
            const trackEntry = tracks.find(item => item.id === formConfig.challengeTrackId)
            const typeName = typeEntry?.name || formConfig.challengeTypeId
            const trackCode = trackEntry?.track

            if (!typeName || !trackCode) {
                setScorecards([])
                setIsScorecardsLoading(false)
                return
            }

            try {
                setIsScorecardsLoading(true)
                const items = await fetchScorecardsAsync(typeName, trackCode)
                setScorecards(items)
            } catch {
                setScorecardsError('Failed to load scorecards.')
                setScorecards([])
            } finally {
                setIsScorecardsLoading(false)
            }
        }

        void loadScorecards()
    }, [formConfig.challengeTrackId, formConfig.challengeTypeId, tracks, types])

    useEffect(() => {
        if (isHydratingFormRef.current) {
            isHydratingFormRef.current = false
            return undefined
        }

        const serializedConfig = serializeFlowConfig(formConfig)
        if (serializedConfig === lastSavedConfigRef.current) {
            return undefined
        }

        if (autoSaveTimeoutRef.current !== null) {
            window.clearTimeout(autoSaveTimeoutRef.current)
        }

        autoSaveTimeoutRef.current = window.setTimeout(() => {
            autoSaveTimeoutRef.current = null
            const requestId = saveRequestIdRef.current + 1
            saveRequestIdRef.current = requestId
            setIsSaving(true)
            setSaveError(null)

            void saveFlowConfigAsync(flowVariantToConfigKey(props.flow), formConfig)
                .then(() => {
                    if (saveRequestIdRef.current !== requestId) {
                        return
                    }

                    lastSavedConfigRef.current = serializedConfig
                    setSaveError(null)
                })
                .catch(() => {
                    if (saveRequestIdRef.current !== requestId) {
                        return
                    }

                    setSaveError('Failed to save QA configuration.')
                })
                .finally(() => {
                    if (saveRequestIdRef.current === requestId) {
                        setIsSaving(false)
                    }
                })
        }, AUTO_SAVE_DELAY_MS)

        return () => {
            if (autoSaveTimeoutRef.current !== null) {
                window.clearTimeout(autoSaveTimeoutRef.current)
                autoSaveTimeoutRef.current = null
            }
        }
    }, [formConfig, props.flow])

    /**
     * Persists the active flow config through the QA service and updates parent state on success.
     *
     * @param event Form submission event.
     * @returns Promise resolved after the save flow finishes.
     */
    const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault()

        if (autoSaveTimeoutRef.current !== null) {
            window.clearTimeout(autoSaveTimeoutRef.current)
            autoSaveTimeoutRef.current = null
        }

        const payload = buildUpdatedAppConfig(workingConfig, props.flow, formConfig)
        const serializedConfig = serializeFlowConfig(formConfig)
        const shouldPersist = serializedConfig !== lastSavedConfigRef.current || Boolean(saveError)
        const requestId = saveRequestIdRef.current + 1
        saveRequestIdRef.current = requestId

        try {
            setIsSaving(true)
            setSaveError(null)

            if (shouldPersist) {
                await saveFlowConfigAsync(flowVariantToConfigKey(props.flow), formConfig)
                if (saveRequestIdRef.current === requestId) {
                    lastSavedConfigRef.current = serializedConfig
                }
            }

            props.onSaved(payload)
        } catch {
            if (saveRequestIdRef.current === requestId) {
                setSaveError('Failed to save QA configuration.')
            }
        } finally {
            if (saveRequestIdRef.current === requestId) {
                setIsSaving(false)
            }
        }
    }

    /**
     * Updates a single field on the flow-specific form config state.
     *
     * @param key Config field to update.
     * @param value Updated field value.
     */
    const update = (key: string, value: unknown): void => {
        setSaveError(null)
        setFormConfig(previous => ({
            ...previous,
            [key]: value,
        }) as FlowConfigState)
    }

    /**
     * Updates checkpoint prize amount from the string input field.
     *
     * @param value Raw numeric input value.
     */
    const updateCheckpointPrizeAmount = (value: string): void => {
        const amount = Number.parseFloat(value)
        update('checkpointPrizeAmount', Number.isNaN(amount) ? 0 : Math.max(0, amount))
    }

    /**
     * Updates checkpoint prize count from the string input field.
     *
     * @param value Raw numeric input value.
     */
    const updateCheckpointPrizeCount = (value: string): void => {
        const count = Number.parseInt(value, 10)
        update('checkpointPrizeCount', Number.isNaN(count) ? 0 : Math.max(0, count))
    }

    /**
     * Updates the full-style prize tuple from the comma-delimited text input.
     *
     * @param value Raw comma-delimited prize input.
     */
    const updatePrizes = (value: string): void => {
        setListInputs(previous => ({ ...previous, prizes: value }))
        const entries = value
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean)
            .map(entry => Number(entry))
            .filter(entry => !Number.isNaN(entry))
        update('prizes', entries)
    }

    /**
     * Updates the iterative winner prize from the freeform text input.
     *
     * @param value Raw numeric input value.
     */
    const updatePrize = (value: string): void => {
        setListInputs(previous => ({ ...previous, prize: value }))
        if (!value.trim()) {
            update('prize', 0)
            return
        }

        const amount = Number.parseFloat(value)
        if (!Number.isNaN(amount)) {
            update('prize', amount)
        }
    }

    /**
     * Loads project options for the async project autocomplete.
     *
     * @param inputValue Search text entered by the user.
     * @param callback React-select callback that receives the next option list.
     */
    const loadProjectOptions = (
        inputValue: string,
        callback: (options: InputSelectOption[]) => void,
    ): void => {
        void fetchProjectsAsync(inputValue)
            .then(items => {
                setProjectOptions(previous => mergeProjectOptions(previous, items))
                callback(items.map(item => ({
                    label: item.label,
                    value: item.id,
                })))
            })
            .catch(() => {
                callback([])
            })
    }

    /**
     * Loads member-handle options for the single-value handle autocompletes.
     *
     * @param inputValue Search text entered by the user.
     * @param callback React-select callback that receives the next option list.
     */
    const loadMemberOptions = (
        inputValue: string,
        callback: (options: InputSelectOption[]) => void,
    ): void => {
        void fetchMembersAsync(inputValue)
            .then(callback)
            .catch(() => {
                callback([])
            })
    }

    return (
        <form className='qa-card' onSubmit={save}>
            <h3 style={{ marginTop: 0 }}>
                Edit
                {' '}
                {FLOW_DEFINITIONS[props.flow].tabLabel}
                {' '}
                Configuration
            </h3>

            <div className='qa-form-grid'>
                <label className='qa-field'>
                    <span>Challenge name prefix</span>
                    <input
                        value={formConfig.challengeNamePrefix}
                        onChange={event => update('challengeNamePrefix', event.target.value)}
                    />
                </label>
                <InputSelectReact
                    async
                    name='projectId'
                    label='Project ID'
                    placeholder='Start typing the project name'
                    value={String(formConfig.projectId)}
                    options={selectableProjectOptions}
                    loadOptions={loadProjectOptions}
                    onChange={event => update('projectId', Number(event.target.value))}
                    classNameWrapper='qa-field'
                />
            </div>

            <div className='qa-form-grid'>
                <label className='qa-field'>
                    <span>Challenge type</span>
                    <select
                        value={formConfig.challengeTypeId}
                        onChange={event => update('challengeTypeId', event.target.value)}
                        disabled={isRefDataLoading}
                    >
                        <option value=''>-- Select --</option>
                        {types.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </label>
                <label className='qa-field'>
                    <span>Challenge track</span>
                    <select
                        value={formConfig.challengeTrackId}
                        onChange={event => update('challengeTrackId', event.target.value)}
                        disabled={isRefDataLoading}
                    >
                        <option value=''>-- Select --</option>
                        {tracks.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                </label>
            </div>
            {refDataStatus ? (
                <small className='qa-inline-note qa-status-text'>{refDataStatus}</small>
            ) : null}

            <div className='qa-form-grid'>
                <label className='qa-field'>
                    <span>Timeline template</span>
                    <select
                        value={formConfig.timelineTemplateId}
                        onChange={event => update('timelineTemplateId', event.target.value)}
                        disabled={isRefDataLoading || (!isFull && !isDesign)}
                    >
                        <option value=''>-- Select --</option>
                        {selectableTimelineTemplates.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    {!isFull && !isDesign ? (
                        <small className='qa-inline-note'>
                            {iterativeLabel}
                            {' '}
                            uses a fixed timeline template.
                        </small>
                    ) : null}
                </label>
                {!isDesign ? (
                    <label className='qa-field'>
                        <span>Scorecard</span>
                        <select
                            value={formConfig.scorecardId}
                            onChange={event => update('scorecardId', event.target.value)}
                            disabled={isScorecardsDisabled}
                        >
                            <option value=''>-- Select --</option>
                            {scorecards.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                ) : null}
            </div>
            {scorecardsStatus ? (
                <small className='qa-inline-note qa-status-text'>{scorecardsStatus}</small>
            ) : null}

            {isDesign ? (
                <div className='qa-form-grid qa-form-grid--triple'>
                    <label className='qa-field'>
                        <span>Review Scorecard</span>
                        <select
                            value={(formConfig as DesignConfig).reviewScorecardId || formConfig.scorecardId}
                            onChange={event => update('reviewScorecardId', event.target.value)}
                            disabled={isScorecardsDisabled}
                        >
                            <option value=''>-- Select --</option>
                            {scorecards.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className='qa-field'>
                        <span>Screening Scorecard</span>
                        <select
                            value={(formConfig as DesignConfig).screeningScorecardId || formConfig.scorecardId}
                            onChange={event => update('screeningScorecardId', event.target.value)}
                            disabled={isScorecardsDisabled}
                        >
                            <option value=''>-- Select --</option>
                            {scorecards.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className='qa-field'>
                        <span>Approval Scorecard</span>
                        <select
                            value={(formConfig as DesignConfig).approvalScorecardId || formConfig.scorecardId}
                            onChange={event => update('approvalScorecardId', event.target.value)}
                            disabled={isScorecardsDisabled}
                        >
                            <option value=''>-- Select --</option>
                            {scorecards.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
            ) : null}

            {isDesign ? (
                <div className='qa-form-grid'>
                    <label className='qa-field'>
                        <span>Checkpoint Screening Scorecard</span>
                        <select
                            value={(
                                formConfig as DesignConfig
                            ).checkpointScreeningScorecardId || (formConfig as DesignConfig).checkpointScorecardId}
                            onChange={event => update('checkpointScreeningScorecardId', event.target.value)}
                            disabled={isScorecardsDisabled}
                        >
                            <option value=''>-- Select --</option>
                            {scorecards.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className='qa-field'>
                        <span>Checkpoint Review Scorecard</span>
                        <select
                            value={(
                                formConfig as DesignConfig
                            ).checkpointReviewScorecardId || (formConfig as DesignConfig).checkpointScorecardId}
                            onChange={event => update('checkpointReviewScorecardId', event.target.value)}
                            disabled={isScorecardsDisabled}
                        >
                            <option value=''>-- Select --</option>
                            {scorecards.map(item => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </label>
                </div>
            ) : null}

            {isFullLike ? (
                <>
                    <div className='qa-form-grid'>
                        <label className='qa-field'>
                            <span>Submissions per submitter</span>
                            <input
                                type='number'
                                min={1}
                                value={fullLikeConfig?.submissionsPerSubmitter}
                                onChange={event => update('submissionsPerSubmitter', Number(event.target.value))}
                            />
                        </label>
                        <div className='qa-field'>
                            <InputHandleAutocomplete
                                label='Reviewers'
                                name='reviewers'
                                onChange={members => update('reviewers', members.map(item => item.handle))}
                                tabIndex={0}
                                value={mapHandlesToMembers(fullLikeConfig?.reviewers || [])}
                            />
                        </div>
                    </div>
                    <div className='qa-form-grid'>
                        <InputSelectReact
                            async
                            creatable
                            name='screener'
                            label='Screener handle'
                            placeholder='Start typing a member handle'
                            value={fullLikeConfig?.screener || ''}
                            options={createSingleHandleOptions(fullLikeConfig?.screener)}
                            loadOptions={loadMemberOptions}
                            onChange={event => update('screener', event.target.value.trim())}
                            classNameWrapper='qa-field'
                        />
                        <InputSelectReact
                            async
                            creatable
                            name='copilotHandle'
                            label='Copilot handle'
                            placeholder='Start typing a member handle'
                            value={formConfig.copilotHandle}
                            options={createSingleHandleOptions(formConfig.copilotHandle)}
                            loadOptions={loadMemberOptions}
                            onChange={event => update('copilotHandle', event.target.value.trim())}
                            classNameWrapper='qa-field'
                        />
                    </div>
                    <div className='qa-form-grid'>
                        <div className='qa-field qa-field--full'>
                            <InputHandleAutocomplete
                                label='Submitters'
                                name='submitters'
                                onChange={members => update('submitters', members.map(item => item.handle))}
                                tabIndex={0}
                                value={mapHandlesToMembers(formConfig.submitters)}
                            />
                        </div>
                    </div>
                </>
            ) : isDesign ? (
                <div className='qa-form-grid'>
                    <label className='qa-field'>
                        <span>Submissions per submitter</span>
                        <input
                            type='number'
                            min={1}
                            value={designConfig?.submissionsPerSubmitter}
                            onChange={event => update('submissionsPerSubmitter', Number(event.target.value))}
                        />
                    </label>
                    <InputSelectReact
                        async
                        creatable
                        name='reviewer'
                        label='Reviewer handle'
                        placeholder='Start typing a member handle'
                        value={designConfig?.reviewer || ''}
                        options={createSingleHandleOptions(designConfig?.reviewer)}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('reviewer', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                </div>
            ) : (
                <div className='qa-form-grid'>
                    <InputSelectReact
                        async
                        creatable
                        name='reviewer'
                        label='Iterative Reviewer handle'
                        placeholder='Start typing a member handle'
                        value={iterativeConfig?.reviewer || ''}
                        options={createSingleHandleOptions(iterativeConfig?.reviewer)}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('reviewer', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                    <InputSelectReact
                        async
                        creatable
                        name='copilotHandle'
                        label='Copilot handle'
                        placeholder='Start typing a member handle'
                        value={formConfig.copilotHandle}
                        options={createSingleHandleOptions(formConfig.copilotHandle)}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('copilotHandle', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                </div>
            )}

            {isDesign ? (
                <div className='qa-form-grid'>
                    <InputSelectReact
                        async
                        creatable
                        name='copilotHandle'
                        label='Copilot handle'
                        placeholder='Start typing a member handle'
                        value={formConfig.copilotHandle}
                        options={createSingleHandleOptions(formConfig.copilotHandle)}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('copilotHandle', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                    <InputSelectReact
                        async
                        creatable
                        name='screener'
                        label='Screener handle'
                        placeholder='Start typing a member handle'
                        value={designConfig?.screener || designConfig?.screeningReviewer || designConfig?.reviewer || ''}
                        options={createSingleHandleOptions(
                            designConfig?.screener
                            || designConfig?.screeningReviewer
                            || designConfig?.reviewer,
                        )}
                        loadOptions={loadMemberOptions}
                        onChange={event => {
                            const value = event.target.value.trim()
                            update('screener', value)
                            update('screeningReviewer', value)
                        }}
                        classNameWrapper='qa-field'
                    />
                </div>
            ) : null}

            {isDesign ? (
                <div className='qa-form-grid'>
                    <InputSelectReact
                        async
                        creatable
                        name='approver'
                        label='Approver handle'
                        placeholder='Start typing a member handle'
                        value={designConfig?.approver || designConfig?.reviewer || ''}
                        options={createSingleHandleOptions(designConfig?.approver || designConfig?.reviewer)}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('approver', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                    <InputSelectReact
                        async
                        creatable
                        name='checkpointScreener'
                        label='Checkpoint Screener handle'
                        placeholder='Start typing a member handle'
                        value={
                            designConfig?.checkpointScreener
                            || designConfig?.screener
                            || designConfig?.screeningReviewer
                            || designConfig?.reviewer
                            || ''
                        }
                        options={createSingleHandleOptions(
                            designConfig?.checkpointScreener
                            || designConfig?.screener
                            || designConfig?.screeningReviewer
                            || designConfig?.reviewer,
                        )}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('checkpointScreener', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                </div>
            ) : null}

            {isDesign ? (
                <div className='qa-form-grid'>
                    <InputSelectReact
                        async
                        creatable
                        name='checkpointReviewer'
                        label='Checkpoint Reviewer handle'
                        placeholder='Start typing a member handle'
                        value={designConfig?.checkpointReviewer || designConfig?.reviewer || ''}
                        options={createSingleHandleOptions(
                            designConfig?.checkpointReviewer || designConfig?.reviewer,
                        )}
                        loadOptions={loadMemberOptions}
                        onChange={event => update('checkpointReviewer', event.target.value.trim())}
                        classNameWrapper='qa-field'
                    />
                    <div className='qa-field'>
                        <InputHandleAutocomplete
                            label='Submitters'
                            name='submitters'
                            onChange={members => update('submitters', members.map(item => item.handle))}
                            tabIndex={0}
                            value={mapHandlesToMembers(formConfig.submitters)}
                        />
                    </div>
                </div>
            ) : null}

            {!isFull && !isDesign ? (
                <div className='qa-form-grid'>
                    <div className='qa-field'>
                        <InputHandleAutocomplete
                            label='Submitters'
                            name='submitters'
                            onChange={members => update('submitters', members.map(item => item.handle))}
                            tabIndex={0}
                            value={mapHandlesToMembers(formConfig.submitters)}
                        />
                    </div>
                    <label className='qa-field'>
                        <span>Prize (winner)</span>
                        <input
                            value={listInputs.prize}
                            onChange={event => updatePrize(event.target.value)}
                        />
                    </label>
                </div>
            ) : null}

            {isFull || isDesign ? (
                <div className='qa-form-grid'>
                    <label className='qa-field qa-field--full'>
                        <span>Prizes (1st, 2nd, 3rd)</span>
                        <input
                            value={listInputs.prizes}
                            onChange={event => updatePrizes(event.target.value)}
                        />
                    </label>
                </div>
            ) : null}

            {isDesign ? (
                <div className='qa-form-grid'>
                    <label className='qa-field'>
                        <span>Checkpoint prize amount</span>
                        <input
                            type='number'
                            min={0}
                            value={(formConfig as DesignConfig).checkpointPrizeAmount ?? 0}
                            onChange={event => updateCheckpointPrizeAmount(event.target.value)}
                        />
                    </label>
                    <label className='qa-field'>
                        <span>Checkpoint prize count</span>
                        <input
                            type='number'
                            min={0}
                            step={1}
                            value={(formConfig as DesignConfig).checkpointPrizeCount ?? 0}
                            onChange={event => updateCheckpointPrizeCount(event.target.value)}
                        />
                    </label>
                </div>
            ) : null}

            <div className='qa-form-grid'>
                <label className='qa-field qa-field--full'>
                    <span>Submission zip path</span>
                    <input
                        value={formConfig.submissionZipPath}
                        onChange={event => update('submissionZipPath', event.target.value)}
                        placeholder='./path/to/submission.zip'
                    />
                </label>
            </div>

            {!isFull && !isDesign ? (
                <div className='qa-form-grid'>
                    <div className='qa-field qa-field--full'>
                        <span>Additional Notes</span>
                        <div className='qa-inline-note'>
                            {iterativeLabel}
                            {' '}
                            runs with one reviewer and iterative submissions.
                        </div>
                    </div>
                </div>
            ) : null}

            {saveError ? (
                <small className='qa-inline-note qa-status-text'>{saveError}</small>
            ) : null}

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type='submit' className='qa-primary-button' disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                </button>
                {isSaving ? <LoadingSpinner inline message='Saving configuration…' /> : null}
            </div>
        </form>
    )
}

export default ConfigForm
