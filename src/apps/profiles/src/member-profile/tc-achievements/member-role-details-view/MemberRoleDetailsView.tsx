import {
    FC,
    RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Link, Navigate, Params, useParams } from 'react-router-dom'
import { SWRResponse } from 'swr'

import { Pagination } from '~/apps/admin/src/lib/components/common/Pagination'
import { EnvironmentConfig } from '~/config'
import {
    MemberRoleChallenge,
    MemberRoleChallengesPage,
    MemberRoleTrack,
    MemberSpecialRole,
    useMemberRoleChallenges,
    UserProfile,
} from '~/libs/core'
import { IconOutline, LoadingSpinner } from '~/libs/ui'

import { getUserProfileRoute } from '../../../profiles.routes'

import styles from './MemberRoleDetailsView.module.scss'

const ROLE_CHALLENGES_PER_PAGE = 100

interface MemberRoleDetailsViewProps {
    profile: UserProfile
}

interface RoleMetric {
    label: string
    value: string
}

const roleTrackLabels: Record<MemberRoleTrack, string> = {
    DATA_SCIENCE: 'Data Science Challenges',
    DESIGN: 'Design Challenges',
    DEVELOPMENT: 'Development Challenges',
    QUALITY_ASSURANCE: 'QA Challenges',
}

const roleTrackOrder: MemberRoleTrack[] = [
    'DEVELOPMENT',
    'DESIGN',
    'QUALITY_ASSURANCE',
    'DATA_SCIENCE',
]

const fulfillmentRateFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
})

/**
 * Narrows an arbitrary route segment to a supported profile special role.
 *
 * This function does not throw.
 *
 * @param {string | undefined} role - Role route segment.
 * @returns {MemberSpecialRole | undefined} Valid role identifier when supported.
 */
const parseRole = (role?: string): MemberSpecialRole | undefined => (
    role === 'copilot' || role === 'reviewer' ? role : undefined
)

/**
 * Converts a role identifier to the heading used in the Figma detail panel.
 *
 * This function does not throw.
 *
 * @param {MemberSpecialRole} role - Copilot or reviewer role identifier.
 * @returns {string} Human-readable role heading.
 */
const getRoleTitle = (role: MemberSpecialRole): string => (
    role === 'copilot' ? 'Copilot' : 'Reviewer'
)

/**
 * Formats a fulfillment percentage with at most two fractional digits.
 *
 * This function does not throw.
 *
 * @param {number} rate - API-provided percentage on a zero-to-100 scale.
 * @returns {string} Localized percentage value.
 */
const formatFulfillmentRate = (rate: number): string => `${fulfillmentRateFormatter
    .format(rate)}%`

/**
 * Builds the Figma summary-strip metrics for a role challenge page.
 *
 * Copilot tracks with zero challenges are intentionally omitted. Reviewer pages
 * show only the deduplicated challenge total.
 *
 * This function does not throw.
 *
 * @param {MemberSpecialRole} role - Role displayed by the detail page.
 * @param {MemberRoleChallengesPage | undefined} data - Loaded API page and aggregate statistics.
 * @returns {RoleMetric[]} Ordered display metrics.
 */
const getRoleMetrics = (
    role: MemberSpecialRole,
    data?: MemberRoleChallengesPage,
): RoleMetric[] => {
    if (!data) {
        return []
    }

    if (role === 'reviewer') {
        return [{
            label: data.total === 1 ? 'Challenge' : 'Challenges',
            value: data.total.toLocaleString('en-US'),
        }]
    }

    const trackMetrics: RoleMetric[] = roleTrackOrder
        .filter(track => (data.trackCounts?.[track] ?? 0) > 0)
        .map(track => ({
            label: roleTrackLabels[track],
            value: (data.trackCounts?.[track] ?? 0).toLocaleString('en-US'),
        }))

    return data.fulfillment
        ? [
            ...trackMetrics,
            {
                label: 'Fulfillment Rate',
                value: formatFulfillmentRate(data.fulfillment.rate),
            },
        ]
        : trackMetrics
}

/**
 * Renders one linked challenge card in the role history grid.
 *
 * This component does not throw.
 *
 * @param {{ challenge: MemberRoleChallenge }} props - Challenge returned by member-api-v6.
 * @returns {JSX.Element} External link to the Topcoder challenge page.
 */
