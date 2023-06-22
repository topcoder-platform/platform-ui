/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable sort-keys */
import { Member } from '~/apps/talent-search/src/lib/models'
import { getAsync, putAsync } from '~/libs/core/lib/xhr/xhr-functions/xhr.functions'
import { getAsync as getAsyncToken } from '~/libs/core/lib/auth/token-functions/token.functions'
import { profile } from '~/libs/core/lib/profile/profile-functions/profile-store/profile-endpoint.config'
import { TokenModel } from '~/libs/core'
import { ACTIONS } from '../../config'
import SkillInfo from '../../models/SkillInfo'

export const updateMemberInfo: any = (memberInfo: Member) => ({
    type: ACTIONS.MEMBER.GET_MEMBER,
    payload: memberInfo,
})

export const fetchMemberInfo: any = () => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        const memberInfo: Member = await getAsync(profile(tokenInfo.handle || ''))
        dispatch(updateMemberInfo(memberInfo))
    } catch (error) {
    }
}

export const setMemberSkills: any = (skills: SkillInfo[]) => ({
    type: ACTIONS.MEMBER.UPDATE_MEMBER_SKILLS,
    payload: skills,
})

export const updateMemberSkills: any = (skills: SkillInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        await putAsync(profile(tokenInfo.handle || ''), {
            emsiSkills: skills.map(skill => ({
                skillSources: skill.skillSources,
                subCategory: skill.subCategory,
                emsiId: skill.emsiId,
                name: skill.name,
                category: skill.category,
            })),
        })
        dispatch(setMemberSkills(skills))
    } catch (error) {
    }
}
