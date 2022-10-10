import qs from 'qs'

import { xhrGetAsync } from '..'
import { EnvironmentConfig } from '../../config'

export interface MembersAutocompeteQuery {
    term: string
}

export interface MembersAutocompeteResult {
    firstName: string
    handle: string
    lastName: string
    userId: string
}

export async function membersAutocompete(term: string): Promise<Array<MembersAutocompeteResult>> {
    const query: MembersAutocompeteQuery = {
        term,
    }

    return xhrGetAsync(`${EnvironmentConfig.API.V5}/members/autocomplete?${qs.stringify(query)}`)
}
