/* eslint-disable complexity */
import {
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { generatePath, useParams, useSearchParams } from 'react-router-dom'
import { mutate } from 'swr'
import { toast } from 'react-toastify'

import { authUrlLogin, profileContext, ProfileContextData } from '~/libs/core'
import {
    Breadcrumb,
    BreadcrumbItemModel,
    LoadingSpinner,
    type TabsNavItem,
} from '~/libs/ui'

import {
    challengeDetailRouteId,
    challengeListingRouteId,
    rootRoute,
} from '../../config/routes.config'
import { SUBMITTER_ROLE_ID } from '../../config/index.config'
import type {
    BackendChallengeCheckpoints,
    ChallengeInfo,
    CommunityMeta,
    PlacementPrize,
    UseChallengeResult,
    UseRegistrantsResult,
    UseSubmissionsResult,
    UseThriveArticlesResult,
} from '../../lib'
import {
    fetchChallengeResources,
    getDisplayWinners,
    getForumLink,
    getPlacementPrizes,
    hasOpenSubmissionPhase,
    isDesignChallenge,
    isMarathonMatch,
    isWiproRegistrationBlocked,
    registerForChallenge,
    TermsModal,
    unregisterFromChallenge,
    useChallenge,
    useCommunityMeta,
    useRegistrants,
    useSubmissions,
    useTerms,
    useThriveArticles,
} from '../../lib'

import { ChallengeHeader } from './components/ChallengeHeader'
import { Checkpoints } from './components/Checkpoints'
import { Registrants } from './components/Registrants'
import { SecurityReminderModal } from './components/SecurityReminderModal'
import { Specification } from './components/Specification'
import { Submissions } from './components/Submissions'
import { ThriveArticlesSidebar } from './components/ThriveArticlesSidebar'
import { Winners } from './components/Winners'
import styles from './ChallengeDetail.module.scss'

const WIPRO_REGISTRATION_BLOCKED_MESSAGE = 'Wipro employees are not allowed to participate in this Topcoder challenge.'

enum ChallengeDetailTab {
    checkpoints = 'checkpoints',
    details = 'details',
    registrants = 'registrants',
    submissions = 'submissions',
    winners = 'winners',
}

interface SortOption {
    field: string
    sort: 'asc' | 'desc'
}

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function getFirstNonOtherTag(tags: string[] | undefined): string | undefined {
    return tags?.find(tag => tag.toLowerCase() !== 'other')
}

function getSubmissionsViewable(challenge: ChallengeInfo): boolean {
    const metadata = challenge.metadata as unknown

    if (Array.isArray(metadata)) {
        const match = metadata.find(item => (
            typeof item === 'object'
            && item !== null
            && (item as { name?: string }).name === 'submissionsViewable'
        )) as { value?: string | boolean } | undefined

        return match?.value === true || `${match?.value}` === 'true'
    }

    if (metadata && typeof metadata === 'object') {
        const value = (metadata as Record<string, unknown>).submissionsViewable
        return value === true || `${value}` === 'true'
    }

    return false
}

/**
 * Challenge detail page container.
 *
 * @returns Challenge detail page content.
 */
const ChallengeDetail: FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const { challengeId }: { challengeId?: string } = useParams<{ challengeId: string }>()
    const { isLoggedIn, profile }: ProfileContextData = useContext(profileContext)

    const [activeTab, setActiveTab] = useState<ChallengeDetailTab>(ChallengeDetailTab.details)
    const [allTermIds, setAllTermIds] = useState<string[]>([])
    const [checkpointFeedbackState, setCheckpointFeedbackState] = useState<Record<string, boolean>>({})
    const [registering, setRegistering] = useState(false)
    const [registrantsSort, setRegistrantsSort] = useState<SortOption>({
        field: 'Registration Date',
        sort: 'asc',
    })
    const [showDeadlineDetail, setShowDeadlineDetail] = useState(false)
    const [showSecurityReminder, setShowSecurityReminder] = useState(false)
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [submissionsSort, setSubmissionsSort] = useState<SortOption>({
        field: 'Submission Date',
        sort: 'desc',
    })
    const [unregistering, setUnregistering] = useState(false)

    const communityId = searchParams.get('communityId') ?? undefined
    const { challenge, isLoading: isLoadingChallenge }: UseChallengeResult = useChallenge(challengeId)
    const { communityMeta }: { communityMeta: CommunityMeta | undefined } = useCommunityMeta(communityId)
    const {
        isLoading: isLoadingRegistrants,
        registrants,
    }: UseRegistrantsResult = useRegistrants(challengeId)
    const {
        isLoading: isLoadingSubmissions,
        submissions,
    }: UseSubmissionsResult = useSubmissions(challengeId)
    const {
        loadTerms,
        signDocuSign,
        state: termsState,
    }: ReturnType<typeof useTerms> = useTerms()
    const termsStateRef = useRef(termsState)
    const processedDocuSignTemplateRef = useRef<string | undefined>(undefined)

    const thrivePhrase = useMemo(() => {
        if (!challenge || isDesignChallenge(challenge)) {
            return undefined
        }

        return getFirstNonOtherTag(challenge.tags)
    }, [challenge])

    const { articles }: UseThriveArticlesResult = useThriveArticles(
        thrivePhrase
            ? {
                limit: 3,
                phrase: thrivePhrase,
                type: 'Article',
            }
            : undefined,
    )

    const challengePrizes: PlacementPrize[] = useMemo(
        () => (challenge ? getPlacementPrizes(challenge) : []),
        [challenge],
    )
    const displayWinners = useMemo(
        () => (challenge ? getDisplayWinners(challenge) : []),
        [challenge],
    )

    const isLegacyMM = challenge
        ? isMarathonMatch(challenge) && Boolean(challenge.roundId)
        : false
    const forumLink = challenge ? getForumLink(challenge) : undefined
    const hasRegistered = challenge?.isRegistered ?? false
    const userRoles = challenge?.userDetails?.roles ?? []
    const allAvailableTermIds = useMemo(() => {
        const challengeTermIds = (challenge?.terms ?? [])
            .map(term => (typeof term === 'string' ? term : term.id))
            .filter((termId): termId is string => Boolean(termId))

        return Array.from(new Set([
            ...challengeTermIds,
            ...(communityMeta?.terms ?? []),
        ]))
    }, [challenge?.terms, communityMeta?.terms])
    const submissionEnded = challenge
        ? challenge.status === 'COMPLETED' || !hasOpenSubmissionPhase(challenge.phases)
        : true

    const challengeRegistrants = registrants.length
        ? registrants
        : challenge?.registrants ?? []
    const challengeSubmissions = submissions.length
        ? submissions
        : challenge?.submissions ?? []

    const mySubmissions = useMemo(() => {
        if (!profile?.handle) {
            return []
        }

        return challengeSubmissions.filter(submission => submission.memberHandle === profile.handle)
    }, [challengeSubmissions, profile?.handle])

    const checkpoints: BackendChallengeCheckpoints | undefined = useMemo(() => {
        if (!challenge?.checkpoints) {
            return undefined
        }

        return {
            ...challenge.checkpoints,
            checkpointResults: challenge.checkpoints.checkpointResults.map(item => ({
                ...item,
                expanded: checkpointFeedbackState[item.submissionId] ?? item.expanded ?? false,
            })),
        }
    }, [challenge?.checkpoints, checkpointFeedbackState])

    const tabs = useMemo<ReadonlyArray<TabsNavItem<ChallengeDetailTab>>>(() => {
        const nextTabs: TabsNavItem<ChallengeDetailTab>[] = [
            {
                id: ChallengeDetailTab.details,
                title: 'Details',
            },
        ]

        if (!challenge) {
            return nextTabs
        }

        if (challenge.numOfRegistrants > 0) {
            nextTabs.push({
                id: ChallengeDetailTab.registrants,
                title: 'Registrants',
            })
        }

        if (isDesignChallenge(challenge) && (challenge.numOfCheckpointSubmissions ?? 0) > 0) {
            nextTabs.push({
                id: ChallengeDetailTab.checkpoints,
                title: 'Checkpoints',
            })
        }

        const numOfSubmissions = challenge.numOfSubmissions + (challenge.numOfCheckpointSubmissions ?? 0)
        if (isLoggedIn && numOfSubmissions > 0) {
            nextTabs.push({
                id: ChallengeDetailTab.submissions,
                title: 'Submissions',
            })
        }

        if (displayWinners.length > 0 && !isLegacyMM) {
            nextTabs.push({
                id: ChallengeDetailTab.winners,
                title: 'Winners',
            })
        }

        return nextTabs
    }, [challenge, displayWinners.length, isLegacyMM, isLoggedIn])

    useEffect(() => {
        const activeTabExists = tabs.some(tab => tab.id === activeTab)

        if (!activeTabExists) {
            setActiveTab(ChallengeDetailTab.details)
        }
    }, [activeTab, tabs])

    useEffect(() => {
        termsStateRef.current = termsState
    }, [termsState])

    useEffect(() => {
        const docuSignTemplateId = searchParams.get('docuSignReturn')
        if (!docuSignTemplateId || !challenge || processedDocuSignTemplateRef.current === docuSignTemplateId) {
            return undefined
        }

        processedDocuSignTemplateRef.current = docuSignTemplateId
        let canceled = false
        const processDocuSignReturn = async (): Promise<void> => {
            try {
                if (allAvailableTermIds.length) {
                    await loadTerms(allAvailableTermIds)
                    await new Promise<void>(resolve => {
                        setTimeout(resolve, 0)
                    })

                    if (canceled) {
                        return
                    }

                    const matchingTerm = termsStateRef.current.terms.find(term => (
                        term.docusignTemplateId === docuSignTemplateId
                    ))

                    if (matchingTerm) {
                        signDocuSign(matchingTerm.id)
                    }
                }
            } finally {
                if (!canceled) {
                    const nextSearchParams = new URLSearchParams(searchParams)
                    nextSearchParams.delete('docuSignReturn')
                    setSearchParams(nextSearchParams, { replace: true })
                }
            }
        }

        processDocuSignReturn()
            .catch(() => undefined)

        return () => {
            canceled = true
        }
    }, [
        allAvailableTermIds,
        challenge,
        loadTerms,
        searchParams,
        setSearchParams,
        signDocuSign,
    ])

    const challengesUrl = useMemo(() => {
        const path = withLeadingSlash(`${rootRoute}/${challengeListingRouteId}`.replace(/\/{2,}/g, '/'))
        const query = searchParams.toString()

        return query
            ? `${path}?${query}`
            : path
    }, [searchParams])

    const challengeUrl = useMemo(() => {
        if (!challengeId) {
            return challengesUrl
        }

        const detailPath = generatePath(challengeDetailRouteId, { challengeId })
        const path = withLeadingSlash(`${rootRoute}/${detailPath}`.replace(/\/{2,}/g, '/'))
        const query = searchParams.toString()

        return query
            ? `${path}?${query}`
            : path
    }, [challengeId, challengesUrl, searchParams])

    const breadcrumbs = useMemo<Array<BreadcrumbItemModel>>(() => {
        const items: Array<BreadcrumbItemModel> = [
            {
                name: 'Community',
                url: rootRoute || '/',
            },
        ]

        if (communityMeta?.communityName) {
            items.push({
                name: communityMeta.communityName,
                url: challengesUrl,
            })
        }

        items.push({
            name: 'Challenges',
            url: challengesUrl,
        })

        if (challenge?.name) {
            items.push({
                name: challenge.name,
                url: challengeUrl,
            })
        }

        return items
    }, [challenge?.name, challengeUrl, challengesUrl, communityMeta?.communityName])

    const handleRegisterClick = useCallback((): void => {
        if (isWiproRegistrationBlocked(profile?.email, challenge?.isWiproAllowed)) {
            toast.error(WIPRO_REGISTRATION_BLOCKED_MESSAGE)
            return
        }

        if (!isLoggedIn) {
            window.location.assign(authUrlLogin(window.location.href))
            return
        }

        setShowSecurityReminder(true)
    }, [challenge?.isWiproAllowed, isLoggedIn, profile?.email])

    const onRegisterConfirmed = useCallback(async (): Promise<void> => {
        if (!challengeId) {
            return
        }

        setRegistering(true)
        setAllTermIds(allAvailableTermIds)

        try {
            await loadTerms(allAvailableTermIds)
            await new Promise<void>(resolve => {
                setTimeout(resolve, 0)
            })

            if (termsStateRef.current.canRegister) {
                await registerForChallenge(challengeId)
                await Promise.all([
                    mutate(`community/challenge/${challengeId}`),
                    mutate(`community/registrants/${challengeId}`),
                    mutate(`community/submissions/${challengeId}`),
                ])
            } else {
                setShowTermsModal(true)
            }
        } catch {
            toast.error('Failed to register for this challenge.')
        } finally {
            setRegistering(false)
        }
    }, [allAvailableTermIds, challengeId, loadTerms])

    const handleAllTermsAgreed = useCallback(async (): Promise<void> => {
        if (!challengeId) {
            return
        }

        setShowTermsModal(false)
        setRegistering(true)

        try {
            await registerForChallenge(challengeId)
            await Promise.all([
                mutate(`community/challenge/${challengeId}`),
                mutate(`community/registrants/${challengeId}`),
                mutate(`community/submissions/${challengeId}`),
            ])
        } catch {
            toast.error('Failed to register for this challenge.')
        } finally {
            setRegistering(false)
        }
    }, [challengeId])

    const handleTermsModalClose = useCallback((): void => {
        setShowTermsModal(false)
    }, [])

    const handleUnregisterClick = useCallback(async (): Promise<void> => {
        if (!challengeId || !profile?.userId) {
            return
        }

        setUnregistering(true)

        try {
            const resources = await fetchChallengeResources(challengeId)
            const memberId = `${profile.userId}`
            const resource = resources.data.find(item => (
                item.memberId === memberId && item.roleId === SUBMITTER_ROLE_ID
            ))

            if (!resource?.id) {
                toast.error('Unable to find a challenge registration for your account.')
                return
            }

            await unregisterFromChallenge(resource.id)
            await Promise.all([
                mutate(`community/challenge/${challengeId}`),
                mutate(`community/registrants/${challengeId}`),
                mutate(`community/submissions/${challengeId}`),
            ])
        } catch {
            toast.error('Failed to unregister from this challenge.')
        } finally {
            setUnregistering(false)
        }
    }, [challengeId, profile?.userId])

    const handleToggleDeadline = useCallback((): void => {
        setShowDeadlineDetail(previous => !previous)
    }, [])

    const handleToggleCheckpointFeedback = useCallback((submissionId: string, expanded: boolean): void => {
        setCheckpointFeedbackState(previous => ({
            ...previous,
            [submissionId]: expanded,
        }))
    }, [])
    const handleTabChange = useCallback((tab: string): void => {
        setActiveTab(tab as ChallengeDetailTab)
    }, [])
    const handleSecurityReminderCancel = useCallback((): void => {
        setShowSecurityReminder(false)
    }, [])
    const handleSecurityReminderOk = useCallback((): void => {
        setShowSecurityReminder(false)
        onRegisterConfirmed()
            .catch(() => undefined)
    }, [onRegisterConfirmed])

    const isLoading = isLoadingChallenge

    if (isLoading) {
        return (
            <div className={styles.spinnerWrap}>
                <LoadingSpinner />
            </div>
        )
    }

    if (!challenge) {
        return (
            <section className={styles.page}>
                <div className={styles.emptyState}>Challenge not found.</div>
            </section>
        )
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <Breadcrumb
                    items={breadcrumbs}
                    renderInline
                />
            </header>

            <ChallengeHeader
                activeTab={activeTab}
                challenge={challenge}
                challengePrizes={challengePrizes}
                challengesUrl={challengesUrl}
                displayWinners={displayWinners}
                forumLink={forumLink}
                hasRegistered={hasRegistered}
                isLegacyMM={isLegacyMM}
                isLoggedIn={isLoggedIn}
                mySubmissions={mySubmissions}
                onRegisterClick={handleRegisterClick}
                onTabChange={handleTabChange}
                onToggleDeadlines={handleToggleDeadline}
                onUnregisterClick={handleUnregisterClick}
                registering={registering}
                showDeadlineDetail={showDeadlineDetail}
                showForumLink={hasRegistered || userRoles.length > 0}
                submissionEnded={submissionEnded}
                tabs={tabs}
                unregistering={unregistering}
            />

            <div className={styles.tabContent}>
                {activeTab === ChallengeDetailTab.details && (
                    <Specification
                        challenge={challenge}
                        communityMeta={communityMeta}
                    />
                )}

                {activeTab === ChallengeDetailTab.registrants && (
                    <Registrants
                        challenge={challenge}
                        checkpointResults={checkpoints?.checkpointResults ?? []}
                        notFoundCountryFlagUrl={{}}
                        onSortChange={setRegistrantsSort}
                        registrants={challengeRegistrants}
                        results={displayWinners}
                        sort={registrantsSort}
                        statisticsData={[]}
                    />
                )}

                {activeTab === ChallengeDetailTab.checkpoints && checkpoints && (
                    <Checkpoints
                        checkpoints={checkpoints}
                        onToggleFeedback={handleToggleCheckpointFeedback}
                    />
                )}

                {activeTab === ChallengeDetailTab.submissions && (
                    <Submissions
                        auth={{
                            handle: profile?.handle,
                            userId: profile?.userId,
                        }}
                        challenge={challenge}
                        isLegacyMM={isLegacyMM}
                        isLoggedIn={isLoggedIn}
                        onSortChange={setSubmissionsSort}
                        sort={submissionsSort}
                        submissionEnded={submissionEnded}
                        submissions={challengeSubmissions}
                    />
                )}

                {activeTab === ChallengeDetailTab.winners && (
                    <Winners
                        isDesign={isDesignChallenge(challenge)}
                        isLoggedIn={isLoggedIn}
                        isMM={isMarathonMatch(challenge)}
                        prizes={challengePrizes}
                        submissions={challengeSubmissions}
                        viewable={getSubmissionsViewable(challenge)}
                        winners={displayWinners}
                    />
                )}
            </div>

            {!!articles.length && <ThriveArticlesSidebar articles={articles} />}

            {(isLoadingRegistrants || isLoadingSubmissions) && (
                <div className={styles.inlineLoading}>Updating challenge data…</div>
            )}

            {showSecurityReminder && (
                <SecurityReminderModal
                    onCancel={handleSecurityReminderCancel}
                    onOk={handleSecurityReminderOk}
                />
            )}

            {showTermsModal && (
                <TermsModal
                    challengeId={challengeId!}
                    onAllAgreed={handleAllTermsAgreed}
                    onClose={handleTermsModalClose}
                    termIds={allTermIds}
                />
            )}
        </section>
    )
}

export default ChallengeDetail
