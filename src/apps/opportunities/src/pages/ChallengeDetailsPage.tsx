/* eslint-disable no-use-before-define, react/jsx-no-bind */
import {
    FC,
    KeyboardEvent,
    ReactNode,
    SyntheticEvent,
    useMemo,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import useSWR, { SWRResponse } from 'swr'

import {
    authUrlLogin,
    getMemberStatsAsync,
    ProfileContextData,
    useProfileContext,
    UserStats,
} from '~/libs/core'
import { IconOutline, LoadingSpinner } from '~/libs/ui'

import {
    ChallengeDescription,
    ChallengeDetailHeader,
    ChallengeForum,
    ChallengeSidebar,
    ChallengeSubmissionUpload,
    ChallengeTermsModal,
    ChallengeTocItem,
    extractTableOfContents,
    isHtmlDescriptionFormat,
    MarathonDashboard,
    OpportunityPagination,
    OpportunityTabLoading,
    ReportIssueModal,
    SubmissionHistoryModal,
} from '../components'
import {
    challengeCatalogKey,
    ChallengePlacementPrize,
    challengePlacementPrizes,
} from '../components/challenge-card.utils'
import {
    ChallengeOpportunity,
    ChallengeProjectResult,
    ChallengeResource,
    ChallengeReviewSummation,
    ChallengeSubmission,
    ChallengeTerm,
    MemberProfileSummary,
    OpportunityPage,
} from '../models'
import {
    agreeToChallengeTerms,
    deleteChallengeSubmission,
    getChallengeOpportunity,
    getChallengeProjectResults,
    getChallengeRegistration,
    getChallengeReviewSummations,
    getChallengeSubmissionDownloadUrl,
    getChallengeSubmissionPreviews,
    getChallengeSubmissions,
    getChallengeSubmitters,
    getMemberProfilesByUserIds,
    registerForChallenge,
    unregisterFromChallenge,
} from '../services'
import {
    attachMarathonReviewSummations,
    challengeTrackLabel,
    challengeTrackWins,
    formatMarathonFinalScore,
    formatMarathonScore,
    isMarathonMatchChallenge,
    marathonDashboardIsEnabled,
    marathonSubmissionScores,
    marathonSubmissionTestProgress,
    memberProfileUrl,
    shouldShowFinalSubmissionScores,
    winnerFinalScore,
} from '../utils'
import medal1 from '../assets/medal-1.svg'
import medal2 from '../assets/medal-2.svg'
import medal3 from '../assets/medal-3.svg'
import winnerThanksIcon from '../assets/winner-thanks.svg'

import styles from './ChallengeDetailsPage.module.scss'

type ChallengeTab = 'requirements' | 'registrants' | 'submissions' | 'mine' | 'dashboard' | 'forum' | 'winners'

const HISTORY_ICON_PATH = 'M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v3l4-4-4-4v3z'
    + 'M12 8v5l4.25 2.52.77-1.28-3.52-2.09V8z'

/**
 * Builds the challenge-scoped Review App destination used by authored actions.
 *
 * @param challengeId Challenge API UUID.
 * @param submissionType optional checkpoint or standard submission type.
 * @returns encoded Review App challenge-detail URL.
 * @throws Does not throw.
 */
function challengeReviewUrl(challengeId: string, submissionType?: string): string {
    const tab = submissionType === 'CHECKPOINT_SUBMISSION'
        ? 'checkpoint-submission'
        : 'submission'
    return `/review/active-challenges/${encodeURIComponent(challengeId)}`
        + `/challenge-details?tab=${tab}`
}

/**
 * Formats a Review API submission enum as a member-facing label.
 *
 * @param value optional submission type token.
 * @returns title-cased type or the generic Submission label.
 * @throws Does not throw.
 */
function submissionTypeLabel(value?: string): string {
    if (!value) return 'Submission'
    return value.toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(part => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)}`)
        .join(' ')
}

/**
 * Formats the member-facing lifecycle shown in My Submissions.
 *
 * @param value optional Review API status token.
 * @returns normalized lifecycle label or an em dash.
 * @throws Does not throw.
 */
function submissionStatusLabel(value?: string): string {
    if (!value) return '—'
    if (value.trim()
        .toUpperCase() === 'ACTIVE') return 'In Review'
    return submissionTypeLabel(value)
}

interface TabConfig {
    count?: number
    id: ChallengeTab
    label: string
}

/**
 * Reads a challenge catalog name from legacy or expanded v6 shapes.
 *
 * @param value string or expanded catalog record.
 * @returns catalog name, or an empty string.
 * @throws Does not throw.
 */
function catalogName(value: string | { name?: string } | undefined): string {
    return typeof value === 'string' ? value : value?.name || ''
}

/**
 * Reads a case-insensitive boolean flag from Challenge API metadata.
 *
 * @param challenge challenge containing arbitrary string-like metadata values.
 * @param name metadata name to resolve.
 * @returns true only when the matching metadata value serializes to `true`.
 * @throws Does not throw.
 */
function challengeMetadataFlag(challenge: ChallengeOpportunity, name: string): boolean {
    const normalizedName = name.trim()
        .toLowerCase()
    return challenge.metadata?.some(item => item.name.trim()
        .toLowerCase() === normalizedName
        && String(item.value)
            .trim()
            .toLowerCase() === 'true') ?? false
}

/**
 * Formats an API timestamp used in submission and phase tables.
 *
 * @param value optional ISO timestamp.
 * @returns localized date and time, or an em dash.
 * @throws Does not throw.
 */
function formatTimestamp(value?: string): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' })
        .format(date)
    const hours = String(date.getHours())
        .padStart(2, '0')
    const minutes = String(date.getMinutes())
        .padStart(2, '0')
    return `${date.getDate()} ${month}, ${date.getFullYear()}, ${hours}:${minutes}`
}

/**
 * Renders the replacement challenge details route with lazy tab data, Markdown
 * table of contents, Review App rail, registration terms, and Support reporting.
 *
 * @returns challenge detail page for `/opportunities/challenge/:challengeId`.
 * @throws Does not throw; request failures render in-page recovery states.
 */
export const ChallengeDetailsPage: FC = () => {
    const routeParams: Readonly<{ challengeId?: string }> = useParams<{ challengeId: string }>()
    const challengeId = routeParams.challengeId ?? ''
    const { profile }: ProfileContextData = useProfileContext()
    const [activeTab, setActiveTab] = useState<ChallengeTab>('requirements')
    const [termsOpen, setTermsOpen] = useState(false)
    const [termsMode, setTermsMode] = useState<'register' | 'view'>('view')
    const [issueOpen, setIssueOpen] = useState(false)
    const [registrationBusy, setRegistrationBusy] = useState(false)
    const [submissionFlowOpen, setSubmissionFlowOpen] = useState(false)
    const [visibleTerms, setVisibleTerms] = useState<ChallengeTerm[]>([])
    const challengeResponse: SWRResponse<ChallengeOpportunity, Error> = useSWR(
        challengeId ? `opportunities:challenge:${challengeId}` : undefined,
        () => getChallengeOpportunity(challengeId),
        { revalidateOnFocus: false },
    )
    const memberId = profile?.userId === undefined ? undefined : String(profile.userId)
    const registrationResponse: SWRResponse<ChallengeResource | undefined, Error> = useSWR(
        challengeId && memberId ? ['opportunities:registration', challengeId, memberId] : undefined,
        () => getChallengeRegistration(challengeId, memberId as string),
        { revalidateOnFocus: false },
    )
    const registration = registrationResponse.data
    const challenge = challengeResponse.data
    const isAdministrator = profile?.roles?.some(role => role.trim()
        .toLowerCase() === 'administrator') ?? false
    const isRegistered = !!registration
    const hasMemberTabAccess = isRegistered || isAdministrator
    const tabs = useMemo<TabConfig[]>(() => {
        const designChallenge = catalogName(challenge?.track)
            .toLowerCase() === 'design'
        return [
            { id: 'requirements', label: 'Requirements' },
            { count: challenge?.numOfRegistrants, id: 'registrants', label: 'Registrants' },
            ...(memberId || designChallenge
                ? [{
                    count: challenge?.numOfSubmissions,
                    id: 'submissions' as ChallengeTab,
                    label: 'Submissions',
                }]
                : []),
            ...(isRegistered ? [{ id: 'mine' as ChallengeTab, label: 'My Submissions' }] : []),
            ...(hasMemberTabAccess && challenge && marathonDashboardIsEnabled(challenge)
                ? [{ id: 'dashboard' as ChallengeTab, label: 'Dashboard' }]
                : []),
            ...(hasMemberTabAccess
                ? [{ count: challenge?.numOfPosts, id: 'forum' as ChallengeTab, label: 'Forum' }]
                : []),
            { id: 'winners', label: 'Winners' },
        ]
    }, [challenge, hasMemberTabAccess, isRegistered, memberId])

    /**
     * Selects a challenge tab and closes the transient in-tab submission form.
     *
     * @param tab destination tab identifier.
     * @returns void after updating the visible panel.
     * @throws Does not throw.
     */
    const selectTab = (tab: ChallengeTab): void => {
        setSubmissionFlowOpen(false)
        setActiveTab(tab)
    }

    /**
     * Opens the Figma submission flow under the registered member's My Submissions tab.
     *
     * @returns void after selecting the tab, or redirecting an anonymous member to sign in.
     * @throws Does not throw.
     */
    const startSubmission = (): void => {
        if (!memberId) {
            window.location.assign(authUrlLogin(window.location.href))
            return
        }

        setActiveTab('mine')
        setSubmissionFlowOpen(true)
    }

    /**
     * Returns from the upload workflow to the member's refreshed submission table.
     *
     * @returns void after restoring the default My Submissions panel.
     * @throws Does not throw.
     */
    const closeSubmission = (): void => {
        setActiveTab('mine')
        setSubmissionFlowOpen(false)
    }

    /**
     * Opens Requirements from the upload form's track-specific guidance card.
     *
     * @returns void after selecting the Requirements panel.
     * @throws Does not throw.
     */
    const showSubmissionRequirements = (): void => selectTab('requirements')

    /** Opens authentication or the terms confirmation before registration. */
    const startRegistration = (): void => {
        if (!profile) {
            window.location.assign(authUrlLogin(window.location.href))
            return
        }

        setVisibleTerms(challenge?.terms ?? [])
        setTermsMode('register')
        setTermsOpen(true)
    }

    /**
     * Opens passive term review for the selected authored term.
     *
     * @param term optional right-rail term; absence reviews every challenge term.
     * @returns void.
     * @throws Does not throw.
     */
    const showTerms = (term?: ChallengeTerm): void => {
        setVisibleTerms(term ? [term] : challenge?.terms ?? [])
        setTermsMode('view')
        setTermsOpen(true)
    }

    /**
     * Moves focus and selection between the challenge's semantic tabs.
     *
     * @param event keyboard event from the currently focused tab.
     * @param index index of the currently focused tab in the visible tab list.
     * @returns void after handling Arrow, Home, or End navigation; unrelated keys are ignored.
     * @throws Does not throw.
     */
    const navigateTabs = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
        const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
        if (!keys.includes(event.key)) return
        event.preventDefault()
        let nextIndex = index
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = tabs.length - 1
        setActiveTab(tabs[nextIndex].id)
        const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
        buttons?.[nextIndex]?.focus()
    }

    /** Agrees to electronic terms and creates the Submitter resource. */
    const completeRegistration = async (terms: ChallengeTerm[]): Promise<void> => {
        if (!challenge || !profile) return
        setRegistrationBusy(true)
        try {
            await agreeToChallengeTerms(terms)
            await registerForChallenge(challenge.id, profile.handle)
            await Promise.all([registrationResponse.mutate(), challengeResponse.mutate()])
            setTermsOpen(false)
            toast.success('You are registered for this competition.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed.')
        } finally {
            setRegistrationBusy(false)
        }
    }

    /** Deletes the caller's Submitter resource after explicit confirmation. */
    const unregister = async (): Promise<void> => {
        // eslint-disable-next-line no-alert
        if (!registration || !profile || !window.confirm('Unregister from this competition?')) return
        setRegistrationBusy(true)
        try {
            await unregisterFromChallenge(challengeId, profile.handle)
            setActiveTab('requirements')
            setSubmissionFlowOpen(false)
            await Promise.all([registrationResponse.mutate(), challengeResponse.mutate()])
            toast.success('You are no longer registered for this competition.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to unregister.')
        } finally {
            setRegistrationBusy(false)
        }
    }

    if (challengeResponse.isValidating && !challenge) {
        return <div className={styles.loading}><LoadingSpinner /></div>
    }

    if (challengeResponse.error || !challenge) {
        return (
            <div className={styles.notFound}>
                <IconOutline.ExclamationCircleIcon />
                <h1>Competition not found</h1>
                <p>This competition is unavailable or you do not have access.</p>
                <Link to='/opportunities/competitions'>Browse competitions</Link>
            </div>
        )
    }

    return (
        <main className={styles.page}>
            <ChallengeDetailHeader
                busy={registrationBusy}
                challenge={challenge}
                isRegistered={isRegistered}
                onRegister={startRegistration}
                onSubmit={startSubmission}
                onUnregister={unregister}
                registrationError={!!memberId && !!registrationResponse.error}
                registrationLoading={!!memberId
                    && registrationResponse.isValidating
                    && registrationResponse.data === undefined
                    && !registrationResponse.error}
            />
            <nav aria-label='Challenge sections' className={styles.tabs}>
                <div role='tablist'>
                    {tabs.map((tab: TabConfig, index: number) => (
                        <button
                            aria-controls={activeTab === tab.id
                                ? `challenge-panel-${tab.id}`
                                : undefined}
                            aria-selected={activeTab === tab.id}
                            className={activeTab === tab.id ? styles.activeTab : undefined}
                            id={`challenge-tab-${tab.id}`}
                            key={tab.id}
                            onClick={() => selectTab(tab.id)}
                            onKeyDown={event => navigateTabs(event, index)}
                            role='tab'
                            tabIndex={activeTab === tab.id ? 0 : -1}
                            type='button'
                        >
                            {tab.label}
                            {tab.count !== undefined && <span>{tab.count}</span>}
                        </button>
                    ))}
                </div>
            </nav>
            <div className={`${styles.content} ${activeTab === 'requirements' ? '' : styles.fullWidth}`}>
                <section
                    aria-labelledby={`challenge-tab-${activeTab}`}
                    className={styles.mainContent}
                    id={`challenge-panel-${activeTab}`}
                    role='tabpanel'
                >
                    <ChallengeTabContent
                        activeTab={activeTab}
                        challenge={challenge}
                        isAdministrator={isAdministrator}
                        memberId={memberId}
                        onCloseSubmission={closeSubmission}
                        onContactSupport={() => setIssueOpen(true)}
                        onShowRequirements={showSubmissionRequirements}
                        onShowTerms={showTerms}
                        onStartSubmission={startSubmission}
                        onSubmitted={() => challengeResponse.mutate({
                            ...challenge,
                            numOfSubmissions: (challenge.numOfSubmissions ?? 0) + 1,
                        }, { revalidate: false })}
                        submissionFlowOpen={submissionFlowOpen}
                    />
                </section>
                {activeTab === 'requirements' && (
                    <ChallengeSidebar
                        challenge={challenge}
                        onContactTeam={() => setIssueOpen(true)}
                        onShowTerms={showTerms}
                    />
                )}
            </div>
            <ChallengeTermsModal
                busy={registrationBusy}
                mode={termsMode}
                onAccept={completeRegistration}
                onClose={() => setTermsOpen(false)}
                open={termsOpen}
                terms={visibleTerms}
            />
            <ReportIssueModal
                challengeId={challenge.id}
                onClose={() => setIssueOpen(false)}
                open={issueOpen}
            />
        </main>
    )
}

interface ChallengeTabContentProps {
    activeTab: ChallengeTab
    challenge: ChallengeOpportunity
    isAdministrator: boolean
    memberId?: string
    onCloseSubmission: () => void
    onContactSupport: () => void
    onShowRequirements: () => void
    onShowTerms: (term?: ChallengeTerm) => void
    onStartSubmission: () => void
    onSubmitted: () => Promise<unknown> | unknown
    submissionFlowOpen: boolean
}

/**
 * Renders only the active challenge tab and defers its domain request until selected.
 *
 * @param props active tab, challenge detail, and optional member ID.
 * @returns selected tab content or authentication handoff.
 * @throws Does not throw.
 */
const ChallengeTabContent: FC<ChallengeTabContentProps> = props => {
    if (props.activeTab === 'requirements') return <RequirementsTab challenge={props.challenge} />
    if (props.activeTab === 'registrants') return <RegistrantsTab challenge={props.challenge} />
    if (props.activeTab === 'submissions') {
        const isDesign = catalogName(props.challenge.track)
            .toLowerCase() === 'design'
        return props.memberId || isDesign
            ? <SubmissionsTab challenge={props.challenge} viewerMemberId={props.memberId} />
            : <SignInTab subject='submissions' />
    }

    if (props.activeTab === 'mine') {
        if (!props.memberId) return <SignInTab subject='your submissions' />
        if (props.submissionFlowOpen) {
            return (
                <ChallengeSubmissionUpload
                    challenge={props.challenge}
                    memberId={props.memberId}
                    onBack={props.onCloseSubmission}
                    onContactSupport={props.onContactSupport}
                    onShowRequirements={props.onShowRequirements}
                    onShowTerms={props.onShowTerms}
                    onSubmitted={props.onSubmitted}
                />
            )
        }

        return (
            <SubmissionsTab
                challenge={props.challenge}
                memberId={props.memberId}
                mine
                onStartSubmission={props.onStartSubmission}
            />
        )
    }

    if (props.activeTab === 'dashboard') {
        return props.memberId
            ? <MarathonDashboard challenge={props.challenge} />
            : <SignInTab subject='the Marathon Match dashboard' />
    }

    if (props.activeTab === 'forum') {
        return (
            <ForumTab
                canCreateAnnouncements={props.isAdministrator}
                challenge={props.challenge}
                memberId={props.memberId}
            />
        )
    }

    return <WinnersTab challenge={props.challenge} memberId={props.memberId} />
}

/**
 * Renders format-aware requirements and a Markdown-only table of contents.
 *
 * @param props challenge containing authored requirements.
 * @returns requirements tab content.
 * @throws Does not throw.
 */
const RequirementsTab: FC<{ challenge: ChallengeOpportunity }> = props => {
    const description = props.challenge.description
        || 'Requirements are not available yet.'
    const htmlFormat = isHtmlDescriptionFormat(props.challenge.descriptionFormat)
    const toc = useMemo(
        () => (htmlFormat ? [] : extractTableOfContents(description)),
        [description, htmlFormat],
    )
    const tournament = challengeCatalogKey(props.challenge.type) === 'marathonmatch'
        ? props.challenge.events?.map(event => event.name)
            .find(Boolean)
        : undefined

    return (
        <div className={styles.requirements}>
            {tournament && (
                <p className={styles.tournamentNotice}>{`This match belongs to the ${tournament}.`}</p>
            )}
            <div className={styles.notice}>
                Please read the challenge requirements carefully and watch the forums for any questions or feedback
                concerning this challenge. It is important that you monitor any updates provided by the copilot,
                admins or the client in the forums. Please post any questions you might have for the client in the
                forums.
            </div>
            {toc.length > 0 && (
                <nav aria-label='Table of contents' className={styles.toc}>
                    <h2>Table of Contents</h2>
                    <ol>
                        {toc.map((item: ChallengeTocItem) => (
                            <li className={item.level === 3 ? styles.nestedToc : undefined} key={item.id}>
                                <a href={`#${item.id}`}>{item.label}</a>
                            </li>
                        ))}
                    </ol>
                </nav>
            )}
            <ChallengeDescription
                content={description}
                format={props.challenge.descriptionFormat}
                privateDescription={props.challenge.privateDescription}
            />
        </div>
    )
}

