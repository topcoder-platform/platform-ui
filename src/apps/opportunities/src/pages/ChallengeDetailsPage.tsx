/* eslint-disable no-use-before-define, react/jsx-no-bind */
import {
    FC,
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
    ChallengeDetailHeader,
    ChallengeMarkdown,
    ChallengeSidebar,
    ChallengeTermsModal,
    ChallengeTocItem,
    OpportunityPagination,
    ReportIssueModal,
} from '../components'
import {
    ChallengeOpportunity,
    ChallengeResource,
    ChallengeSubmission,
    OpportunityPage,
} from '../models'
import {
    agreeToChallengeTerms,
    getChallengeOpportunity,
    getChallengeResources,
    getChallengeSubmissions,
    getSubmissionPreviewUrl,
    registerForChallenge,
    unregisterFromChallenge,
} from '../services'

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
    return Number.isNaN(date.getTime())
        ? '—'
        : new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
            .format(date)
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
    const [issueOpen, setIssueOpen] = useState(false)
    const [registrationBusy, setRegistrationBusy] = useState(false)
    const challengeResponse: SWRResponse<ChallengeOpportunity, Error> = useSWR(
        challengeId ? `opportunities:challenge:${challengeId}` : undefined,
        () => getChallengeOpportunity(challengeId),
        { revalidateOnFocus: false },
    )
    const memberId = profile?.userId === undefined ? undefined : String(profile.userId)
    const registrationResponse: SWRResponse<ChallengeResource[], Error> = useSWR(
        challengeId && memberId ? ['opportunities:registration', challengeId, memberId] : undefined,
        () => getChallengeResources(challengeId, memberId),
        { revalidateOnFocus: false },
    )
    const registration = registrationResponse.data?.[0]
    const challenge = challengeResponse.data
    const tabs = useMemo<TabConfig[]>(() => [
        { id: 'requirements', label: 'Requirements' },
        { count: challenge?.numOfRegistrants, id: 'registrants', label: 'Registrants' },
        { count: challenge?.numOfSubmissions, id: 'submissions', label: 'Submissions' },
        { id: 'mine', label: 'My Submissions' },
        { id: 'forum', label: 'Forum' },
        { id: 'winners', label: 'Winners' },
    ], [challenge?.numOfRegistrants, challenge?.numOfSubmissions])

    /** Opens authentication or the terms confirmation before registration. */
    const startRegistration = (): void => {
        if (!profile) {
            window.location.assign(authUrlLogin(window.location.href))
            return
        }

        setTermsOpen(true)
    }

    /** Agrees to electronic terms and creates the Submitter resource. */
    const completeRegistration = async (): Promise<void> => {
        if (!challenge || !profile) return
        setRegistrationBusy(true)
        try {
            await agreeToChallengeTerms(challenge.terms ?? [])
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
            />
            <nav aria-label='Challenge sections' className={styles.tabs}>
                <div>
                    {tabs.map((tab: TabConfig) => (
                        <button
                            aria-current={activeTab === tab.id ? 'page' : undefined}
                            className={activeTab === tab.id ? styles.activeTab : undefined}
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            type='button'
                        >
                            {tab.label}
                            {tab.count !== undefined && <span>{tab.count}</span>}
                        </button>
                    ))}
                </div>
            </nav>
            <div className={styles.content}>
                <section className={styles.mainContent}>
                    <ChallengeTabContent
                        activeTab={activeTab}
                        challenge={challenge}
                        memberId={memberId}
                    />
                </section>
                <ChallengeSidebar
                    challenge={challenge}
                    onContactTeam={() => setIssueOpen(true)}
                    onShowTerms={() => setTermsOpen(true)}
                />
            </div>
            <ChallengeTermsModal
                busy={registrationBusy}
                onAccept={completeRegistration}
                onClose={() => setTermsOpen(false)}
                open={termsOpen}
                terms={challenge.terms ?? []}
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
        return <SubmissionsTab challenge={props.challenge} />
    }

    if (props.activeTab === 'mine') {
        return props.memberId
            ? <SubmissionsTab challenge={props.challenge} memberId={props.memberId} mine />
            : <SignInTab />
    }

    if (props.activeTab === 'forum') return <ForumTab challenge={props.challenge} />
    return <WinnersTab challenge={props.challenge} />
}

