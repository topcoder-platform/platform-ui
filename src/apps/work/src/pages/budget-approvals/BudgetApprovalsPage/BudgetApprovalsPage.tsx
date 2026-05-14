import {
    ChangeEvent,
    FC,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'

import { TableLoading } from '~/apps/admin/src/lib'
import { PageWrapper } from '~/apps/review/src/lib'
import { IconOutline } from '~/libs/ui'

import {
    CHALLENGE_APPROVAL_STATUS,
    CHALLENGE_STATUS,
    PAGE_SIZE,
} from '../../../lib/constants'
import { WorkAppContext } from '../../../lib/contexts'
import { Pagination } from '../../../lib/components'
import {
    useFetchChallenges,
    UseFetchChallengesParams,
    UseFetchChallengesResult,
    useFetchProjects,
    UseFetchProjectsResult,
} from '../../../lib/hooks'
import {
    Challenge,
    Project,
    WorkAppContextModel,
} from '../../../lib/models'

import styles from './BudgetApprovalsPage.module.scss'

function normalizeSearchValue(value: string): string {
    return value
        .trim()
        .toLowerCase()
}

function getProjectId(challenge: Challenge): string {
    return String(challenge.projectId || '')
}

function buildProjectPath(projectId: string): string {
    return `/projects/${encodeURIComponent(projectId)}/challenges`
}

function buildChallengePath(challenge: Challenge, projectId: string): string {
    if (projectId) {
        return `/projects/${encodeURIComponent(projectId)}/challenges/${encodeURIComponent(challenge.id)}/view`
    }

    return `/challenges/${encodeURIComponent(challenge.id)}`
}

function getProjectName(
    projectMap: Map<string, Project>,
    projectId: string,
): string {
    return projectMap.get(projectId)?.name || projectId || 'Unknown project'
}

// eslint-disable-next-line complexity
export const BudgetApprovalsPage: FC = () => {
    const {
        isAdmin,
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const [challengeNameSearch, setChallengeNameSearch] = useState<string>('')
    const [projectNameSearch, setProjectNameSearch] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [perPage, setPerPage] = useState<number>(PAGE_SIZE)

    const memberId = isAdmin
        ? undefined
        : loginUserInfo?.userId

    const challengeFetchParams: UseFetchChallengesParams = {
        approvalStatus: CHALLENGE_APPROVAL_STATUS.PENDING_APPROVAL,
        enabled: isAdmin || memberId !== undefined,
        memberId,
        name: normalizeSearchValue(challengeNameSearch) || undefined,
        page,
        perPage,
        sortBy: 'updated',
        sortOrder: 'desc',
        status: CHALLENGE_STATUS.DRAFT,
    }

    const challengesResult: UseFetchChallengesResult = useFetchChallenges(challengeFetchParams)

    const projectsResult: UseFetchProjectsResult = useFetchProjects({
        memberOnly: !isAdmin,
    })

    const projectMap = useMemo(() => {
        const map = new Map<string, Project>()

        projectsResult.projects.forEach(project => {
            const projectId = String(project.id || '')
            if (!projectId) {
                return
            }

            map.set(projectId, project)
        })

        return map
    }, [projectsResult.projects])

    const accessibleProjectIds = useMemo(
        () => new Set(projectsResult.projects.map(project => String(project.id || ''))),
        [projectsResult.projects],
    )

    const normalizedProjectNameSearch = useMemo(
        () => normalizeSearchValue(projectNameSearch),
        [projectNameSearch],
    )

    const filteredChallenges = useMemo(
        () => challengesResult.challenges
            .filter(challenge => {
                const projectId = getProjectId(challenge)

                if (!projectId) {
                    return false
                }

                if (isAdmin) {
                    return true
                }

                return accessibleProjectIds.has(projectId)
            })
            .filter(challenge => {
                if (!normalizedProjectNameSearch) {
                    return true
                }

                const projectName = getProjectName(projectMap, getProjectId(challenge))

                return normalizeSearchValue(projectName)
                    .includes(normalizedProjectNameSearch)
            }),
        [
            accessibleProjectIds,
            challengesResult.challenges,
            isAdmin,
            normalizedProjectNameSearch,
            projectMap,
        ],
    )

    function handleChallengeNameSearch(event: ChangeEvent<HTMLInputElement>): void {
        setChallengeNameSearch(event.target.value)
        setPage(1)
    }

    function handleProjectNameSearch(event: ChangeEvent<HTMLInputElement>): void {
        setProjectNameSearch(event.target.value)
        setPage(1)
    }

    function handlePageChange(newPage: number): void {
        setPage(newPage)
    }

    function handlePerPageChange(newPerPage: number): void {
        setPerPage(newPerPage)
        setPage(1)
    }

    if (challengesResult.isLoading || (!isAdmin && projectsResult.isLoading)) {
        return <TableLoading />
    }

    const errorMessage = challengesResult.error?.message || projectsResult.error?.message
    const totalPendingApprovals = challengesResult.metadata.total ?? 0
    const shouldShowPagination = !errorMessage && totalPendingApprovals > 0

    return (
        <PageWrapper
            pageTitle='Budget Approvals'
            breadCrumb={[]}
        >
            {errorMessage
                ? <div className={styles.errorBanner}>{errorMessage}</div>
                : undefined}

            <div className={styles.searchRow}>
                <div className={styles.searchField}>
                    <label htmlFor='budget-approvals-project-search'>Project name</label>
                    <input
                        id='budget-approvals-project-search'
                        className={styles.searchInput}
                        onChange={handleProjectNameSearch}
                        placeholder='Search project name'
                        type='text'
                        value={projectNameSearch}
                    />
                </div>
                <div className={styles.searchField}>
                    <label htmlFor='budget-approvals-challenge-search'>Challenge name</label>
                    <input
                        id='budget-approvals-challenge-search'
                        className={styles.searchInput}
                        onChange={handleChallengeNameSearch}
                        placeholder='Search challenge name'
                        type='text'
                        value={challengeNameSearch}
                    />
                </div>
            </div>

            <div className={styles.summaryRow}>
                {totalPendingApprovals}
                {' '}
                pending approvals
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Project Name</th>
                        <th>Challenge Name</th>
                        <th className={styles.actionHeader}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredChallenges.length === 0
                        ? (
                            <tr>
                                <td colSpan={3} className={styles.emptyCell}>
                                    No pending budget approvals found.
                                </td>
                            </tr>
                        )
                        : filteredChallenges.map(challenge => {
                            const projectId = getProjectId(challenge)
                            const projectName = getProjectName(projectMap, projectId)
                            const challengePath = buildChallengePath(challenge, projectId)

                            return (
                                <tr key={challenge.id}>
                                    <td>
                                        <Link className={styles.nameLink} to={buildProjectPath(projectId)}>
                                            {projectName}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link className={styles.nameLink} to={challengePath}>{challenge.name}</Link>
                                    </td>
                                    <td className={styles.actionCell}>
                                        <Link
                                            aria-label={`Open ${challenge.name} details`}
                                            className={styles.actionLink}
                                            to={challengePath}
                                        >
                                            <IconOutline.ExternalLinkIcon className={styles.actionIcon} />
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                </tbody>
            </table>

            {shouldShowPagination
                ? (
                    <Pagination
                        itemLabel='pending approvals'
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        page={challengesResult.metadata.page ?? page}
                        perPage={challengesResult.metadata.perPage ?? perPage}
                        total={totalPendingApprovals}
                    />
                )
                : undefined}
        </PageWrapper>
    )
}

export default BudgetApprovalsPage