interface MemberHandleProps {
    handle: string
    link?: boolean
    profile?: MemberProfileSummary
    rating?: number
}

/**
 * Maps Topcoder's public maximum rating to the canonical member color band.
 *
 * @param rating Resource API maximum rating.
 * @returns scoped handle color class, or undefined when rating is unavailable.
 * @throws Does not throw.
 */
function ratingClass(rating?: number): string | undefined {
    if (rating === undefined || !Number.isFinite(rating)) return undefined
    if (rating >= 2200) return styles.ratingRed
    if (rating >= 1500) return styles.ratingYellow
    if (rating >= 1200) return styles.ratingBlue
    if (rating >= 900) return styles.ratingGreen
    return styles.ratingGray
}

/**
 * Renders the compact avatar and linked handle shared by detail tables/cards.
 *
 * @param props resolved member handle.
 * @returns member identity cell without synthesizing unavailable profile photos.
 * @throws Does not throw.
 */
const MemberHandle: FC<MemberHandleProps> = props => {
    const [failedPhotoURL, setFailedPhotoURL] = useState<string>()
    const handle = props.profile?.handle ?? props.handle
    const rating = props.profile?.maxRating ?? props.rating
    const photoURL = props.profile?.photoURL
    const showPhoto = !!photoURL && photoURL !== failedPhotoURL
    const handleClass = ratingClass(rating)
    return (
        <span className={styles.member}>
            <span aria-hidden='true' className={styles.avatar}>
                {showPhoto
                    ? (
                        <img
                            alt=''
                            onError={() => setFailedPhotoURL(photoURL)}
                            src={photoURL}
                        />
                    )
                    : handle.charAt(0)
                        .toUpperCase()}
            </span>
            {props.link === false && !props.profile?.handle
                ? <span className={`${styles.memberHandle} ${handleClass ?? ''}`}>{handle}</span>
                : <a className={handleClass} href={memberProfileUrl(handle)}>{handle}</a>}
        </span>
    )
}

