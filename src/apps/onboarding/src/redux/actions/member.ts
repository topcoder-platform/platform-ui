/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable sort-keys */
/* eslint-disable unicorn/no-null */
import moment from 'moment'
import _ from 'lodash'

import { getAsync as getAsyncToken } from '~/libs/core/lib/auth/token-functions/token.functions'
import { TokenModel } from '~/libs/core'
import {
    createMemberTraits,
    updateMemberTraits,
} from '~/libs/core/lib/profile/profile-functions/profile-store/profile-xhr.store'

import { ACTIONS } from '../../config'
import SkillInfo from '../../models/SkillInfo'
import { getMemberInfo, getMemberTraits, putMemberInfo } from '../../services/members'
import WorkInfo from '../../models/WorkInfo'
import EducationInfo from '../../models/EducationInfo'
import PersonalizationInfo from '../../models/PersonalizationInfo'
import MemberAddress from '../../models/MemberAddress'
import MemberInfo from '../../models/MemberInfo'
import ConnectInfo from '../../models/ConnectInfo'

export const updateMemberInfo: any = (memberInfo: MemberInfo) => ({
    type: ACTIONS.MEMBER.GET_MEMBER,
    payload: memberInfo,
})

export const updateWorks: any = (works: WorkInfo[]) => ({
    type: ACTIONS.MEMBER.SET_WORKS,
    payload: works,
})

export const updateEducations: any = (educations: EducationInfo[]) => ({
    type: ACTIONS.MEMBER.SET_EDUCATIONS,
    payload: educations,
})

export const updatePersonalization: any = (personalization: PersonalizationInfo) => ({
    type: ACTIONS.MEMBER.SET_PERSONALIZATION,
    payload: personalization,
})

export const updateConnectInfo: any = (connectInfo: ConnectInfo) => ({
    type: ACTIONS.MEMBER.SET_CONNECT_INFO,
    payload: connectInfo,
})

export const updateAddress: any = (address: MemberAddress) => ({
    type: ACTIONS.MEMBER.SET_ADDRESS,
    payload: address,
})

export const updateLoadingMemberTraits: any = (loading: boolean) => ({
    type: ACTIONS.MEMBER.SET_LOADING_MEMBER_TRAITS,
    payload: loading,
})

export const updateLoadingMemberInfo: any = (loading: boolean) => ({
    type: ACTIONS.MEMBER.SET_LOADING_MEMBER_INFO,
    payload: loading,
})
export const fetchMemberInfo: any = () => async (dispatch: any) => {
    let tokenInfo: TokenModel
    let memberInfo: MemberInfo | null = null
    dispatch(updateLoadingMemberInfo(true))
    try {
        tokenInfo = await getAsyncToken()
        memberInfo = await getMemberInfo(tokenInfo.handle || '')
    } catch (error) {
    }

    dispatch(updateLoadingMemberInfo(false))
    if (memberInfo) {
        dispatch(updateMemberInfo(memberInfo))

        if (memberInfo.addresses) {
            const addresses: MemberAddress[] = memberInfo.addresses.map(address => ({
                ...address,
                streetAddr1: address.streetAddr1,
                streetAddr2: address.streetAddr2,
                city: address.city,
                stateCode: address.stateCode,
                zip: address.zip,
            }))
            const matchAddress: MemberAddress = _.find(addresses, { type: 'HOME' }) as MemberAddress
            if (matchAddress) {
                dispatch(updateAddress(matchAddress))
            }
        }
    }
}

