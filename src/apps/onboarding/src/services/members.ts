import { getAsync, putAsync } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'
import { profile } from '~/libs/core/lib/profile/profile-functions/profile-store/profile-endpoint.config'
import { Member } from '~/apps/talent-search/src/lib/models'

export async function getMemberInfo(handle: string): Promise<Member> {
    return getAsync(profile(handle))
}

export async function getMemberTraits(handle: string): Promise<any> {
    return getAsync(`${profile(handle)}/traits`)
}

export async function putMemberInfo(handle: string, data: any): Promise<Member> {
    return putAsync(profile(handle || ''), data)
}
