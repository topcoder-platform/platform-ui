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
    Tooltip,
} from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import {
    CampusChallengeFilter,
    CampusLeaderboardMember,
} from '../../lib/models'
import { CampusLeaderboardResource, useCampusLeaderboard } from '../../lib/hooks'
import {
    IconHelp,
    IconInfo,
    IconStatMembers,
    IconStatRegistered,
    IconStatSubmitted,
    placementIcons,
} from '../../lib/assets/icons'
import { MemberAvatar, StatCard } from '../../lib/components'

import { ParticipationHistoryModal } from './ParticipationHistoryModal'
import { RankingRulesModal } from './RankingRulesModal'
import styles from './CampusLeaderboardPage.module.scss'

const PAGE_SIZE: number = 50

const CHALLENGE_FILTER_OPTIONS: ReadonlyArray<InputSelectOption> = [
    { label: 'All Challenges', value: 'all' },
    { label: 'Public Challenges', value: 'public' },
    { label: 'Campus Challenges', value: 'campus' },
]

/**
 * Renders a column header with an info tooltip, as designed.
 *
 * @param label column header text.
 * @param tooltip tooltip copy.
 * @returns header renderer.
 */
function headerWithTooltip(label: string, tooltip: string): () => JSX.Element {
    return function renderHeader(): JSX.Element {
        return (
            <>
                {label}
                <Tooltip
                    className={styles.tooltip}
                    content={tooltip}
                    place='top'
                    triggerOn='click-hover'
                >
                    <span className={styles.infoIcon}>
                        <IconInfo />
                    </span>
                </Tooltip>
            </>
        )
    }
}

/**
 * Renders the placement: a medal for the top three ranks, the number otherwise.
 *
 * @param member leaderboard row.
 * @returns rank cell.
 */
function renderRank(member: CampusLeaderboardMember): JSX.Element {
    const Medal = placementIcons[member.rank]

    return Medal
        ? <Medal className={styles.medal} />
        : <span className={styles.rank}>{member.rank}</span>
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
            <MemberAvatar className={styles.avatar} photoURL={member.photoURL} />
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
            columnId: 'rank',
            label: 'Rank',
            renderer: renderRank,
            type: 'element',
        },
        {
            columnId: 'member',
            label: 'Member',
            renderer: renderHandle,
            type: 'element',
        },
        {
            className: styles.numberCell,
            columnId: 'wins',
            label: '# of Wins',
            propertyName: 'wins',
            type: 'number',
        },
        {
            className: styles.numberCell,
            columnId: 'passingSubmissions',
            label: headerWithTooltip(
                '# of Passing Submissions',
                'Challenges where a submission passed review. '
                    + 'At most one passing submission is counted per challenge.',
            ),
            propertyName: 'passingSubmissions',
            type: 'number',
        },
        {
            className: styles.numberCell,
            columnId: 'submissions',
            label: headerWithTooltip(
                '# of Submissions',
                'Challenges the member submitted to. At most one submission is counted per challenge.',
            ),
            propertyName: 'submissions',
            type: 'number',
        },
        {
            className: styles.numberCell,
            columnId: 'registrations',
            label: headerWithTooltip(
                '# of Registrations',
                'Challenges the member registered for.',
            ),
            propertyName: 'registrations',
            type: 'number',
        },
        {
            className: styles.actionCell,
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

            <div className={styles.header}>
                <h1 className={styles.title}>Campus Program Leaderboard</h1>
                <p className={styles.subtitle}>
                    {`Track participation and performance of members in the ${displayGroupName} `}
                    group across challenges.
                </p>
            </div>

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
                        <StatCard
                            icon={IconStatMembers}
                            label='Total Members in the Group'
                            value={data?.summary.totalMembers}
                        />
                        <StatCard
                            icon={IconStatRegistered}
                            label='Members Who Registered to Any Challenge'
                            value={data?.summary.membersRegistered}
                        />
                        <StatCard
                            icon={IconStatSubmitted}
                            label='Members Who Submitted to Any Challenge'
                            value={data?.summary.membersSubmitted}
                        />
                    </div>

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
                            <IconHelp />
                            How ratings are calculated
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <LoadingSpinner hide={!isLoading} />
                        <Table
                            className={classNames('campus-table', styles.lbTable)}
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
