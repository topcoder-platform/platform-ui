import { getAsync, putAsync } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'
import { profile } from '~/libs/core/lib/profile/profile-functions/profile-store/profile-endpoint.config'

import MemberInfo from '../models/MemberInfo'

export async function getMemberInfo(handle: string): Promise<MemberInfo> {
    return getAsync(profile(handle))
}

export async function getMemberTraits(handle: string): Promise<any> {
    return getAsync(`${profile(handle)}/traits`)
}

export async function putMemberInfo(handle: string, data: any): Promise<MemberInfo> {
    return putAsync(profile(handle || ''), data)
}