const dateTimeToDate: any = (s: string) => (s ? new Date(s) : undefined)
export const fetchMemberTraits: any = () => async (dispatch: any) => {
    const tokenInfo: TokenModel = await getAsyncToken()
    let memberTraits: any = []
    dispatch(updateLoadingMemberTraits(true))
    try {
        memberTraits = await getMemberTraits(tokenInfo.handle || '')
    } catch (error) {
    }

    dispatch(updateLoadingMemberTraits(false))

    const workExp: any = memberTraits.find((t: any) => t.traitId === 'work')
    const workExpValue: any = workExp?.traits?.data
    if (workExpValue) {
        // workExpValue is array of works. fill it to state
        const works: WorkInfo[] = workExpValue.map((j: any, index: number) => {
            const startDate: Date | undefined = dateTimeToDate(j.timePeriodFrom)
            const endDate: Date | undefined = dateTimeToDate(j.timePeriodTo)
            let endDateString: string = endDate ? moment(endDate)
                .format('YYYY') : ''
            if (j.working) {
                endDateString = 'current'
            }

            let startDateString: string = startDate ? moment(startDate)
                .format('YYYY') : ''
            if (startDateString) {
                startDateString += '-'
            }

            const dateDescription: string = (
                startDate || endDate
            ) ? `${startDateString}${endDateString}` : ''
            return ({
                company: j.company,
                position: j.position,
                industry: j.industry,
                city: j.cityTown,
                startDate,
                endDate,
                currentlyWorking: j.working,
                description: j.description,
                dateDescription,
                id: index + 1,
            })
        })
        dispatch(updateWorks(works))
    }

    const educationExp: any = memberTraits.find(
        (t: any) => t.traitId === 'education',
    )
    const educationExpValue: any = educationExp?.traits?.data
    if (educationExpValue) {
        // educationExpValue is array of educations. fill it to state
        const educations: EducationInfo[] = educationExpValue.map((e: any, index: number) => {
            const startDate: Date | undefined = dateTimeToDate(e.timePeriodFrom)
            const endDate: Date | undefined = dateTimeToDate(e.timePeriodTo)
            let endDateString: string = endDate ? moment(endDate)
                .format('YYYY') : ''
            if (!e.graduated) {
                endDateString = 'current'
            }

            let startDateString: string = startDate ? moment(startDate)
                .format('YYYY') : ''
            if (startDateString) {
                startDateString += '-'
            }

            const dateDescription: string = (
                startDate || endDate
            ) ? `${startDateString}${endDateString}` : ''
            return ({
                collegeName: e.schoolCollegeName,
                major: e.major,
                startDate,
                endDate,
                graduated: e.graduated,
                dateDescription,
                id: index + 1,
            })
        })
        dispatch(updateEducations(educations))
    }

    const personalizationExp: any = memberTraits.find(
        (t: any) => t.traitId === 'personalization',
    )
    const personalizationExpValue: any = personalizationExp?.traits?.data
    if (personalizationExpValue) {
        const personalizations: PersonalizationInfo[] = personalizationExpValue.map((e: any) => ({
            ...e,
            referAs: e.referAs,
            profileSelfTitle: e.profileSelfTitle,
            shortBio: e.shortBio,
        }))
        dispatch(updatePersonalization(personalizations[0]))
    }

    const connectInfoExp: any = memberTraits.find(
        (t: any) => t.traitId === 'connect_info',
    )
    const connectInfoExpValue: any = connectInfoExp?.traits?.data
    if (connectInfoExpValue) {
        const connectInfos: ConnectInfo[] = connectInfoExpValue.map((e: any) => ({
            ...e,
            country: e.country,
            phoneNumber: e.phoneNumber,
        }))
        dispatch(updateConnectInfo(connectInfos[0]))
    }
}

const createWorksPayloadData: any = (works: WorkInfo[]) => {
    const data: any = works.map(work => {
        const {
            company,
            position,
            industry,
            city,
            startDate,
            endDate,
            currentlyWorking,
            description,
        }: any = work
        return {
            company,
            industry,
            position,
            cityTown: city,
            description,
            timePeriodFrom: startDate ? startDate.toISOString() : '',
            timePeriodTo: endDate ? endDate.toISOString() : '',
            working: currentlyWorking,
        }
    })

    const payload: any = {
        categoryName: 'Work',
        traitId: 'work',
        traits: {
            data,
        },
    }
    return [payload]
}

export const updateMemberWorks: any = (works: WorkInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await updateMemberTraits(tokenInfo.handle || '', createWorksPayloadData(works))
        dispatch(updateWorks(works))
    } catch (error) {
    }
}

