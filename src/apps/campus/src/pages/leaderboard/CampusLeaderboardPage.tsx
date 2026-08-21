/**
 * Campus program leaderboard for a single group (`/:groupName`).
 */
import { ChangeEvent, FC, useCallback, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    ContentLayout,
    IconOutline,
    InputSelect,
    InputSelectOption,
    LoadingSpinner,
    PageTitle,
    Table,
    TableColumn,
} from '~/libs/ui'
import { ProfilePicture } from '~/libs/shared'
import { EnvironmentConfig } from '~/config'

import {
    CampusChallengeFilter,
    CampusLeaderboardMember,
} from '../../lib/models'
import { CampusLeaderboardResource, useCampusLeaderboard } from '../../lib/hooks'

import { ParticipationHistoryModal } from './ParticipationHistoryModal'
import { RankingRulesModal } from './RankingRulesModal'
import { ReactComponent as RankMedal1Icon } from './assets/ic-rank-medal-1.svg'
import { ReactComponent as RankMedal2Icon } from './assets/ic-rank-medal-2.svg'
import { ReactComponent as RankMedal3Icon } from './assets/ic-rank-medal-3.svg'
import styles from './CampusLeaderboardPage.module.scss'

const PAGE_SIZE: number = 50

const CHALLENGE_FILTER_OPTIONS: ReadonlyArray<InputSelectOption> = [
    { label: 'All Challenges', value: 'all' },
    { label: 'Public Challenges', value: 'public' },
    { label: 'Campus Challenges', value: 'campus' },
]

const RANK_MEDAL_ICONS: { [rank: number]: FC<{ className?: string }> } = {
    1: RankMedal1Icon,
    2: RankMedal2Icon,
    3: RankMedal3Icon,
}

/**
 * Renders a rank, as a medal for the top three ranks.
 *
 * @param member leaderboard row.
 * @returns rank cell.
 */
function renderRank(member: CampusLeaderboardMember): JSX.Element {
    const MedalIcon: FC<{ className?: string }> | undefined = RANK_MEDAL_ICONS[member.rank]

    return (
        <span className={styles.placement}>
            {MedalIcon
                ? <MedalIcon className={styles.medal} />
                : <span className={styles.rank}>{member.rank}</span>}
        </span>
    )
}

/**
 * Renders the member avatar and rating-colored handle.
 *
 * @param member leaderboard row.
 * @returns handle cell.
 */
function renderHandle(member: CampusLeaderboardMember): JSX.Element {
    const profileUrl: string | undefined = member.handle
        ? `${EnvironmentConfig.URLS.USER_PROFILE}/${encodeURIComponent(member.handle)}`
        : undefined

    return (
        <div className={styles.handleCell}>
            <ProfilePicture
                className={styles.avatar}
                member={{
                    firstName: member.firstName ?? '',
                    lastName: member.lastName ?? '',
                    photoURL: member.photoURL ?? undefined,
                }}
            />
            {profileUrl ? (
                <a
                    className={styles.handle}
                    href={profileUrl}
                    rel='noopener noreferrer'
                    style={member.ratingColor ? { color: member.ratingColor } : undefined}
                    target='_blank'
                    onClick={function (event: any) { event.stopPropagation() }}
                >
                    {member.handle}
                </a>
            ) : (
                <span
                    className={styles.handle}
                    style={member.ratingColor ? { color: member.ratingColor } : undefined}
                >
                    {member.userId}
                </span>
            )}
        </div>
    )
}

