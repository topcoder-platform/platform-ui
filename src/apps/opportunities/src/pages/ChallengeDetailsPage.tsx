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
    ProfileContextData,
    useProfileContext,
} from '~/libs/core'
import { IconOutline, LoadingSpinner } from '~/libs/ui'

import {
    ChallengeDescription,
    ChallengeDetailHeader,
    ChallengeSidebar,
    ChallengeTermsModal,
    ChallengeTocItem,
    extractTableOfContents,
    isHtmlDescriptionFormat,
    OpportunityPagination,
    ReportIssueModal,
} from '../components'
import {
    challengeCatalogKey,
    ChallengePlacementPrize,
    challengePlacementPrizes,
} from '../components/challenge-card.utils'
import {
    ChallengeOpportunity,
    ChallengeResource,
    ChallengeSubmission,
    ChallengeTerm,
    OpportunityPage,
} from '../models'
import {
    agreeToChallengeTerms,
    getChallengeOpportunity,
    getChallengeRegistration,
    getChallengeSubmissionPreviews,
    getChallengeSubmissions,
    getChallengeSubmitters,
    registerForChallenge,
    unregisterFromChallenge,
} from '../services'
import { challengeForumUrl } from '../utils'
import medal1 from '../assets/medal-1.svg'
import medal2 from '../assets/medal-2.svg'
import medal3 from '../assets/medal-3.svg'

import styles from './ChallengeDetailsPage.module.scss'

type ChallengeTab = 'requirements' | 'registrants' | 'submissions' | 'mine' | 'forum' | 'winners'

interface TabConfig {
    count?: number
    id: ChallengeTab
    label: string
}

/** Returns a challenge catalog name from legacy or v6 response shapes. */
function catalogName(value: string | { name?: string } | undefined): string {
    return typeof value === 'string' ? value : value?.name || ''
}

/** Formats API timestamps used in submission and phase tables. */
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
    const tabs = useMemo<TabConfig[]>(() => [
        { id: 'requirements', label: 'Requirements' },
        { count: challenge?.numOfRegistrants, id: 'registrants', label: 'Registrants' },
        { count: challenge?.numOfSubmissions, id: 'submissions', label: 'Submissions' },
        { id: 'mine', label: 'My Submissions' },
        { count: challenge?.numOfPosts, id: 'forum', label: 'Forum' },
        { id: 'winners', label: 'Winners' },
    ], [challenge?.numOfPosts, challenge?.numOfRegistrants, challenge?.numOfSubmissions])

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
        if (!registration || !window.confirm('Unregister from this competition?')) return
        setRegistrationBusy(true)
        try {
            await unregisterFromChallenge(registration.id)
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
                isRegistered={!!registration}
                onRegister={startRegistration}
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
                            aria-controls={`challenge-panel-${tab.id}`}
                            aria-selected={activeTab === tab.id}
                            className={activeTab === tab.id ? styles.activeTab : undefined}
                            id={`challenge-tab-${tab.id}`}
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
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
                        memberId={memberId}
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
    memberId?: string
}

/** Renders only the active challenge tab and defers its domain request until selected. */
const ChallengeTabContent: FC<ChallengeTabContentProps> = props => {
    if (props.activeTab === 'requirements') return <RequirementsTab challenge={props.challenge} />
    if (props.activeTab === 'registrants') return <RegistrantsTab challengeId={props.challenge.id} />
    if (props.activeTab === 'submissions') {
        const isDesign = catalogName(props.challenge.track)
            .toLowerCase() === 'design'
        return props.memberId || isDesign
            ? <SubmissionsTab challenge={props.challenge} />
            : <SignInTab subject='submissions' />
    }

    if (props.activeTab === 'mine') {
        return props.memberId
            ? <SubmissionsTab challenge={props.challenge} memberId={props.memberId} mine />
            : <SignInTab subject='your submissions' />
    }

    if (props.activeTab === 'forum') return <ForumTab challenge={props.challenge} />
    return <WinnersTab challenge={props.challenge} />
}

/** Renders format-aware requirements and a Markdown-only table of contents. */
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
    if (rating >= 3000) return styles.ratingRed
    if (rating >= 2200) return styles.ratingYellow
    if (rating >= 1500) return styles.ratingBlue
    if (rating >= 1200) return styles.ratingGreen
    return styles.ratingGray
}

/**
 * Renders the compact avatar and linked handle shared by detail tables/cards.
 *
 * @param props resolved member handle.
 * @returns member identity cell without synthesizing unavailable profile photos.
 * @throws Does not throw.
 */