/** Renders the Markdown requirements and generated table of contents. */
const RequirementsTab: FC<{ challenge: ChallengeOpportunity }> = props => {
    const markdown = props.challenge.description || props.challenge.overview || 'Requirements are not available yet.'
    const toc = useMemo(() => {
        const seen = new Map<string, number>()
        return markdown.split('\n')
            .map(line => /^(#{2,3})\s+(.+?)\s*#*$/.exec(line.trim()))
            .filter((match): match is RegExpExecArray => !!match)
            .map(match => {
                const label = match[2].replace(/[*_`~]/g, '')
                    .trim()
                const base = label.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-') || 'section'
                const count = (seen.get(base) ?? 0) + 1
                seen.set(base, count)
                return {
                    id: count === 1 ? base : `${base}-${count}`,
                    label,
                    level: match[1].length as 2 | 3,
                }
            })
    }, [markdown])

    return (
        <div className={styles.requirements}>
            <div className={styles.notice}>
                Please read the challenge requirements carefully and watch the forum for updates.
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
            <ChallengeTimeline challenge={props.challenge} />
            <ChallengeMarkdown markdown={markdown} />
        </div>
    )
}

/** Renders a compact timeline table addressable by the hero anchor. */
const ChallengeTimeline: FC<{ challenge: ChallengeOpportunity }> = props => (
    <section className={styles.timelineTable} id='challenge-timeline'>
        <h2>Reference Timeline</h2>
        <table>
            <thead>
                <tr>
                    <th>Phase</th>
                    <th>Opens</th>
                    <th>Closes</th>
                </tr>
            </thead>
            <tbody>
                {(props.challenge.phases ?? []).map(phase => (
                    <tr key={phase.id ?? phase.name}>
                        <td>{phase.name}</td>
                        <td>{formatTimestamp(phase.actualStartDate ?? phase.scheduledStartDate)}</td>
                        <td>{formatTimestamp(phase.actualEndDate ?? phase.scheduledEndDate)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </section>
)

/** Loads registrants only after the Registrants tab is selected. */
const RegistrantsTab: FC<{ challengeId: string }> = props => {
    const response: SWRResponse<ChallengeResource[], Error> = useSWR(
        ['opportunities:registrants', props.challengeId],
        () => getChallengeResources(props.challengeId),
        { revalidateOnFocus: false },
    )
    if (response.isValidating && !response.data) return <LoadingSpinner />
    if (response.error) return <TabError onRetry={() => response.mutate()} />
    return (
        <div className={styles.tableCard}>
            <h2>{`Registrants (${response.data?.length ?? 0})`}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Handle</th>
                        <th>Member ID</th>
                    </tr>
                </thead>
                <tbody>
                    {response.data?.map(resource => (
                        <tr key={resource.id}>
                            <td>{resource.memberHandle || resource.memberId || 'Member'}</td>
                            <td>{resource.memberId || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
    const response: SWRResponse<OpportunityPage<ChallengeSubmission>, Error> = useSWR(
        ['opportunities:submissions', props.challenge.id, props.memberId, page, perPage],
        () => getChallengeSubmissions(props.challenge.id, page, perPage, props.memberId),
        { revalidateOnFocus: false },
    )
    const track = catalogName(props.challenge.track)
        .toLowerCase()
    if (response.isValidating && !response.data) return <LoadingSpinner />
    if (response.error) return <TabError onRetry={() => response.mutate()} />
    if (!response.data?.items.length) {
        const emptyText = props.mine
            ? 'You have not submitted a solution yet.'
            : 'No submissions are visible yet.'
        return <EmptyTab text={emptyText} />
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
        <div className={styles.submissions}>
            <h2>{props.mine ? 'My Submissions' : 'All Submissions'}</h2>
            {pagination}
            {track === 'design' ? (
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
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {response.data.items.map(submission => (
                                <tr key={submission.id}>
                                    <td>{submissionHandle(submission)}</td>
                                    <td>{formatTimestamp(submission.submittedDate ?? submission.createdAt)}</td>
                                    <td>{submission.type || 'Submission'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {pagination}
        </div>
    )
}

/** Resolves the best available submission handle. */
function submissionHandle(submission: ChallengeSubmission): string {
    return submission.memberHandle
        || submission.registrant?.memberHandle
        || submission.registrant?.handle
        || submission.createdBy
        || submission.memberId
        || 'Member'
}

/** Renders one design submission preview, hiding unreleased/missing images on 404. */
const SubmissionPreview: FC<{ submission: ChallengeSubmission }> = props => {
    const [previewAvailable, setPreviewAvailable] = useState(true)
    /** Hides a preview when the Review API enforces its release gate. */
    const hidePreview = (event: SyntheticEvent<HTMLImageElement>): void => {
        event.currentTarget.removeAttribute('src')
        setPreviewAvailable(false)
    }

    return (
        <article className={styles.previewCard}>
            {previewAvailable ? (
                <img
                    alt={`Submission preview by ${submissionHandle(props.submission)}`}
                    onError={hidePreview}
                    src={getSubmissionPreviewUrl(props.submission.id)}
                />
            ) : (
                <div className={styles.previewPending}>
                    <IconOutline.PhotographIcon />
                    Preview available after review
                </div>
            )}
            <strong>{submissionHandle(props.submission)}</strong>
            <span>{formatTimestamp(props.submission.submittedDate ?? props.submission.createdAt)}</span>
        </article>
    )
}

/** Renders the forum handoff without loading forum data before selection. */
const ForumTab: FC<{ challenge: ChallengeOpportunity }> = props => (
    <div className={styles.calloutTab}>
        <IconOutline.ChatAlt2Icon />
        <h2>Challenge Forum</h2>
        <p>Ask questions and follow clarifications from the challenge team.</p>
        <a
            href={props.challenge.forumId
                ? `https://discussions.topcoder.com/discussion/${props.challenge.forumId}`
                : 'https://discussions.topcoder.com/'}
            rel='noreferrer'
            target='_blank'
        >
            Open forum
            <IconOutline.ExternalLinkIcon />
        </a>
    </div>
)

/** Renders challenge winners once present in the Challenge API response. */
const WinnersTab: FC<{ challenge: ChallengeOpportunity }> = props => {
    if (!props.challenge.winners?.length) return <EmptyTab text='Winners have not been announced.' />
    return (
        <div className={styles.tableCard}>
            <h2>Winners</h2>
            <table>
                <thead>
                    <tr>
                        <th>Placement</th>
                        <th>Handle</th>
                        <th>Prize</th>
                    </tr>
                </thead>
                <tbody>
                    {props.challenge.winners.map((winner, index) => (
                        <tr key={`${winner.placement ?? 'unplaced'}-${winner.userId ?? winner.handle ?? 'winner'}`}>
                            <td>{winner.placement ?? index + 1}</td>
                            <td>{winner.handle ?? winner.userId ?? 'Member'}</td>
                            <td>{winner.prize === undefined ? '—' : `$${winner.prize.toLocaleString()}`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/** Renders the auth handoff for private member tabs. */
const SignInTab: FC = () => (
    <div className={styles.calloutTab}>
        <IconOutline.LockClosedIcon />
        <h2>Sign in to view your submissions</h2>
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

/** Renders a neutral empty tab message. */
const EmptyTab: FC<{ text: string }> = props => (
    <div className={styles.calloutTab}>
        <IconOutline.InformationCircleIcon />
        <p>{props.text}</p>
    </div>
)

export default ChallengeDetailsPage