/**
 * Indexes Members API projections by canonical user ID.
 *
 * @param profiles optional member summaries.
 * @returns read-only member lookup map.
 * @throws Does not throw.
 */
function memberProfilesById(profiles?: MemberProfileSummary[]): ReadonlyMap<string, MemberProfileSummary> {
    return new Map((profiles ?? []).map(profile => [profile.userId, profile]))
}

/**
 * Resolves a Review API submission's canonical member ID.
 *
 * @param submission Review API submission row.
 * @returns trimmed member ID, or undefined.
 * @throws Does not throw.
 */
function challengeSubmissionMemberId(submission: ChallengeSubmission): string | undefined {
    const value = submission.memberId ?? submission.registrant?.userId
    if (value === undefined || value === null) return undefined
    const memberId = String(value)
        .trim()
    return memberId || undefined
}

/**
 * Reads the Resource API registration timestamp when the deployment exposes it.
 *
 * @param resource challenge Submitter resource.
 * @returns formatted creation timestamp or an unavailable marker.
 * @throws Does not throw.
 */
function registrationTimestamp(resource: ChallengeResource): string {
    return formatTimestamp(resource.created)
}

/**
 * Loads Submitter resources only after the Registrants tab is selected.
 *
 * @param props challenge used to load resources and select the track-specific table.
 * @returns paginated registrants table or loading/error/empty state.
 * @throws Does not throw; request failures render a retry action.
 */