export const CampusLeaderboardPage: FC = () => {
    const groupName: string | undefined = useParams<{ groupName: string }>().groupName
    const [searchParams, setSearchParams] = useSearchParams()
    const searchChallengeFilter: string | null = searchParams.get('type')
    const challengeFilter: CampusChallengeFilter = (
        searchChallengeFilter === 'public' || searchChallengeFilter === 'campus'
    ) ? searchChallengeFilter : 'all'

    const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE)
    const [selectedMember, setSelectedMember] = useState<CampusLeaderboardMember | undefined>()
    const [rulesVisible, setRulesVisible] = useState<boolean>(false)

    const { data, error, isLoading }: CampusLeaderboardResource
        = useCampusLeaderboard(groupName, challengeFilter)

    const displayGroupName: string = data?.group.name ?? groupName ?? ''

    const onFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value as CampusChallengeFilter

        setSearchParams({
            ...Object.fromEntries(searchParams.entries()),
            type: value,
        }, { replace: true })

        setVisibleCount(PAGE_SIZE)
    }, [searchParams, setSearchParams])

    const openParticipationHistory = useCallback((member: CampusLeaderboardMember): void => {
        if (!member.hasActivity) {
            return
        }

        setSelectedMember(member)
    }, [])

    const columns = useMemo<ReadonlyArray<TableColumn<CampusLeaderboardMember>>>(() => [
        {
            className: styles.colRank,
            columnId: 'rank',
            label: 'Rank',
            renderer: renderRank,
            type: 'element',
        },
        {
            className: styles.colHandle,
            columnId: 'handle',
            label: 'Handle',
            renderer: renderHandle,
            type: 'element',
        },
        {
            className: styles.colNumber,
            columnId: 'registrations',
            label: 'Number of Registrations',
            propertyName: 'registrations',
            tooltip: 'Challenges the member registered for.',
            type: 'number',
        },
        {
            className: styles.colNumber,
            columnId: 'submissions',
            label: 'Number of Submissions',
            propertyName: 'submissions',
            tooltip: 'Challenges the member submitted to. At most one submission is counted per challenge.',
            type: 'number',
        },
        {
            className: styles.colNumber,
            columnId: 'passingSubmissions',
            label: 'Number of Passing Submissions',
            propertyName: 'passingSubmissions',
            tooltip: 'Challenges where a submission passed review. '
                + 'At most one passing submission is counted per challenge.',
            type: 'number',
        },
        {
            className: styles.colNumber,
            columnId: 'wins',
            label: 'Number of Wins',
            renderer: (member: CampusLeaderboardMember) => (
                <span className={styles.wins}>{member.wins}</span>
            ),
            type: 'numberElement',
        },
        {
            className: styles.colChevron,
            columnId: 'open',
            label: '',
            renderer: (member: CampusLeaderboardMember) => (member.hasActivity ? (
                <button
                    className={styles.chevronButton}
                    onClick={function () { openParticipationHistory(member) }}
                    type='button'
                    aria-label={`View participation history for ${member.handle ?? member.userId}`}
                >
                    <IconOutline.ChevronRightIcon className={styles.chevron} />
                </button>
            ) : <span />),
            type: 'element',
        },
    ], [openParticipationHistory])

    const members: ReadonlyArray<CampusLeaderboardMember> = data?.members ?? []
    const visibleMembers = useMemo(
        () => members.slice(0, visibleCount),
        [members, visibleCount],
    )

    const onLoadMoreClick = useCallback((): void => {
        setVisibleCount(count => count + PAGE_SIZE)
    }, [])

    return (
        <ContentLayout>
            <PageTitle>Campus Program Leaderboard</PageTitle>

            {!!error && (
                <div className={styles.error}>
                    {error.response?.status === 403
                        ? 'You do not have access to this leaderboard.'
                        : `The leaderboard for "${displayGroupName}" could not be loaded.`}
                </div>
            )}

            {(!!data || isLoading) && (
                <>
                    <div className={styles.stats}>
                        <div className={styles.statCard}>
                            <span className={classNames(styles.statIcon, styles.statIconMembers)}>
                                <IconOutline.UsersIcon />
                            </span>
                            <div>
                                <div className={styles.statLabel}>Total Members in Group</div>
                                <div className={styles.statValue}>
                                    {data?.summary.totalMembers.toLocaleString() ?? '-'}
                                </div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={classNames(styles.statIcon, styles.statIconRegistered)}>
                                <IconOutline.UserAddIcon />
                            </span>
                            <div>
                                <div className={styles.statLabel}>
                                    <strong>Members</strong>
                                    {' Registered to Any Challenge'}
                                </div>
                                <div className={styles.statValue}>
                                    {data?.summary.membersRegistered.toLocaleString() ?? '-'}
                                </div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <span className={classNames(styles.statIcon, styles.statIconSubmitted)}>
                                <IconOutline.DocumentTextIcon />
                            </span>
                            <div>
                                <div className={styles.statLabel}>
                                    <strong>Members</strong>
                                    {' Submitted to Any Challenge'}
                                </div>
                                <div className={styles.statValue}>
                                    {data?.summary.membersSubmitted.toLocaleString() ?? '-'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h1 className={styles.title}>Campus Program Leaderboard</h1>
                        <p className={styles.subtitle}>
                            {`Track participation and performance of members in the ${displayGroupName} `}
                            group across challenges.
                        </p>

                        <div className={styles.toolbar}>
                            <div className={styles.filter}>
                                <InputSelect
                                    name='challengeFilter'
                                    onChange={onFilterChange}
                                    options={CHALLENGE_FILTER_OPTIONS}
                                    value={challengeFilter}
                                />
                            </div>
                            <button
                                className={styles.rulesLink}
                                onClick={function onRulesClick() { setRulesVisible(true) }}
                                type='button'
                            >
                                <IconOutline.QuestionMarkCircleIcon />
                                How rankings are calculated
                            </button>
                        </div>

                        <div className={styles.tableWrapper}>
                            <LoadingSpinner hide={!isLoading} />
                            <Table
                                className={styles.lbTable}
                                columns={columns}
                                data={visibleMembers}
                                disableSorting
                                moreToLoad={visibleCount < members.length}
                                onLoadMoreClick={onLoadMoreClick}
                                removeDefaultSort
                            />
                        </div>

                        {!isLoading && !members.length && (
                            <div className={styles.empty}>
                                {`No members were found in the ${displayGroupName} group.`}
                            </div>
                        )}
                    </div>
                </>
            )}

            <ParticipationHistoryModal
                member={selectedMember}
                onClose={function onModalClose() { setSelectedMember(undefined) }}
            />

            <RankingRulesModal
                onClose={function onRulesClose() { setRulesVisible(false) }}
                open={rulesVisible}
            />
        </ContentLayout>
    )
}

export default CampusLeaderboardPage
