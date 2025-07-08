import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

interface Member {
    firstName: string,
    lastName: string,
    handle: string,
    userId: number,
    stats: {
        COPILOT: {
            activeProjects: number,
            fulfillment: number,
        }
    }[]
}

export interface FormattedMembers extends Member {
    copilotFulfillment: number,
    activeProjects: number,
}

export type MembersResponse = SWRResponse<FormattedMembers[], FormattedMembers[]>

/**
 * Gets a list of members given a list of user ids.
 * @param userIds User Ids.
 */
export const getMembersByUserIds = async (
    userIds: string[],
): Promise<Array<{ userId: string }>> => {
    let qs = ''
    userIds.forEach(userId => {
        qs += `&userIds[]=${userId.toLowerCase()}`
    })

    return xhrGetAsync<Array<{ userId: string }>>(
        `${EnvironmentConfig.API.V5}/members?${qs}`,
    )
}

const membersFactory = (members: Member[]): FormattedMembers[] => members.map(member => ({
    ...member,
    activeProjects: member.stats?.find(item => item.COPILOT?.activeProjects)?.COPILOT?.activeProjects || 0,
    copilotFulfillment: member.stats?.find(item => item.COPILOT?.fulfillment)?.COPILOT?.fulfillment || 0,
}))

/**
 * Custom hook to fetch members by list of user ids
 *
 * @param {string} userIds - List of user ids
 * @returns {MembersResponse} - The response containing the list of members data
 */
export const useMembers = (userIds: number[]): MembersResponse => {
    let qs = ''
    userIds.forEach(userId => {
        qs += `&userIds[]=${userId}`
    })
    const url = `${EnvironmentConfig.API.V5}/members?${qs}`

    const fetcher = (urlp: string): Promise<FormattedMembers[]> => xhrGetAsync<FormattedMembers[]>(urlp)
        .then(data => membersFactory(data))
        .catch(() => [])

    return useSWR(url, fetcher, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })
}