const RoleChallengeCard: FC<{ challenge: MemberRoleChallenge }> = props => (
    <a
        className={styles.challengeCard}
        href={`${EnvironmentConfig.URLS.CHALLENGES_PAGE}/${props.challenge.id}`}
        rel='noreferrer'
        target='_blank'
    >
        <span>{props.challenge.name || `Challenge ${props.challenge.id}`}</span>
        <IconOutline.ChevronRightIcon />
    </a>
)

/**
 * Displays a newest-first, API-paginated copilot or reviewer challenge history.
 *
 * The current page contains at most 100 challenge cards. Page changes scroll the
 * card viewport to the top while aggregate stats continue to describe all role challenges.
 *
 * Request failures are rendered in the panel instead of thrown by this component.
 *
 * @param {MemberRoleDetailsViewProps} props - Profile whose role details are displayed.
 * @returns {JSX.Element} Figma-matched role detail panel or a redirect for invalid roles.
 */
const MemberRoleDetailsView: FC<MemberRoleDetailsViewProps> = props => {
    const routeParams: Readonly<Params<string>> = useParams()
    const role = parseRole(routeParams.roleType)
    const [page, setPage] = useState<number>(1)
    const challengeListRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null)
    const {
        data,
        error,
        isValidating,
        mutate,
    }: SWRResponse<MemberRoleChallengesPage, Error> = useMemberRoleChallenges(
        props.profile.handle,
        role,
        page,
        ROLE_CHALLENGES_PER_PAGE,
    )
    const roleTitle = role ? getRoleTitle(role) : ''
    const metrics = useMemo(() => (
        role ? getRoleMetrics(role, data) : []
    ), [data, role])

    useEffect(() => {
        setPage(1)
    }, [props.profile.handle, role])

    useEffect(() => {
        if (data?.totalPages && page > data.totalPages) {
            setPage(data.totalPages)
        }
    }, [data?.totalPages, page])

    /**
     * Selects another API page and resets the scrollable challenge grid to its first row.
     *
     * @param {number} nextPage - One-based role challenge page selected in Pagination.
     * @returns {void} This event handler updates local state and does not return a value.
     * This function does not throw.
     */
    function handlePageChange(nextPage: number): void {
        setPage(nextPage)
        if (challengeListRef.current) {
            challengeListRef.current.scrollTop = 0
        }
    }

    /**
     * Revalidates the current role challenge page after a request failure.
     *
     * @returns {void} This click handler starts SWR revalidation and does not return a value.
     * Request failures remain in SWR's error state and are not thrown synchronously.
     */
    function handleRetry(): void {
        mutate()
            .catch(() => undefined)
    }

    if (!role) {
        return <Navigate replace to={getUserProfileRoute(props.profile.handle)} />
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.navigation}>
                <Link className={styles.backLink} to={getUserProfileRoute(props.profile.handle)}>
                    <IconOutline.ChevronLeftIcon />
                    Back to Member Stats
                </Link>
                <Link
                    aria-label='Close role details'
                    className={styles.closeLink}
                    to={getUserProfileRoute(props.profile.handle)}
                >
                    <IconOutline.XIcon />
                </Link>
            </div>

            <h2>{roleTitle}</h2>
            <hr />

            <section className={styles.statsSection} aria-label={`${roleTitle} Stats`}>
                <h3>
                    {roleTitle}
                    {' '}
                    Stats
                </h3>
                <div className={styles.metrics}>
                    {metrics.map(metric => (
                        <div className={styles.metric} key={metric.label}>
                            <strong>{metric.value}</strong>
                            <span>{metric.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {!data && !error && (
                <div className={styles.loadingState}>
                    <LoadingSpinner
                        inline
                        message={`Loading ${roleTitle.toLowerCase()} challenges...`}
                    />
                </div>
            )}

            {error && (
                <div className={styles.message} role='alert'>
                    <p>{`We couldn't load ${roleTitle.toLowerCase()} challenges.`}</p>
                    <button onClick={handleRetry} type='button'>Try again</button>
                </div>
            )}

            {data && data.challenges.length === 0 && (
                <p className={styles.message}>No role challenges were found.</p>
            )}

            {data && data.challenges.length > 0 && (
                <>
                    <div className={styles.challengeList} ref={challengeListRef}>
                        <div className={styles.challengeGrid}>
                            {data.challenges.map(challenge => (
                                <RoleChallengeCard challenge={challenge} key={challenge.id} />
                            ))}
                        </div>
                    </div>
                    {data.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <Pagination
                                disabled={isValidating}
                                onPageChange={handlePageChange}
                                page={page}
                                totalPages={data.totalPages}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default MemberRoleDetailsView