const MemberHandle: FC<MemberHandleProps> = props => (
    <span className={styles.member}>
        <span aria-hidden='true' className={styles.avatar}>
            {props.handle.charAt(0)
                .toUpperCase()}
        </span>
        <Link className={ratingClass(props.rating)} to={`/members/${encodeURIComponent(props.handle)}`}>
            {props.handle}
        </Link>
    </span>
)

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

/** Loads registrants only after the Registrants tab is selected. */
const RegistrantsTab: FC<{ challengeId: string }> = props => {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const response: SWRResponse<OpportunityPage<ChallengeResource>, Error> = useSWR(
        ['opportunities:registrants', props.challengeId, page, perPage],
        () => getChallengeSubmitters(props.challengeId, page, perPage),
        { revalidateOnFocus: false },
    )
    if (response.isValidating && !response.data) return <LoadingSpinner />
    if (response.error) return <TabError onRetry={() => response.mutate()} />
    if (!response.data?.items.length) {
        return <EmptyTab title='No registrants yet' text='Registered competitors will appear here.' />
    }

    return (
        <div className={styles.tableSection}>
            <h2>Registrants</h2>
            <div className={styles.tableCard}>
                <table>
                    <thead>
                        <tr>
                            <th>Handle</th>
                            <th>Registration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {response.data.items.map(resource => {
                            const handle = resource.memberHandle || String(resource.memberId || 'Member')
                            return (
                                <tr key={resource.id}>
                                    <td><MemberHandle handle={handle} rating={resource.rating} /></td>
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
}

/** Loads and paginates submissions only after a submission tab is selected. */
const SubmissionsTab: FC<SubmissionsTabProps> = props => {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const isDesign = catalogName(props.challenge.track)
        .toLowerCase() === 'design'
    const releasedPreviewGallery = isDesign && !props.mine
    const response: SWRResponse<OpportunityPage<ChallengeSubmission>, Error> = useSWR(
        [
            releasedPreviewGallery ? 'opportunities:submission-previews' : 'opportunities:submissions',
            props.challenge.id,
            props.memberId,
            page,
            perPage,
        ],
        () => (releasedPreviewGallery
            ? getChallengeSubmissionPreviews(props.challenge.id, page, perPage)
            : getChallengeSubmissions(props.challenge.id, page, perPage, props.memberId)),
        { revalidateOnFocus: false },
    )
    if (response.isValidating && !response.data) return <LoadingSpinner />
    if (response.error) return <TabError onRetry={() => response.mutate()} />
    if (!response.data?.items.length) {
        if (props.mine) return <MySubmissionsEmpty challengeId={props.challenge.id} />
        return releasedPreviewGallery
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
            <h2>{props.mine ? 'My Submissions' : 'All Submissions'}</h2>
            {props.mine && <p className={styles.sectionDescription}>Manage your submissions or upload new.</p>}
            {releasedPreviewGallery ? (
                <div className={styles.previewGrid}>
                    {response.data.items.map(submission => (
                        <SubmissionPreview key={submission.id} submission={submission} />
                    ))}
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <table>
                        <thead>
                            <tr>
                                <th>Handle</th>
                                <th>Submission Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {response.data.items.map(submission => (
                                <tr key={submission.id}>
                                    <td><MemberHandle handle={submissionHandle(submission)} /></td>
                                    <td>{formatTimestamp(submission.submittedDate ?? submission.createdAt)}</td>
                                    <td>
                                        <Link
                                            className={styles.historyLink}
                                            to={`/review/active-challenges/${props.challenge.id}/challenge-details`}
                                        >
                                            <IconOutline.RefreshIcon />
                                            History
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div className={styles.tablePagination}>{pagination}</div>
        </div>
    )
}

/** Resolves the best available submission handle. */
function submissionHandle(submission: ChallengeSubmission): string {
    return submission.submitterHandle
        || submission.memberHandle
        || submission.registrant?.memberHandle
        || submission.registrant?.handle
        || submission.createdBy
        || submission.memberId
        || 'Member'
}

/** Renders one release-gated design submission preview returned by Review API. */
const SubmissionPreview: FC<{ submission: ChallengeSubmission }> = props => {
    const [previewAvailable, setPreviewAvailable] = useState(!!props.submission.previewUrl)
    /** Hides an asset when a previously released Payload URL becomes unavailable. */
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
                <MemberHandle handle={submissionHandle(props.submission)} />
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

/** Renders the available forum handoff in the Figma two-column forum shell. */
const ForumTab: FC<{ challenge: ChallengeOpportunity }> = props => {
    const forumUrl = challengeForumUrl(props.challenge)
    if (!forumUrl) {
        return <EmptyTab title='Challenge Forum' text='A challenge forum is not available.' />
    }

    return (
        <div className={styles.forumLayout}>
            <aside className={styles.forumInfo}>
                <h2>Challenge Forum</h2>
                <div>
                    <span>{catalogName(props.challenge.track) || 'Competition'}</span>
                    <span>{catalogName(props.challenge.type) || 'Challenge'}</span>
                </div>
                <a href={forumUrl} rel='noreferrer' target='_blank'>Open forum</a>
            </aside>
            <div className={styles.forumFallback}>
                <IconOutline.ChatAlt2Icon />
                <h2>Continue the discussion</h2>
                <p>Ask questions and follow clarifications from the challenge team in the Topcoder forum.</p>
                <a href={forumUrl} rel='noreferrer' target='_blank'>
                    Open forum
                    <IconOutline.ExternalLinkIcon />
                </a>
            </div>
        </div>
    )
}

type ChallengeWinner = NonNullable<ChallengeOpportunity['winners']>[number]

interface WinnerCardProps {
    placement: number
    prize?: ChallengePlacementPrize
    winner: ChallengeWinner
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
    const placeLabels = ['1st Place', '2nd Place', '3rd Place']
    const handle = props.winner.handle ?? props.winner.userId ?? 'Member'
    return (
        <article className={`${styles.winnerCard} ${styles[`place${props.placement}`]}`}>
            <img alt='' aria-hidden='true' src={medals[props.placement - 1] ?? medal3} />
            <strong>{placeLabels[props.placement - 1] ?? `${props.placement}th Place`}</strong>
            <span className={styles.winnerPrize}>
                {winnerPrizeLabel(props.prize)}
            </span>
            <MemberHandle handle={handle} />
        </article>
    )
}

/** Renders challenge winners once present in the Challenge API response. */
const WinnersTab: FC<{ challenge: ChallengeOpportunity }> = props => {
    if (!props.challenge.winners?.length) {
        return (
            <EmptyTab
                title='The challenge is still ongoing'
                text={'Once the review phase is over and the client selected the winners you\'ll see the results here.'}
            />
        )
    }

    const placementPrizes = challengePlacementPrizes(props.challenge)
    const ranked = props.challenge.winners.map((winner, index) => ({
        placement: winner.placement ?? index + 1,
        prize: placementPrizes.find(candidate => candidate.placement === (winner.placement ?? index + 1)),
        winner,
    }))
    const podium = [2, 1, 3]
        .map(placement => ranked.find(entry => entry.placement === placement))
        .filter((entry): entry is {
            placement: number
            prize: ChallengePlacementPrize | undefined
            winner: ChallengeWinner
        } => !!entry)
    return (
        <section className={styles.winnersSection}>
            <h2>Winners</h2>
            <p>Congratulations to the top members who build outstanding solutions</p>
            <div className={styles.winnersPanel}>
                <div className={styles.podium}>
                    {podium.map(entry => (
                        <WinnerCard
                            key={`${entry.placement}-${entry.winner.userId ?? entry.winner.handle ?? 'winner'}`}
                            placement={entry.placement}
                            prize={entry.prize}
                            winner={entry.winner}
                        />
                    ))}
                </div>
                <p className={styles.winnerThanks}>
                    <IconOutline.BadgeCheckIcon />
                    <strong>Thank you everyone who participated!</strong>
                    Your innovative solutions made this challenge a success.
                </p>
            </div>
        </section>
    )
}

/** Renders the empty My Submissions state with its primary upload action. */
const MySubmissionsEmpty: FC<{ challengeId: string }> = props => (
    <section className={styles.mySubmissionsEmpty}>
        <h2>My Submissions</h2>
        <p>Manage your submissions or upload new.</p>
        <EmptyTab
            action={(
                <a href={`/challenges/${props.challengeId}/submit`}>
                    <IconOutline.UploadIcon />
                    Submit a solution
                </a>
            )}
            title='You have no submissions yet'
            text='Upload a submission to compete in this challenge.'
        />
    </section>
)

/** Renders the auth handoff for private member tabs. */
const SignInTab: FC<{ subject: string }> = props => (
    <div className={styles.calloutTab}>
        <IconOutline.LockClosedIcon />
        <h2>{`Sign in to view ${props.subject}`}</h2>
        <a href={authUrlLogin()}>Sign in</a>
    </div>
)

/** Renders a retryable lazy-tab error state. */
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

/** Renders a neutral empty tab message and optional in-context action. */
const EmptyTab: FC<EmptyTabProps> = props => (
    <div className={styles.emptyTab}>
        <IconOutline.InformationCircleIcon />
        {props.title && <strong>{props.title}</strong>}
        <p>{props.text}</p>
        {props.action}
    </div>
)

export default ChallengeDetailsPage
