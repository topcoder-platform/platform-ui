import {
    ChangeEvent,
    FC,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import type {
    DesignConfig,
    First2FinishConfig,
    FlowConfigUnion,
    FlowVariant,
    FullChallengeConfig,
    TopgearConfig,
} from '../../types'
import { fetchChallengeTracks, fetchChallengeTypes, fetchScorecards } from '../../services/api.service'

import styles from './ConfigForm.module.scss'

type RefDataItem = {
    id: string
    name: string
    track?: string
}

type ScorecardItem = {
    id: string
    name: string
}

type FlowConfigKey = keyof (
    FullChallengeConfig
    & First2FinishConfig
    & DesignConfig
    & TopgearConfig
)

type ListInputs = {
    reviewers: string
    reviewer: string
    screener: string
    approver: string
    checkpointScreener: string
    checkpointReviewer: string
    submitters: string
    prizes: string
    prize: string
}

type Props = {
    flow: FlowVariant
    config: FlowConfigUnion
    onSave: (nextConfig: FlowConfigUnion) => Promise<void> | void
    onCancel: () => void
}

const buildIterativeLabel = (flow: FlowVariant): string => {
    if (flow === 'topgear') {
        return 'Topgear Task'
    }

    if (flow === 'topgearLate') {
        return 'Topgear Task (Late)'
    }

    return 'First2Finish'
}

// eslint-disable-next-line complexity
export const ConfigForm: FC<Props> = (props: Props) => {
    const [types, setTypes] = useState<RefDataItem[]>([])
    const [tracks, setTracks] = useState<RefDataItem[]>([])
    const [scorecards, setScorecards] = useState<ScorecardItem[]>([])
    const [formConfig, setFormConfig] = useState<FlowConfigUnion>(props.config)
    const [listInputs, setListInputs] = useState<ListInputs>({
        approver: '',
        checkpointReviewer: '',
        checkpointScreener: '',
        prize: '',
        prizes: '',
        reviewer: '',
        reviewers: '',
        screener: '',
        submitters: '',
    })
    const [isRefDataLoading, setIsRefDataLoading] = useState(false)
    const [refDataError, setRefDataError] = useState<string | undefined>(undefined)
    const [isScorecardsLoading, setIsScorecardsLoading] = useState(false)
    const [scorecardsError, setScorecardsError] = useState<string | undefined>(undefined)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | undefined>(undefined)

    const flow = props.flow
    const isFull = flow === 'full'
    const isFullLike = flow === 'full' || flow === 'designSingle'
    const isDesign = flow === 'design' || flow === 'designFailScreening' || flow === 'designFailReview'
    const isIterative = !isFullLike && !isDesign
    const iterativeLabel = useMemo(() => buildIterativeLabel(flow), [flow])

    useEffect(() => {
        const loadReferenceData = async (): Promise<void> => {
            setIsRefDataLoading(true)
            setRefDataError(undefined)
            try {
                const [typesResponse, tracksResponse] = await Promise.all([
                    fetchChallengeTypes(),
                    fetchChallengeTracks(),
                ])

                setTypes(Array.isArray(typesResponse) ? typesResponse : [])
                setTracks(Array.isArray(tracksResponse) ? tracksResponse : [])
            } catch (error) {
                setTypes([])
                setTracks([])
                setRefDataError('Unable to load challenge types and tracks. Try again later.')
            } finally {
                setIsRefDataLoading(false)
            }
        }

        loadReferenceData()
    }, [])

    // eslint-disable-next-line complexity
    useEffect(() => {
        setFormConfig(props.config)

        const fullConfig = props.config as FullChallengeConfig
        const designConfig = props.config as DesignConfig
        const iterativeConfig = props.config as First2FinishConfig

        setListInputs({
            approver: isDesign
                ? designConfig.approver ?? designConfig.reviewer ?? ''
                : '',
            checkpointReviewer: isDesign
                ? designConfig.checkpointReviewer ?? designConfig.reviewer ?? ''
                : '',
            checkpointScreener: isDesign
                ? designConfig.checkpointScreener
                    ?? designConfig.screener
                    ?? designConfig.screeningReviewer
                    ?? designConfig.reviewer
                    ?? ''
                : '',
            prize: isIterative && typeof iterativeConfig.prize === 'number'
                ? String(iterativeConfig.prize)
                : '',
            prizes: (isFullLike || isDesign) && Array.isArray((props.config as FullChallengeConfig).prizes)
                ? (props.config as FullChallengeConfig).prizes.join(', ')
                : '',
            reviewer: isDesign
                ? designConfig.reviewer ?? ''
                : isIterative
                    ? iterativeConfig.reviewer ?? ''
                    : '',
            reviewers: isFullLike && Array.isArray(fullConfig.reviewers)
                ? fullConfig.reviewers.join(', ')
                : '',
            screener: isFullLike
                ? fullConfig.screener ?? ''
                : isDesign
                    ? designConfig.screener
                        ?? designConfig.screeningReviewer
                        ?? designConfig.reviewer
                        ?? ''
                    : '',
            submitters: Array.isArray(props.config.submitters)
                ? props.config.submitters.join(', ')
                : '',
        })
    }, [props.config, isDesign, isFullLike, isIterative])

    useEffect(() => {
        const loadScorecards = async (): Promise<void> => {
            if (!formConfig.challengeTypeId || !formConfig.challengeTrackId) {
                setScorecards([])
                return
            }

            const typeEntry = types.find(item => item.id === formConfig.challengeTypeId)
            const trackEntry = tracks.find(item => item.id === formConfig.challengeTrackId)
            const typeName = typeEntry?.name || formConfig.challengeTypeId
            // Scorecard lookup expects the track code (for example, DEVELOP), not the display name.
            const trackCode = trackEntry?.track || trackEntry?.name || formConfig.challengeTrackId

            if (!typeName || !trackCode) {
                setScorecards([])
                return
            }

            setIsScorecardsLoading(true)
            setScorecardsError(undefined)

            try {
                const data = await fetchScorecards({
                    challengeTrack: trackCode,
                    challengeType: typeName,
                })

                // Normalize scorecard responses across known array/wrapper shapes.
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray((data as any)?.scoreCards)
                        ? (data as any).scoreCards
                        : Array.isArray((data as any)?.result)
                            ? (data as any).result
                            : Array.isArray((data as any)?.result?.content)
                                ? (data as any).result.content
                                : []

                setScorecards(list)
            } catch (error) {
                setScorecards([])
                setScorecardsError('Unable to load scorecards for this type and track.')
            } finally {
                setIsScorecardsLoading(false)
            }
        }

        loadScorecards()
    }, [formConfig.challengeTypeId, formConfig.challengeTrackId, tracks, types])

    const updateField = (key: FlowConfigKey, value: unknown): void => {
        setFormConfig(prev => ({
            ...prev,
            [key]: value,
        }) as FlowConfigUnion)
    }

    const updateHandleList = (key: 'reviewers' | 'submitters', value: string): void => {
        setListInputs(prev => ({ ...prev, [key]: value }))
        const list = value
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean)
        updateField(key as FlowConfigKey, list)
    }

    const updateReviewer = (value: string): void => {
        setListInputs(prev => ({ ...prev, reviewer: value }))
        updateField('reviewer', value.trim())
    }

    const updateFullScreener = (value: string): void => {
        setListInputs(prev => ({ ...prev, screener: value }))
        updateField('screener', value.trim())
    }

    const updateDesignScreener = (value: string): void => {
        setListInputs(prev => ({ ...prev, screener: value }))
        const trimmed = value.trim()
        updateField('screener', trimmed)
        updateField('screeningReviewer', trimmed)
    }

    const updateApprover = (value: string): void => {
        setListInputs(prev => ({ ...prev, approver: value }))
        updateField('approver', value.trim())
    }

    const updateCheckpointScreener = (value: string): void => {
        setListInputs(prev => ({ ...prev, checkpointScreener: value }))
        updateField('checkpointScreener', value.trim())
    }

    const updateCheckpointReviewer = (value: string): void => {
        setListInputs(prev => ({ ...prev, checkpointReviewer: value }))
        updateField('checkpointReviewer', value.trim())
    }

    const updateCheckpointPrizeAmount = (value: string): void => {
        const amount = Number.parseFloat(value)
        updateField(
            'checkpointPrizeAmount',
            Number.isNaN(amount) ? 0 : Math.max(0, amount),
        )
    }

    const updateCheckpointPrizeCount = (value: string): void => {
        const count = Number.parseInt(value, 10)
        updateField(
            'checkpointPrizeCount',
            Number.isNaN(count) ? 0 : Math.max(0, count),
        )
    }

    const updatePrizes = (value: string): void => {
        setListInputs(prev => ({ ...prev, prizes: value }))
        const entries = value
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean)
            .map(entry => Number(entry))
            .filter(entry => !Number.isNaN(entry))

        updateField('prizes', entries)
    }

    const updatePrize = (value: string): void => {
        setListInputs(prev => ({ ...prev, prize: value }))
        if (!value.trim()) {
            updateField('prize', 0)
            return
        }

        const amount = Number.parseFloat(value)
        if (!Number.isNaN(amount)) {
            updateField('prize', amount)
        }
    }

    function handleTextFieldChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
        const key = event.currentTarget.dataset.configKey
        if (!key) {
            return
        }

        updateField(key as FlowConfigKey, event.currentTarget.value)
    }

    function handleNumberFieldChange(event: ChangeEvent<HTMLInputElement>): void {
        const key = event.currentTarget.dataset.configKey
        if (!key) {
            return
        }

        updateField(key as FlowConfigKey, Number(event.currentTarget.value))
    }

    function handleHandleListChange(event: ChangeEvent<HTMLInputElement>): void {
        const key = event.currentTarget.dataset.listKey
        if (key !== 'reviewers' && key !== 'submitters') {
            return
        }

        updateHandleList(key, event.currentTarget.value)
    }

    function handleReviewerChange(event: ChangeEvent<HTMLInputElement>): void {
        updateReviewer(event.currentTarget.value)
    }

    function handleFullScreenerChange(event: ChangeEvent<HTMLInputElement>): void {
        updateFullScreener(event.currentTarget.value)
    }

    function handleDesignScreenerChange(event: ChangeEvent<HTMLInputElement>): void {
        updateDesignScreener(event.currentTarget.value)
    }

    function handleApproverChange(event: ChangeEvent<HTMLInputElement>): void {
        updateApprover(event.currentTarget.value)
    }

    function handleCheckpointScreenerChange(event: ChangeEvent<HTMLInputElement>): void {
        updateCheckpointScreener(event.currentTarget.value)
    }

    function handleCheckpointReviewerChange(event: ChangeEvent<HTMLInputElement>): void {
        updateCheckpointReviewer(event.currentTarget.value)
    }

    function handlePrizesChange(event: ChangeEvent<HTMLInputElement>): void {
        updatePrizes(event.currentTarget.value)
    }

    function handlePrizeChange(event: ChangeEvent<HTMLInputElement>): void {
        updatePrize(event.currentTarget.value)
    }

    function handleCheckpointPrizeAmountChange(event: ChangeEvent<HTMLInputElement>): void {
        updateCheckpointPrizeAmount(event.currentTarget.value)
    }

    function handleCheckpointPrizeCountChange(event: ChangeEvent<HTMLInputElement>): void {
        updateCheckpointPrizeCount(event.currentTarget.value)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()
        setIsSaving(true)
        setSaveError(undefined)

        try {
            await props.onSave(formConfig)
        } catch (error) {
            setSaveError('Unable to save configuration. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
                <h3>
                    Edit
                    {' '}
                    {isFull ? 'Full Challenge' : isDesign ? 'Design Challenge' : iterativeLabel}
                    {' '}
                    Configuration
                </h3>

                {isRefDataLoading ? (
                    <div className={styles.loadingRow}>
                        <span className={styles.spinner} />
                        Loading challenge types and tracks...
                    </div>
                ) : undefined}
                {refDataError ? <div className={styles.errorText}>{refDataError}</div> : undefined}
                {isScorecardsLoading ? (
                    <div className={styles.loadingRow}>
                        <span className={styles.spinner} />
                        Loading scorecards...
                    </div>
                ) : undefined}

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>Challenge name prefix</label>
                        <input
                            className={styles.input}
                            data-config-key='challengeNamePrefix'
                            value={formConfig.challengeNamePrefix}
                            onChange={handleTextFieldChange}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Project ID</label>
                        <input
                            className={styles.input}
                            type='number'
                            min={1}
                            data-config-key='projectId'
                            value={formConfig.projectId}
                            onChange={handleNumberFieldChange}
                            required
                        />
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>Challenge type</label>
                        <select
                            className={classNames(styles.select, {
                                empty: !formConfig.challengeTypeId,
                            })}
                            data-config-key='challengeTypeId'
                            value={formConfig.challengeTypeId}
                            onChange={handleTextFieldChange}
                            disabled={isRefDataLoading}
                            required
                        >
                            <option value=''>
                                {isRefDataLoading
                                    ? 'Loading challenge types...'
                                    : types.length === 0
                                        ? 'No challenge types available'
                                        : '-- Select --'}
                            </option>
                            {types.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Challenge track</label>
                        <select
                            className={classNames(styles.select, {
                                empty: !formConfig.challengeTrackId,
                            })}
                            data-config-key='challengeTrackId'
                            value={formConfig.challengeTrackId}
                            onChange={handleTextFieldChange}
                            disabled={isRefDataLoading}
                            required
                        >
                            <option value=''>
                                {isRefDataLoading
                                    ? 'Loading challenge tracks...'
                                    : tracks.length === 0
                                        ? 'No challenge tracks available'
                                        : '-- Select --'}
                            </option>
                            {tracks.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>Timeline template ID</label>
                        <input
                            className={styles.input}
                            data-config-key='timelineTemplateId'
                            value={formConfig.timelineTemplateId}
                            onChange={handleTextFieldChange}
                            readOnly={!isFull && !isDesign}
                            disabled={!isFull && !isDesign}
                            required
                        />
                        {!isFull && !isDesign ? (
                            <div className={styles.helperText}>
                                {iterativeLabel}
                                {' '}
                                uses a fixed timeline template.
                            </div>
                        ) : undefined}
                    </div>
                    {!isDesign ? (
                        <div className={styles.field}>
                            <label className={styles.label}>Scorecard</label>
                            <select
                                className={classNames(styles.select, {
                                    empty: !formConfig.scorecardId,
                                })}
                                data-config-key='scorecardId'
                                value={formConfig.scorecardId}
                                onChange={handleTextFieldChange}
                                disabled={isScorecardsLoading}
                                required
                            >
                                <option value=''>
                                    {isScorecardsLoading
                                        ? 'Loading scorecards...'
                                        : scorecards.length === 0
                                            ? 'No scorecards available'
                                            : '-- Select --'}
                                </option>
                                {scorecards.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {scorecardsError ? (
                                <div className={styles.errorText}>{scorecardsError}</div>
                            ) : undefined}
                        </div>
                    ) : undefined}
                </div>

                {isDesign ? (
                    <>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Review Scorecard</label>
                                <select
                                    className={classNames(styles.select, {
                                        empty: !(formConfig as DesignConfig).reviewScorecardId,
                                    })}
                                    data-config-key='reviewScorecardId'
                                    value={(formConfig as DesignConfig).reviewScorecardId
                                        || formConfig.scorecardId}
                                    onChange={handleTextFieldChange}
                                    disabled={isScorecardsLoading}
                                >
                                    <option value=''>
                                        {isScorecardsLoading
                                            ? 'Loading scorecards...'
                                            : scorecards.length === 0
                                                ? 'No scorecards available'
                                                : '-- Select --'}
                                    </option>
                                    {scorecards.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Screening Scorecard</label>
                                <select
                                    className={classNames(styles.select, {
                                        empty: !(formConfig as DesignConfig).screeningScorecardId,
                                    })}
                                    data-config-key='screeningScorecardId'
                                    value={(formConfig as DesignConfig).screeningScorecardId
                                        || formConfig.scorecardId}
                                    onChange={handleTextFieldChange}
                                    disabled={isScorecardsLoading}
                                >
                                    <option value=''>
                                        {isScorecardsLoading
                                            ? 'Loading scorecards...'
                                            : scorecards.length === 0
                                                ? 'No scorecards available'
                                                : '-- Select --'}
                                    </option>
                                    {scorecards.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Approval Scorecard</label>
                                <select
                                    className={classNames(styles.select, {
                                        empty: !(formConfig as DesignConfig).approvalScorecardId,
                                    })}
                                    data-config-key='approvalScorecardId'
                                    value={(formConfig as DesignConfig).approvalScorecardId
                                        || formConfig.scorecardId}
                                    onChange={handleTextFieldChange}
                                    disabled={isScorecardsLoading}
                                >
                                    <option value=''>
                                        {isScorecardsLoading
                                            ? 'Loading scorecards...'
                                            : scorecards.length === 0
                                                ? 'No scorecards available'
                                                : '-- Select --'}
                                    </option>
                                    {scorecards.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Checkpoint Screening Scorecard</label>
                                <select
                                    className={classNames(styles.select, {
                                        empty: !(formConfig as DesignConfig).checkpointScreeningScorecardId,
                                    })}
                                    value={(formConfig as DesignConfig).checkpointScreeningScorecardId
                                        || (formConfig as DesignConfig).checkpointScorecardId}
                                    data-config-key='checkpointScreeningScorecardId'
                                    onChange={handleTextFieldChange}
                                    disabled={isScorecardsLoading}
                                >
                                    <option value=''>
                                        {isScorecardsLoading
                                            ? 'Loading scorecards...'
                                            : scorecards.length === 0
                                                ? 'No scorecards available'
                                                : '-- Select --'}
                                    </option>
                                    {scorecards.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Checkpoint Review Scorecard</label>
                                <select
                                    className={classNames(styles.select, {
                                        empty: !(formConfig as DesignConfig).checkpointReviewScorecardId,
                                    })}
                                    value={(formConfig as DesignConfig).checkpointReviewScorecardId
                                        || (formConfig as DesignConfig).checkpointScorecardId}
                                    data-config-key='checkpointReviewScorecardId'
                                    onChange={handleTextFieldChange}
                                    disabled={isScorecardsLoading}
                                >
                                    <option value=''>
                                        {isScorecardsLoading
                                            ? 'Loading scorecards...'
                                            : scorecards.length === 0
                                                ? 'No scorecards available'
                                                : '-- Select --'}
                                    </option>
                                    {scorecards.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {scorecardsError ? (
                            <div className={styles.errorText}>{scorecardsError}</div>
                        ) : undefined}
                    </>
                ) : undefined}

                {isFullLike ? (
                    <>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Submissions per submitter</label>
                                <input
                                    className={styles.input}
                                    type='number'
                                    min={1}
                                    data-config-key='submissionsPerSubmitter'
                                    value={(formConfig as FullChallengeConfig).submissionsPerSubmitter}
                                    onChange={handleNumberFieldChange}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Reviewers (comma-separated handles)</label>
                                <input
                                    className={styles.input}
                                    data-list-key='reviewers'
                                    value={listInputs.reviewers}
                                    onChange={handleHandleListChange}
                                />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Screener handle</label>
                                <input
                                    className={styles.input}
                                    value={listInputs.screener}
                                    onChange={handleFullScreenerChange}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Copilot handle</label>
                                <input
                                    className={styles.input}
                                    data-config-key='copilotHandle'
                                    value={formConfig.copilotHandle}
                                    onChange={handleTextFieldChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label className={styles.label}>Submitters (comma-separated handles)</label>
                                <input
                                    className={styles.input}
                                    data-list-key='submitters'
                                    value={listInputs.submitters}
                                    onChange={handleHandleListChange}
                                />
                            </div>
                        </div>
                    </>
                ) : isDesign ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Submissions per submitter</label>
                            <input
                                className={styles.input}
                                type='number'
                                min={1}
                                data-config-key='submissionsPerSubmitter'
                                value={(formConfig as DesignConfig).submissionsPerSubmitter}
                                onChange={handleNumberFieldChange}
                                required
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Reviewer handle</label>
                            <input
                                className={styles.input}
                                value={listInputs.reviewer}
                                onChange={handleReviewerChange}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Iterative Reviewer handle</label>
                            <input
                                className={styles.input}
                                value={listInputs.reviewer}
                                onChange={handleReviewerChange}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Copilot handle</label>
                            <input
                                className={styles.input}
                                data-config-key='copilotHandle'
                                value={formConfig.copilotHandle}
                                onChange={handleTextFieldChange}
                                required
                            />
                        </div>
                    </div>
                )}

                {isDesign ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Screener handle</label>
                            <input
                                className={styles.input}
                                value={listInputs.screener}
                                onChange={handleDesignScreenerChange}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Approver handle</label>
                            <input
                                className={styles.input}
                                value={listInputs.approver}
                                onChange={handleApproverChange}
                            />
                        </div>
                    </div>
                ) : undefined}

                {isDesign ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Checkpoint Screener handle</label>
                            <input
                                className={styles.input}
                                value={listInputs.checkpointScreener}
                                onChange={handleCheckpointScreenerChange}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Checkpoint Reviewer handle</label>
                            <input
                                className={styles.input}
                                value={listInputs.checkpointReviewer}
                                onChange={handleCheckpointReviewerChange}
                            />
                        </div>
                    </div>
                ) : undefined}

                {!isFull ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Submitters (comma-separated handles)</label>
                            <input
                                className={styles.input}
                                data-list-key='submitters'
                                value={listInputs.submitters}
                                onChange={handleHandleListChange}
                            />
                        </div>
                        {!isDesign ? (
                            <div className={styles.field}>
                                <label className={styles.label}>Prize (winner)</label>
                                <input
                                    className={styles.input}
                                    value={listInputs.prize}
                                    onChange={handlePrizeChange}
                                />
                            </div>
                        ) : undefined}
                    </div>
                ) : undefined}

                {isFull || isDesign ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Prizes (1st, 2nd, 3rd)</label>
                            <input
                                className={styles.input}
                                value={listInputs.prizes}
                                onChange={handlePrizesChange}
                            />
                        </div>
                    </div>
                ) : undefined}

                {isDesign ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Checkpoint prize amount</label>
                            <input
                                className={styles.input}
                                type='number'
                                min={0}
                                value={(formConfig as DesignConfig).checkpointPrizeAmount ?? 0}
                                onChange={handleCheckpointPrizeAmountChange}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Checkpoint prize count</label>
                            <input
                                className={styles.input}
                                type='number'
                                min={0}
                                step={1}
                                value={(formConfig as DesignConfig).checkpointPrizeCount ?? 0}
                                onChange={handleCheckpointPrizeCountChange}
                            />
                        </div>
                    </div>
                ) : undefined}

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>Submission zip path</label>
                        <input
                            className={styles.input}
                            data-config-key='submissionZipPath'
                            value={formConfig.submissionZipPath}
                            onChange={handleTextFieldChange}
                            placeholder='./path/to/submission.zip'
                            required
                        />
                    </div>
                </div>

                {!isFull && !isDesign ? (
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label}>Additional Notes</label>
                            <div className={styles.note}>
                                {iterativeLabel}
                                {' '}
                                runs with one reviewer and iterative submissions.
                            </div>
                        </div>
                    </div>
                ) : undefined}

                {saveError ? <div className={styles.errorText}>{saveError}</div> : undefined}

                <div className={styles.buttonGroup}>
                    <button className='filledButton' type='submit' disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className='borderButton' type='button' onClick={props.onCancel} disabled={isSaving}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    )
}

export default ConfigForm