export const createMemberWorks: any = (works: WorkInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createWorksPayloadData(works))
        dispatch(updateWorks(works))
    } catch (error) {
    }
}

const createEducationsPayloadData: any = (educations: EducationInfo[]) => {
    const data: any = educations.map(education => {
        const {
            collegeName,
            major,
            startDate,
            endDate,
            graduated,
        }: any = education
        return {
            schoolCollegeName: collegeName,
            major,
            timePeriodFrom: startDate ? startDate.toISOString() : '',
            timePeriodTo: endDate ? endDate.toISOString() : '',
            graduated,
        }
    })

    const payload: any = {
        categoryName: 'Education',
        traitId: 'education',
        traits: {
            data,
        },
    }
    return [payload]
}

export const updateMemberEducations: any = (educations: EducationInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await updateMemberTraits(tokenInfo.handle || '', createEducationsPayloadData(educations))
        dispatch(updateEducations(educations))
    } catch (error) {
    }
}

export const createMemberEducations: any = (educations: EducationInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createEducationsPayloadData(educations))
        dispatch(updateEducations(educations))
    } catch (error) {
    }
}

const createPersonalizationsPayloadData: any = (personalizations: PersonalizationInfo[]) => {
    const data: any = personalizations.map(personalization => {
        const {
            referAs,
            profileSelfTitle,
            shortBio,
        }: any = personalization
        return {
            ...personalization,
            referAs,
            profileSelfTitle,
            shortBio,
        }
    })

    const payload: any = {
        categoryName: 'Personalization',
        traitId: 'personalization',
        traits: {
            data,
        },
    }
    return [payload]
}

export const updateMemberPersonalizations: any = (personalizations: PersonalizationInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await updateMemberTraits(tokenInfo.handle || '', createPersonalizationsPayloadData(personalizations))
        dispatch(updatePersonalization(personalizations[0]))
    } catch (error) {
    }
}

export const createMemberPersonalizations: any = (personalizations: PersonalizationInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createPersonalizationsPayloadData(personalizations))
        dispatch(updatePersonalization(personalizations[0]))
    } catch (error) {
    }
}

const createConnectInfosPayloadData: any = (connectInfos: ConnectInfo[]) => {
    const data: any = connectInfos.map(connectInfo => {
        const {
            country,
            phoneNumber,
        }: any = connectInfo
        return {
            ...connectInfo,
            country,
            phoneNumber,
        }
    })

    const payload: any = {
        categoryName: 'Connect User Information',
        traitId: 'connect_info',
        traits: {
            data,
        },
    }
    return [payload]
}

export const updateMemberConnectInfos: any = (connectInfos: ConnectInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await updateMemberTraits(tokenInfo.handle || '', createConnectInfosPayloadData(connectInfos))
        dispatch(updateConnectInfo(connectInfos[0]))
    } catch (error) {
    }
}

export const createMemberConnectInfos: any = (connectInfos: ConnectInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createConnectInfosPayloadData(connectInfos))
        dispatch(updateConnectInfo(connectInfos[0]))
    } catch (error) {
    }
}

export const setMemberSkills: any = (skills: SkillInfo[]) => ({
    type: ACTIONS.MEMBER.UPDATE_MEMBER_SKILLS,
    payload: skills,
})

export const setMemberPhotoUrl: any = (photoUrl: string) => ({
    type: ACTIONS.MEMBER.UPDATE_MEMBER_PHOTO_URL,
    payload: photoUrl,
})

export const updateMemberSkills: any = (skills: SkillInfo[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        await putMemberInfo(tokenInfo.handle || '', {
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

export const updateMemberHomeAddresss: any = (addresses: MemberAddress[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        await putMemberInfo(tokenInfo.handle || '', {
            addresses: addresses.map(address => ({
                ...address,
                streetAddr1: address.streetAddr1,
                streetAddr2: address.streetAddr2,
                city: address.city,
                stateCode: address.stateCode,
                zip: address.zip,
                type: 'HOME',
            })),
        })
        dispatch(updateAddress(addresses[0]))
    } catch (error) {
    }
}