const RegistrantsTab: FC<{ challenge: ChallengeOpportunity }> = props => {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const response: SWRResponse<OpportunityPage<ChallengeResource>, Error> = useSWR(
        ['opportunities:registrants', props.challenge.id, page, perPage],
        () => getChallengeSubmitters(props.challenge.id, page, perPage),
        { revalidateOnFocus: false },
    )
    const memberIds = useMemo(
        () => Array.from(new Set((response.data?.items ?? [])
            .map(resource => String(resource.memberId ?? '')
                .trim())
            .filter(Boolean))),
        [response.data?.items],
    )
    const profileResponse: SWRResponse<MemberProfileSummary[], Error> = useSWR(
        memberIds.length ? ['opportunities:member-profiles', ...memberIds] : undefined,
        () => getMemberProfilesByUserIds(memberIds),
        { revalidateOnFocus: false },
    )
    const profilesById = useMemo(
        () => memberProfilesById(profileResponse.data),
        [profileResponse.data],
    )
    const trackKey = challengeCatalogKey(props.challenge.track)
    const showRating = trackKey !== 'design'
    const sortRegistrationDate = trackKey === 'qualityassurance'
        || isMarathonMatchChallenge(props.challenge)
    if (response.isValidating && !response.data) {
        return <OpportunityTabLoading label='Loading registrants' />
    }

    if (response.error) return <TabError onRetry={() => response.mutate()} />
    if (!response.data?.items.length) {
        return <EmptyTab title='No registrants yet' text='Registered competitors will appear here.' />
    }

    return (
        <div className={styles.tableSection}>
            <h2>Registrants</h2>
            <div className={styles.tableCard}>
                <table className={!showRating
                    ? styles.designRegistrantTable
                    : styles.ratedRegistrantTable}
                >
                    <thead>
                        <tr>
                            <th>Handle</th>
                            {showRating && <th>Rating</th>}
                            <th>
                                {sortRegistrationDate ? (
                                    <span className={styles.sortedHeader}>
                                        Registration Date
                                        <IconOutline.ChevronDownIcon aria-hidden='true' />
                                    </span>
                                ) : 'Registration Date'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {response.data.items.map(resource => {
                            const memberId = String(resource.memberId ?? '')
                            const profile = profilesById.get(memberId)
                            const handle = profile?.handle
                                ?? resource.memberHandle
                                ?? String(resource.memberId || 'Member')
                            const rating = profile?.maxRating ?? resource.rating
                            return (
                                <tr key={resource.id}>
                                    <td>
                                        <MemberHandle
                                            handle={handle}
                                            link={!!profile?.handle || !!resource.memberHandle}
                                            profile={profile}
                                            rating={rating}
                                        />
                                    </td>
                                    {showRating && <td>{rating ?? '—'}</td>}
                                    <td>{registrationTimestamp(resource)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className={styles.tablePagination}>
                <OpportunityPagination
                    onPageChange={setPage}
                    onPerPageChange={(value: number) => {
                        setPerPage(value)
                        setPage(1)
                    }}
                    page={response.data.page}
                    perPage={response.data.perPage}
                    total={response.data.total}
                    totalPages={response.data.totalPages}
                />
            </div>
        </div>
    )
}

interface SubmissionsTabProps {
    challenge: ChallengeOpportunity
    memberId?: string
    mine?: boolean
    onStartSubmission?: () => void
    viewerMemberId?: string
}

/**
 * Loads and paginates submissions only after a submission tab is selected.
 *
 * @param props challenge, optional member scope, viewer identity, and My Submissions flag.
 * @returns submission table/gallery, Marathon dashboard, or request state.
 * @throws Does not throw; request failures render a retry action.
 */
const SubmissionsTab: FC<SubmissionsTabProps> = props => {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const [historySubmission, setHistorySubmission] = useState<ChallengeSubmission | undefined>()
    const [marathonView, setMarathonView] = useState<'dashboard' | 'list'>('list')
    const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | undefined>()
    const [downloadingSubmissionId, setDownloadingSubmissionId] = useState<string | undefined>()
    const trackKey = challengeCatalogKey(props.challenge.track)
    const isDesign = trackKey === 'design'
    const isQa = trackKey === 'qualityassurance'
    const isMarathonMatch = isMarathonMatchChallenge(props.challenge)
    const privatePreviewGallery = isDesign
        && !props.mine
        && challengeMetadataFlag(props.challenge, 'submissionsViewable')
    const usePublicPreviewPage = privatePreviewGallery && !props.viewerMemberId
    const response: SWRResponse<OpportunityPage<ChallengeSubmission>, Error> = useSWR(
        [
            usePublicPreviewPage ? 'opportunities:submission-previews' : 'opportunities:submissions',
            props.challenge.id,
            props.memberId,
            page,
            perPage,
        ],
        () => (usePublicPreviewPage
            ? getChallengeSubmissionPreviews(props.challenge.id, page, perPage)
            : getChallengeSubmissions(
                props.challenge.id,
                page,
                perPage,
                props.memberId,
                !props.mine,
            )),
        { revalidateOnFocus: false },
    )
    const previewResponse: SWRResponse<OpportunityPage<ChallengeSubmission>, Error> = useSWR(
        privatePreviewGallery && !!props.viewerMemberId
            ? ['opportunities:submission-previews', props.challenge.id, page, perPage]
            : undefined,
        () => getChallengeSubmissionPreviews(props.challenge.id, page, perPage),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )
    const scoreResponse: SWRResponse<ChallengeReviewSummation[], Error> = useSWR(
        isMarathonMatch && !privatePreviewGallery
            ? ['opportunities:mm-review-summations', props.challenge.id]
            : undefined,
        () => getChallengeReviewSummations(props.challenge.id),
        { revalidateOnFocus: false },
    )
    const submissions = useMemo(() => {
        const previewById = new Map((previewResponse.data?.items ?? [])
            .map(item => [item.id, item.previewUrl]))
        const items = (response.data?.items ?? []).map(item => ({
            ...item,
            previewUrl: item.previewUrl ?? previewById.get(item.id),
        }))
        return isMarathonMatch
            ? attachMarathonReviewSummations(items, scoreResponse.data ?? [])
            : items
    }, [isMarathonMatch, previewResponse.data?.items, response.data?.items, scoreResponse.data])
    const submissionMemberIds = useMemo(
        () => (props.mine
            ? []
            : Array.from(new Set(submissions
                .map(challengeSubmissionMemberId)
                .filter((memberId): memberId is string => !!memberId)))),
        [props.mine, submissions],
    )
    const profileResponse: SWRResponse<MemberProfileSummary[], Error> = useSWR(
        submissionMemberIds.length
            ? ['opportunities:member-profiles', ...submissionMemberIds]
            : undefined,
        () => getMemberProfilesByUserIds(submissionMemberIds),
        { revalidateOnFocus: false },
    )
    const profilesById = useMemo(
        () => memberProfilesById(profileResponse.data),
        [profileResponse.data],
    )
    const showAllSubmissionFinalScores = shouldShowFinalSubmissionScores(
        props.challenge,
        submissions,
    )

    /**
     * Opens an authorized clean-storage download without exposing private URLs in list data.
     *
     * @param submission selected authored submission.
     * @returns void after opening the signed URL or reporting a request error.
     * @throws Does not throw; download failures are reported through a toast.
     */
    const downloadSubmission = async (submission: ChallengeSubmission): Promise<void> => {
        setDownloadingSubmissionId(submission.id)
        try {
            const url = await getChallengeSubmissionDownloadUrl(submission.id)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.rel = 'noreferrer'
            anchor.target = '_blank'
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to download this submission.')
        } finally {
            setDownloadingSubmissionId(undefined)
        }
    }

    /**
     * Deletes an owned Design submission after explicit member confirmation.
     *
     * @param submission selected authored submission.
     * @returns void after refreshing the current submission page or reporting an error.
     * @throws Does not throw; deletion failures are reported through a toast.
     */
    const removeSubmission = async (submission: ChallengeSubmission): Promise<void> => {
        // eslint-disable-next-line no-alert
        if (!window.confirm(`Delete submission ${submission.id}? This action cannot be undone.`)) return
        setDeletingSubmissionId(submission.id)
        try {
            await deleteChallengeSubmission(submission.id)
            await response.mutate()
            toast.success('Submission deleted.')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to delete this submission.')
        } finally {
            setDeletingSubmissionId(undefined)
        }
    }

    if (response.isValidating && !response.data) {
        return <OpportunityTabLoading label='Loading submissions' />
    }

    if (response.error) return <TabError onRetry={() => response.mutate()} />
    if (!response.data?.items.length) {
        if (props.mine) {
            return (
                <MySubmissionsEmpty
                    challengeId={props.challenge.id}
                    onStartSubmission={props.onStartSubmission}
                />
            )
        }

        return privatePreviewGallery
            ? (
                <EmptyTab
                    title='No submission previews yet'
                    text='Reviewed submission previews will appear here when they are released.'
                />
            )
            : <EmptyTab title='No submissions yet' text='Visible submissions will appear here.' />
    }

    const pagination = (
        <OpportunityPagination
            onPageChange={setPage}
            onPerPageChange={(value: number) => {
                setPerPage(value)
                setPage(1)
            }}
            page={response.data.page}
            perPage={response.data.perPage}
            total={response.data.total}
            totalPages={response.data.totalPages}
        />
    )
    return (
        <div className={styles.tableSection}>
            <div className={styles.submissionHeading}>
                <div>
                    <h2>{props.mine ? 'My Submissions' : 'All Submissions'}</h2>
                    {props.mine && <p>Manage your submissions or upload new.</p>}
                </div>
                {props.mine ? (
                    <a
                        className={styles.reviewAppButton}
                        href={challengeReviewUrl(props.challenge.id)}
                        rel='noreferrer'
                        target='_blank'
                    >
                        Open Review App
                        <IconOutline.ExternalLinkIcon aria-hidden='true' />
                    </a>
                ) : isMarathonMatch && (
                    <div aria-label='Submission view' className={styles.submissionViewToggle} role='group'>
                        <button
                            aria-label='Table view'
                            aria-pressed={marathonView === 'list'}
                            className={marathonView === 'list' ? styles.activeView : undefined}
                            onClick={() => setMarathonView('list')}
                            type='button'
                        >
                            <IconOutline.ViewListIcon aria-hidden='true' />
                        </button>
                        <button
                            aria-label='Dashboard view'
                            aria-pressed={marathonView === 'dashboard'}
                            className={marathonView === 'dashboard' ? styles.activeView : undefined}
                            onClick={() => setMarathonView('dashboard')}
                            type='button'
                        >
                            <IconOutline.ChartBarIcon aria-hidden='true' />
                        </button>
                    </div>
                )}
            </div>
            {isMarathonMatch && !props.mine && marathonView === 'dashboard' ? (
                <MarathonDashboard challenge={props.challenge} />
            ) : privatePreviewGallery ? (
                <div className={styles.previewGrid}>
                    {submissions.map(submission => (
                        <SubmissionPreview
                            key={submission.id}
                            profile={profilesById.get(challengeSubmissionMemberId(submission) ?? '')}
                            submission={submission}
                        />
                    ))}
                </div>
            ) : props.mine ? (
                <div className={styles.tableCard}>
                    <table className={isMarathonMatch
                        ? styles.myMarathonTable
                        : isDesign || isQa
                            ? styles.myCompactSubmissionTable
                            : styles.mySubmissionTable}
                    >
                        <thead>
                            <tr>
                                <th>Submission ID</th>
                                {!isMarathonMatch && <th>Type</th>}
                                <th>
                                    <span className={styles.sortedHeader}>
                                        Submission Date
                                        <IconOutline.ChevronDownIcon aria-hidden='true' />
                                    </span>
                                </th>
                                {isMarathonMatch ? (
                                    <>
                                        <th>Current Test Process</th>
                                        <th>Test Status</th>
                                        <th>Test Progress</th>
                                        <th>Final Score</th>
                                        <th>Provision Score</th>
                                    </>
                                ) : !isDesign && !isQa && (
                                    <>
                                        <th>Current Status</th>
                                        <th>Score</th>
                                    </>
                                )}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(submission => {
                                const scores = marathonSubmissionScores(submission)
                                const progress = marathonSubmissionTestProgress(submission)
                                const reviewUrl = challengeReviewUrl(props.challenge.id, submission.type)
                                const statusClass = progress.status
                                    ? styles[`testStatus${progress.status.replace(' ', '')}`]
                                    : ''
                                return (
                                    <tr key={submission.id}>
                                        <td>
                                            <a className={styles.submissionIdLink} href={reviewUrl}>
                                                {submission.id}
                                            </a>
                                        </td>
                                        {!isMarathonMatch && <td>{submissionTypeLabel(submission.type)}</td>}
                                        <td>{formatTimestamp(submission.submittedDate ?? submission.createdAt)}</td>
                                        {isMarathonMatch ? (
                                            <>
                                                <td>{progress.process ?? '—'}</td>
                                                <td>
                                                    <span
                                                        className={`${styles.testStatus} ${statusClass}`}
                                                    >
                                                        {progress.status ?? '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.testProgress}>
                                                        <span className={styles.progressTrack}>
                                                            <span style={{ width: `${progress.progress ?? 0}%` }} />
                                                        </span>
                                                        <span>
                                                            {progress.progress === undefined
                                                                ? '—'
                                                                : `${Math.round(progress.progress)}%`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>{formatMarathonScore(scores.finalScore, '-')}</td>
                                                <td>{formatMarathonScore(scores.provisionalScore, 'N/A')}</td>
                                            </>
                                        ) : !isDesign && !isQa ? (
                                            <>
                                                <td>
                                                    <span className={styles.currentStatus}>
                                                        {submissionStatusLabel(submission.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {formatMarathonScore(
                                                        scores.finalScore ?? scores.provisionalScore,
                                                        '-',
                                                    )}
                                                </td>
                                            </>
                                        ) : undefined}
                                        <td>
                                            <div className={styles.submissionActions}>
                                                {(isDesign || isQa || isMarathonMatch) && (
                                                    <button
                                                        aria-label={`Download submission ${submission.id}`}
                                                        disabled={downloadingSubmissionId === submission.id}
                                                        onClick={() => downloadSubmission(submission)}
                                                        title='Download submission'
                                                        type='button'
                                                    >
                                                        <IconOutline.DownloadIcon aria-hidden='true' />
                                                    </button>
                                                )}
                                                {isDesign && (
                                                    <button
                                                        aria-label={`Delete submission ${submission.id}`}
                                                        disabled={deletingSubmissionId === submission.id}
                                                        onClick={() => removeSubmission(submission)}
                                                        title='Delete'
                                                        type='button'
                                                    >
                                                        <IconOutline.TrashIcon aria-hidden='true' />
                                                    </button>
                                                )}
                                                <a
                                                    aria-label={`Open submission ${submission.id} in Review App`}
                                                    href={reviewUrl}
                                                    rel='noreferrer'
                                                    target='_blank'
                                                    title='Open Review App'
                                                >
                                                    <IconOutline.DocumentSearchIcon aria-hidden='true' />
                                                </a>
                                                {!isDesign && !isQa && (
                                                    <button
                                                        aria-label={`View history for submission ${submission.id}`}
                                                        onClick={() => setHistorySubmission(submission)}
                                                        title='Submission history'
                                                        type='button'
                                                    >
                                                        {isMarathonMatch
                                                            ? <IconOutline.SearchIcon aria-hidden='true' />
                                                            : <IconOutline.ChevronDownIcon aria-hidden='true' />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table className={isMarathonMatch
                        ? styles.marathonTable
                        : isQa
                            ? styles.qaSubmissionTable
                            : isDesign
                                ? styles.designSubmissionTable
                                : styles.developmentSubmissionTable}
                    >
                        <thead>
                            <tr>
                                <th>Handle</th>
                                {!isDesign && <th>Rating</th>}
                                <th>
                                    <span className={styles.sortedHeader}>
                                        Submission Date
                                        <IconOutline.ChevronDownIcon aria-hidden='true' />
                                    </span>
                                </th>
                                {isMarathonMatch && <th>Provisional Score</th>}
                                {isMarathonMatch && <th>Final Score</th>}
                                {isQa && <th>Initial Score</th>}
                                {isQa && <th>Final Score</th>}
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(submission => {
                                const scores = marathonSubmissionScores(submission)
                                const profile = profilesById.get(challengeSubmissionMemberId(submission) ?? '')
                                const rating = profile?.maxRating
                                    ?? submission.submitterMaxRating
                                    ?? submission.rating
                                    ?? undefined
                                return (
                                    <tr key={submission.id}>
                                        <td>
                                            <MemberHandle
                                                handle={submissionHandle(submission)}
                                                link={!!profile?.handle
                                                    || !!submission.submitterHandle
                                                    || !!submission.memberHandle
                                                    || !!submission.registrant?.memberHandle
                                                    || !!submission.registrant?.handle}
                                                profile={profile}
                                                rating={rating}
                                            />
                                        </td>
                                        {!isDesign && <td>{rating ?? '—'}</td>}
                                        <td>{formatTimestamp(submission.submittedDate ?? submission.createdAt)}</td>
                                        {isMarathonMatch && (
                                            <td>{formatMarathonScore(scores.provisionalScore, 'N/A')}</td>
                                        )}
                                        {isMarathonMatch && (
                                            <td>
                                                {formatMarathonFinalScore(
                                                    showAllSubmissionFinalScores
                                                        ? scores.finalScore
                                                        : undefined,
                                                    '-',
                                                )}
                                            </td>
                                        )}
                                        {isQa && (
                                            <td>{formatMarathonScore(scores.provisionalScore, 'N/A')}</td>
                                        )}
                                        {isQa && (
                                            <td>
                                                {formatMarathonScore(
                                                    showAllSubmissionFinalScores
                                                        ? scores.finalScore
                                                        : undefined,
                                                    '-',
                                                )}
                                            </td>
                                        )}
                                        <td>
                                            <button
                                                className={styles.historyLink}
                                                onClick={() => setHistorySubmission(submission)}
                                                type='button'
                                            >
                                                <svg aria-hidden='true' viewBox='0 0 24 24'>
                                                    <path
                                                        d={HISTORY_ICON_PATH}
                                                        fill='currentColor'
                                                    />
                                                </svg>
                                                History
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {isMarathonMatch && scoreResponse.error && (
                <p className={styles.scoreNotice} role='status'>
                    Live scorer updates are unavailable; submission scores may be incomplete.
                </p>
            )}
            {!(isMarathonMatch && !props.mine && marathonView === 'dashboard') && (
                <div className={styles.tablePagination}>{pagination}</div>
            )}
            <SubmissionHistoryModal
                challengeId={props.challenge.id}
                isMarathonMatch={isMarathonMatch}
                onClose={() => setHistorySubmission(undefined)}
                open={!!historySubmission}
                reviewSummations={scoreResponse.data}
                showFinalScores={props.mine || showAllSubmissionFinalScores}
                submission={historySubmission}
            />
        </div>
    )
}

/**
 * Resolves the best available submission handle.
 *
 * @param submission Review API submission row.
 * @returns member-facing handle with a generic fallback.
 * @throws Does not throw.
 */
function submissionHandle(submission: ChallengeSubmission): string {
    return submission.submitterHandle
        || submission.memberHandle
        || submission.registrant?.memberHandle
        || submission.registrant?.handle
        || submission.createdBy
        || submission.memberId
        || 'Member'
}

/**
 * Renders one release-gated Design submission preview returned by Review API.
 *
 * @param props submission and optional member profile projection.
 * @returns preview card with a locked fallback for unavailable assets.
 * @throws Does not throw.
 */
const SubmissionPreview: FC<{
    profile?: MemberProfileSummary
    submission: ChallengeSubmission
}> = props => {
    const [previewAvailable, setPreviewAvailable] = useState(!!props.submission.previewUrl)
    /**
     * Hides a preview when a previously released Payload URL becomes unavailable.
     *
     * @param event failed preview image event.
     * @returns void.
     * @throws Does not throw.
     */
    const hidePreview = (event: SyntheticEvent<HTMLImageElement>): void => {
        event.currentTarget.removeAttribute('src')
        setPreviewAvailable(false)
    }

    return (
        <article className={styles.previewCard}>
            <div className={styles.previewVisual}>
                {previewAvailable ? (
                    <img
                        alt={`Submission preview by ${submissionHandle(props.submission)}`}
                        onError={hidePreview}
                        src={props.submission.previewUrl}
                    />
                ) : (
                    <div className={styles.previewPending}>
                        <IconOutline.LockClosedIcon />
                        <strong>The preview is locked until winner announcement</strong>
                    </div>
                )}
            </div>
            <div className={styles.previewDetails}>
                <MemberHandle
                    handle={submissionHandle(props.submission)}
                    link={!!props.profile?.handle
                        || !!props.submission.submitterHandle
                        || !!props.submission.memberHandle
                        || !!props.submission.registrant?.memberHandle
                        || !!props.submission.registrant?.handle}
                    profile={props.profile}
                />
                <dl>
                    <div>
                        <dt>Submission ID:</dt>
                        <dd>{previewAvailable ? props.submission.id : <IconOutline.LockClosedIcon />}</dd>
                    </div>
                    <div>
                        <dt>Type:</dt>
                        <dd>{props.submission.type || 'Submission'}</dd>
                    </div>
                    <div>
                        <dt>Submission Date:</dt>
                        <dd>{formatTimestamp(props.submission.submittedDate ?? props.submission.createdAt)}</dd>
                    </div>
                </dl>
            </div>
        </article>
    )
}

/**
 * Renders the authenticated in-page Challenge Discussion workflow.
 *
 * @param props challenge context, administrator announcement access, and optional authenticated member ID.
 * @returns topic list, creation, threaded detail, and mutation workflows.
 * @throws Does not throw.
 */
const ForumTab: FC<{
    canCreateAnnouncements: boolean
    challenge: ChallengeOpportunity
    memberId?: string
}> = props => (
    <ChallengeForum
        canCreateAnnouncements={props.canCreateAnnouncements}
        challenge={props.challenge}
        memberId={props.memberId}
    />
)

type ChallengeWinner = NonNullable<ChallengeOpportunity['winners']>[number]

interface WinnerStatsEntry {
    handle: string
    stats?: UserStats
}

interface WinnerCardProps {
    finalScore?: number
    placement: number
    profile?: MemberProfileSummary
    prize?: ChallengePlacementPrize
    rating?: number
    showRating: boolean
    trackLabel: string
    wins?: number
    winner: ChallengeWinner
}

/**
 * Normalizes a member handle for stats-result lookup.
 *
 * @param handle public Topcoder handle.
 * @returns trimmed lowercase key.
 * @throws Does not throw.
 */
function memberHandleKey(handle: string): string {
    return handle.trim()
        .toLowerCase()
}

/**
 * Loads public member stats independently so one missing profile cannot hide
 * the remaining winner cards.
 *
 * @param handles deduplicated public handles.
 * @returns one result per requested handle, with failed lookups left empty.
 * @throws Does not throw; individual Members API failures are isolated.
 */
async function getWinnerMemberStats(handles: string[]): Promise<WinnerStatsEntry[]> {
    return Promise.all(handles.map(async handle => {
        try {
            return { handle, stats: await getMemberStatsAsync(handle) }
        } catch {
            return { handle }
        }
    }))
}

/**
 * Formats an integer placement with an English ordinal suffix.
 *
 * @param placement one-based finishing position.
 * @returns member-facing placement label.
 * @throws Does not throw.
 */
function placementLabel(placement: number): string {
    const remainder100 = placement % 100
    if (remainder100 >= 11 && remainder100 <= 13) return `${placement}th Place`
    if (placement % 10 === 1) return `${placement}st Place`
    if (placement % 10 === 2) return `${placement}nd Place`
    if (placement % 10 === 3) return `${placement}rd Place`
    return `${placement}th Place`
}

/**
 * Formats a winner reward from its Challenge API placement prize.
 *
 * @param prize placement prize matched by finishing position.
 * @returns USD, point, or typed reward label; an em dash when unavailable.
 * @throws Does not throw.
 */
function winnerPrizeLabel(prize?: ChallengePlacementPrize): string {
    if (!prize) return '—'
    const type = prize.type?.trim()
        .toUpperCase()
    const value = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
        .format(prize.value)
    if (type === 'POINT' || type === 'POINTS') return `${value} pts`
    if (!type || type === 'USD') return `$${value}`
    return `${value} ${type}`
}

/**
 * Renders one ranked winner in the centered podium presentation.
 *
 * @param props winner data and normalized placement.
 * @returns placement card using the canonical medal asset.
 * @throws Does not throw; unavailable prizes use an em dash.
 */
const WinnerCard: FC<WinnerCardProps> = props => {
    const medals = [medal1, medal2, medal3]
    const handle = props.profile?.handle ?? props.winner.handle ?? props.winner.userId ?? 'Member'
    const medal = medals[props.placement - 1]
    const placeClass = props.placement <= 3
        ? styles[`place${props.placement}`]
        : styles.otherPlace
    return (
        <article className={`${styles.winnerCard} ${placeClass}`}>
            <span aria-hidden='true' className={styles.winnerMedal}>
                {medal ? <img alt='' src={medal} /> : props.placement}
            </span>
            <strong className={styles.winnerPlacement}>{placementLabel(props.placement)}</strong>
            {props.finalScore !== undefined && (
                <span className={styles.winnerScore}>
                    with a final score of
                    {' '}
                    <strong>{formatMarathonFinalScore(props.finalScore, '')}</strong>
                </span>
            )}
            <span className={styles.winnerPrize}>
                {winnerPrizeLabel(props.prize)}
            </span>
            <span className={styles.winnerDivider} />
            <MemberHandle
                handle={handle}
                link={!!props.profile?.handle || !!props.winner.handle}
                profile={props.profile}
                rating={props.rating}
            />
            <span className={styles.winnerMemberStats}>
                <span>{`${props.wins ?? '—'} ${props.trackLabel} wins`}</span>
                {props.showRating && (
                    <>
                        <span aria-hidden='true' className={styles.winnerStatsDivider} />
                        <span>{`${props.rating ?? '—'} rating`}</span>
                    </>
                )}
            </span>
        </article>
    )
}

/**
 * Renders challenge winners once present in the Challenge API response.
 *
 * @param props challenge with winner and prize data, plus the optional viewer ID.
 * @returns winner podium or ongoing-challenge empty state.
 * @throws Does not throw; optional enrichment failures preserve winner rows.
 */
const WinnersTab: FC<{ challenge: ChallengeOpportunity, memberId?: string }> = props => {
    const winners = props.challenge.winners
    const winnerMemberIds = useMemo(
        () => Array.from(new Set((winners ?? [])
            .map(winner => String(winner.userId ?? '')
                .trim())
            .filter(Boolean))),
        [winners],
    )
    const profileResponse: SWRResponse<MemberProfileSummary[], Error> = useSWR(
        winnerMemberIds.length
            ? ['opportunities:winner-member-profiles', ...winnerMemberIds]
            : undefined,
        () => getMemberProfilesByUserIds(winnerMemberIds),
        { revalidateOnFocus: false },
    )
    const profilesById = useMemo(
        () => memberProfilesById(profileResponse.data),
        [profileResponse.data],
    )
    const winnerHandles = useMemo(
        () => Array.from(new Set((winners ?? [])
            .map(winner => profilesById.get(String(winner.userId ?? ''))?.handle ?? winner.handle)
            .map(handle => handle?.trim() ?? '')
            .filter(Boolean))),
        [profilesById, winners],
    )
    const statsResponse: SWRResponse<WinnerStatsEntry[], Error> = useSWR(
        winnerHandles.length
            ? ['opportunities:winner-member-stats', ...winnerHandles]
            : undefined,
        () => getWinnerMemberStats(winnerHandles),
        { revalidateOnFocus: false },
    )
    const statsByHandle = useMemo(
        () => new Map((statsResponse.data ?? [])
            .map(entry => [memberHandleKey(entry.handle), entry.stats])),
        [statsResponse.data],
    )
    const projectResultResponse: SWRResponse<ChallengeProjectResult[], Error> = useSWR(
        winners?.length && props.memberId
            ? ['opportunities:winner-project-results', props.challenge.id]
            : undefined,
        () => getChallengeProjectResults(props.challenge.id),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )

    if (!winners?.length) {
        return (
            <EmptyTab
                title='The challenge is still ongoing'
                text={'Once the review phase is over and the client selected the winners you\'ll see the results here.'}
            />
        )
    }

    const placementPrizes = challengePlacementPrizes(props.challenge)
    const ranked = winners.map((winner, index) => {
        const placement = winner.placement ?? index + 1
        const configuredPrize = placementPrizes.find(candidate => candidate.placement === placement)
        const winnerPrize = typeof winner.prize === 'number' && Number.isFinite(winner.prize)
            ? { placement, type: 'USD', value: winner.prize }
            : undefined
        return {
            placement,
            prize: configuredPrize ?? winnerPrize,
            winner,
        }
    })
        .sort((first, second) => first.placement - second.placement)
    const trackHeading = challengeTrackLabel(props.challenge.track)
    const trackLabel = trackHeading.toLowerCase()
    const showWinnerFinalScores = !!props.memberId && shouldShowFinalSubmissionScores(
        props.challenge,
        [],
        (projectResultResponse.data ?? []).map(result => result.finalScore),
    )
    const rankedWinners = ranked.map(entry => {
        const profile = profilesById.get(String(entry.winner.userId ?? ''))
        const handle = profile?.handle
            ?? entry.winner.handle
            ?? entry.winner.userId
            ?? 'Member'
        const stats = statsByHandle.get(memberHandleKey(handle))
        return {
            ...entry,
            finalScore: showWinnerFinalScores
                ? winnerFinalScore(
                    { ...entry.winner, placement: entry.placement },
                    projectResultResponse.data ?? [],
                )
                : undefined,
            handle,
            profile,
            rating: profile?.maxRating ?? stats?.maxRating?.rating,
            wins: challengeTrackWins(stats, props.challenge.track),
        }
    })
    const showWinnerRating = rankedWinners.length === 1 || rankedWinners.length > 3
    return (
        <section className={styles.winnersSection}>
            <h2>Winners</h2>
            <p>Congratulations to the top members who build outstanding solutions</p>
            <div className={styles.winnersPanel}>
                <div className={styles.podium}>
                    {rankedWinners.slice(0, 3)
                        .map(entry => (
                            <WinnerCard
                                finalScore={entry.finalScore}
                                key={`${entry.placement}-${entry.winner.userId ?? entry.winner.handle ?? 'winner'}`}
                                placement={entry.placement}
                                prize={entry.prize}
                                profile={entry.profile}
                                rating={entry.rating}
                                showRating={showWinnerRating}
                                trackLabel={trackLabel}
                                winner={entry.winner}
                                wins={entry.wins}
                            />
                        ))}
                </div>
                {rankedWinners.length > 3 && (
                    <div className={styles.winnerTable}>
                        <table aria-label='Remaining winners'>
                            <thead>
                                <tr>
                                    <th>Place</th>
                                    <th>Handle</th>
                                    <th>{`${trackHeading} Wins`}</th>
                                    <th>
                                        <span className={styles.sortedHeader}>
                                            Final Score
                                            <IconOutline.ChevronDownIcon aria-hidden='true' />
                                        </span>
                                    </th>
                                    <th>Prize</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankedWinners.slice(3)
                                    .map(entry => {
                                        const isViewer = String(entry.winner.userId ?? '') === props.memberId
                                        const rowKey = `${entry.placement}-`
                                            + `${entry.winner.userId ?? entry.winner.handle ?? 'winner'}`
                                        return (
                                            <tr
                                                className={isViewer ? styles.currentWinnerRow : undefined}
                                                key={rowKey}
                                            >
                                                <td>
                                                    {placementLabel(entry.placement)
                                                        .replace(' Place', '')}
                                                </td>
                                                <td>
                                                    <div className={styles.winnerHandleCell}>
                                                        <MemberHandle
                                                            handle={entry.handle}
                                                            link={!!entry.profile?.handle || !!entry.winner.handle}
                                                            profile={entry.profile}
                                                            rating={entry.rating}
                                                        />
                                                        {isViewer && <span className={styles.winnerYou}>You</span>}
                                                    </div>
                                                </td>
                                                <td>{entry.wins ?? '—'}</td>
                                                <td className={styles.winnerTableScore}>
                                                    {formatMarathonFinalScore(entry.finalScore, '-')}
                                                </td>
                                                <td>{winnerPrizeLabel(entry.prize)}</td>
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className={styles.winnerThanks}>
                    <img alt='' src={winnerThanksIcon} />
                    <strong>Thank you everyone who participated!</strong>
                    Your innovative solutions made this challenge a success.
                </p>
            </div>
        </section>
    )
}

/**
 * Renders the empty My Submissions state with its primary upload action.
 *
 * @param props challenge identifier used by Review App and upload links.
 * @returns empty-state panel.
 * @throws Does not throw.
 */
const MySubmissionsEmpty: FC<{
    challengeId: string
    onStartSubmission?: () => void
}> = props => (
    <section className={styles.mySubmissionsEmpty}>
        <div className={styles.submissionHeading}>
            <div>
                <h2>My Submissions</h2>
                <p>Manage your submissions or upload new.</p>
            </div>
            <a
                className={styles.reviewAppButton}
                href={challengeReviewUrl(props.challengeId)}
                rel='noreferrer'
                target='_blank'
            >
                Open Review App
                <IconOutline.ExternalLinkIcon aria-hidden='true' />
            </a>
        </div>
        <EmptyTab
            action={(
                <button onClick={props.onStartSubmission} type='button'>
                    <IconOutline.UploadIcon />
                    Submit a solution
                </button>
            )}
            title='You have no submissions yet'
            text='Upload a submission to compete in this challenge.'
        />
    </section>
)

/**
 * Renders the authentication handoff for a private member tab.
 *
 * @param props member-facing subject being protected.
 * @returns sign-in callout.
 * @throws Does not throw.
 */
const SignInTab: FC<{ subject: string }> = props => (
    <div className={styles.calloutTab}>
        <IconOutline.LockClosedIcon />
        <h2>{`Sign in to view ${props.subject}`}</h2>
        <a href={authUrlLogin()}>Sign in</a>
    </div>
)

/**
 * Renders a retryable lazy-tab error state.
 *
 * @param props retry callback.
 * @returns error callout.
 * @throws Does not throw.
 */
const TabError: FC<{ onRetry: () => void }> = props => (
    <div className={styles.calloutTab} role='alert'>
        <IconOutline.ExclamationCircleIcon />
        <h2>This section could not be loaded.</h2>
        <button onClick={props.onRetry} type='button'>Try again</button>
    </div>
)

interface EmptyTabProps {
    action?: ReactNode
    text: string
    title?: string
}

/**
 * Renders a neutral empty-tab message and optional in-context action.
 *
 * @param props title, text, and optional action.
 * @returns empty-state callout.
 * @throws Does not throw.
 */
const EmptyTab: FC<EmptyTabProps> = props => (
    <div className={styles.emptyTab}>
        <IconOutline.InformationCircleIcon />
        {props.title && <strong>{props.title}</strong>}
        <p>{props.text}</p>
        {props.action}
    </div>
)

export default ChallengeDetailsPage
