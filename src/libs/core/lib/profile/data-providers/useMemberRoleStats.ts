import useSWR, { SWRResponse } from 'swr'
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite'

import {
    memberRoleChallengesURL,
    memberRoleStatsURL,
} from '../profile-functions'
import {
    MemberRoleChallenges,
    MemberRoleChallengesPage,
    MemberRoleStats,
    MemberSpecialRole,
} from '../member-role-stats.model'
import { xhrGetAsync } from '../../xhr'

const ROLE_CHALLENGES_PER_PAGE = 100

export interface MemberRoleChallengesResponse {
    data?: MemberRoleChallenges
    error?: Error
    hasMore: boolean
    isValidating: boolean
    loadMore: () => void
    mutate: () => Promise<MemberRoleChallenges | undefined>
}

/**
 * Fetches the copilot and reviewer challenge totals for a member profile.
 *
 * Network failures are exposed through the returned SWR response rather than thrown by this hook.
 *
 * @param {string | undefined} handle - Member handle whose role totals should be loaded.
 * @returns {SWRResponse<MemberRoleStats, Error>} SWR state containing the role summary.
 */
export function useMemberRoleStats(handle?: string): SWRResponse<MemberRoleStats, Error> {
    return useSWR<MemberRoleStats, Error>(handle ? memberRoleStatsURL(handle) : undefined)
}

/**
 * Fetches newest-first challenges for a member's special role as the list is scrolled.
 *
 * The API caps responses at 100 records. Loaded pages are combined into one list,
 * while later pages remain available through `loadMore`.
 *
 * Network failures are exposed through the returned SWR response rather than thrown by this hook.
 *
 * @param {string | undefined} handle - Member handle whose role challenges should be loaded.
 * @param {MemberSpecialRole | undefined} role - Copilot or reviewer role to query.
 * @returns {MemberRoleChallengesResponse} SWR state and controls for the scrollable challenge list.
 */
export function useMemberRoleChallenges(
    handle: string | undefined,
    role: MemberSpecialRole | undefined,
): MemberRoleChallengesResponse {
    const getKey = (
        pageIndex: number,
        previousPageData: MemberRoleChallengesPage | null,
    ): string | undefined => {
        if (!handle || !role) {
            return undefined
        }

        if (previousPageData && pageIndex >= previousPageData.totalPages) {
            return undefined
        }

        return memberRoleChallengesURL(
            handle,
            role,
            pageIndex + 1,
            ROLE_CHALLENGES_PER_PAGE,
        )
    }

    const {
        data: pages,
        error,
        isValidating,
        mutate: mutatePages,
        setSize,
        size,
    }: SWRInfiniteResponse<MemberRoleChallengesPage, Error> = useSWRInfinite<
        MemberRoleChallengesPage,
        Error
    >(
        getKey,
        (url: string): Promise<MemberRoleChallengesPage> => (
            xhrGetAsync<MemberRoleChallengesPage>(url)
        ),
        {
            revalidateFirstPage: false,
            shouldRetryOnError: false,
        },
    )
    const data = combineMemberRoleChallengePages(pages)
    const hasMore = Boolean(
        pages?.length
        && pages.length < pages[0].totalPages,
    )

    /**
     * Requests the next API page when another page is available.
     *
     * @returns {void} This function starts an SWR request and does not return a value.
     */
    function loadMore(): void {
        if (!hasMore || isValidating || error) {
            return
        }

        setSize(size + 1)
            .catch(() => undefined)
    }

    /**
     * Revalidates the pages requested by the scrollable list.
     *
     * @returns {Promise<MemberRoleChallenges | undefined>} Updated combined challenge list.
     */
    async function mutate(): Promise<MemberRoleChallenges | undefined> {
        const updatedPages = await mutatePages(pages, true)

        return combineMemberRoleChallengePages(updatedPages)
    }

    return {
        data,
        error,
        hasMore,
        isValidating,
        loadMore,
        mutate,
    }
}

/**
 * Combines loaded API pages for a member's special role.
 *
 * @param {MemberRoleChallengesPage[] | undefined} pages - Newest-first API pages loaded by SWR.
 * @returns {MemberRoleChallenges | undefined} Combined challenge list and first-page statistics.
 */
function combineMemberRoleChallengePages(
    pages?: MemberRoleChallengesPage[],
): MemberRoleChallenges | undefined {
    const loadedPages = pages?.filter((page): page is MemberRoleChallengesPage => Boolean(page))
    const firstPage = loadedPages?.[0]

    if (!firstPage) {
        return undefined
    }

    return {
        challenges: loadedPages
            .flatMap(page => page.challenges),
        ...(firstPage.fulfillment ? { fulfillment: firstPage.fulfillment } : {}),
        role: firstPage.role,
        total: firstPage.total,
        ...(firstPage.trackCounts ? { trackCounts: firstPage.trackCounts } : {}),
    }
}
