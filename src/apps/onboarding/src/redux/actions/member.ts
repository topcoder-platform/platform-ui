import _ from 'lodash'

import { TokenModel, updateMemberProfileAsync, UserTraitCategoryNames, UserTraitIds } from '~/libs/core'
import { getAsync as getAsyncToken } from '~/libs/core/lib/auth/token-functions/token.functions'
import {
    createMemberTraits,
    updateMemberTraits,
} from '~/libs/core/lib/profile/profile-functions/profile-store/profile-xhr.store'

import { ACTIONS } from '../../config'
import { dateTimeToDate } from '../../utils/date'
import { getMemberInfo, getMemberTraits, putMemberInfo } from '../../services/members'
import ConnectInfo from '../../models/ConnectInfo'
import EducationInfo from '../../models/EducationInfo'
import MemberAddress from '../../models/MemberAddress'
import MemberInfo from '../../models/MemberInfo'
import PersonalizationInfo from '../../models/PersonalizationInfo'
import WorkInfo from '../../models/WorkInfo'

export const updateMemberInfo: any = (memberInfo: MemberInfo) => ({
    payload: memberInfo,
    type: ACTIONS.MEMBER.GET_MEMBER,
})

export const updateWorks: any = (works: WorkInfo[]) => ({
    payload: [...works],
    type: ACTIONS.MEMBER.SET_WORKS,
})

export const updateEducations: any = (educations: EducationInfo[]) => ({
    payload: [...educations],
    type: ACTIONS.MEMBER.SET_EDUCATIONS,
})

export const updatePersonalizations: (personalizations: PersonalizationInfo[]) => {
    payload: PersonalizationInfo[]
    type: string
} = (personalizations: PersonalizationInfo[]) => ({
    payload: [
        ...personalizations,
    ],
    type: ACTIONS.MEMBER.SET_PERSONALIZATIONS,
})

export const updateConnectInfo: any = (connectInfo: ConnectInfo) => ({
    payload: {
        ...connectInfo,
    },
    type: ACTIONS.MEMBER.SET_CONNECT_INFO,
})

export const updateAddress: any = (address: MemberAddress) => ({
    payload: {
        ...address,
    },
    type: ACTIONS.MEMBER.SET_ADDRESS,
})

export const setMemberDescription: any = (description: string) => ({
    payload: description,
    type: ACTIONS.MEMBER.SET_DESCRIPTION,
})

export const updateLoadingMemberTraits: any = (loading: boolean) => ({
    payload: loading,
    type: ACTIONS.MEMBER.SET_LOADING_MEMBER_TRAITS,
})

export const updateLoadingMemberInfo: any = (loading: boolean) => ({
    payload: loading,
    type: ACTIONS.MEMBER.SET_LOADING_MEMBER_INFO,
})
export const fetchMemberInfo: any = () => async (dispatch: any) => {
    let tokenInfo: TokenModel
    let memberInfo: MemberInfo | undefined
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
                city: address.city,
                stateCode: address.stateCode,
                streetAddr1: address.streetAddr1,
                streetAddr2: address.streetAddr2,
                zip: address.zip,
            }))
            const matchAddress: MemberAddress = _.find(addresses, { type: 'HOME' }) as MemberAddress
            if (matchAddress) {
                dispatch(updateAddress(matchAddress))
            }
        }
    }
}

export const fetchMemberTraits: any = () => async (dispatch: any) => {
    const tokenInfo: TokenModel = await getAsyncToken()
    let memberTraits: any = []
    dispatch(updateLoadingMemberTraits(true))
    try {
        memberTraits = await getMemberTraits(tokenInfo.handle || '')
    } catch (error) {
    }

    dispatch(updateLoadingMemberTraits(false))

    const workExp: any = memberTraits.find((t: any) => t.traitId === UserTraitIds.work)
    const workExpValue: any = workExp?.traits?.data
    if (workExpValue) {
        // workExpValue is array of works. fill it to state
        const works: WorkInfo[] = workExpValue.map((j: any, index: number) => {
            const startDate: Date | undefined = dateTimeToDate(j.timePeriodFrom)
            const endDate: Date | undefined = dateTimeToDate(j.timePeriodTo)
            return ({
                company: j.company,
                currentlyWorking: j.working,
                endDate,
                id: index + 1,
                industry: j.industry,
                position: j.position,
                startDate,
            })
        })
        dispatch(updateWorks(works))
    }

    const educationExp: any = memberTraits.find(
        (t: any) => t.traitId === UserTraitIds.education,
    )
    const educationExpValue: any = educationExp?.traits?.data
    if (educationExpValue) {
        // educationExpValue is array of educations. fill it to state
        const educations: EducationInfo[] = educationExpValue.map((e: any, index: number) => {
            const startDate: Date | undefined = dateTimeToDate(e.timePeriodFrom)
            const endDate: Date | undefined = dateTimeToDate(e.timePeriodTo)
            return ({
                collegeName: e.schoolCollegeName,
                endDate,
                id: index + 1,
                major: e.major,
                startDate,
            })
        })
        dispatch(updateEducations(educations))
    }

    const personalizationExp: any = memberTraits.find(
        (t: any) => t.traitId === UserTraitIds.personalization,
    )
    const personalizationExpValue: any = personalizationExp?.traits?.data
    if (personalizationExpValue) {
        const personalizations: PersonalizationInfo[] = personalizationExpValue.map((e: any) => _.omitBy({
            ...e,
            availableForGigs: e.availableForGigs,
            profileSelfTitle: e.profileSelfTitle,
            referAs: e.referAs,
            shortBio: e.shortBio,
        }, _.isUndefined))
        dispatch(updatePersonalizations(personalizations))
    }

    const connectInfoExp: any = memberTraits.find(
        (t: any) => t.traitId === UserTraitIds.connectInfo,
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
            startDate,
            endDate,
            currentlyWorking,
        }: any = work
        return {
            company,
            industry,
            position,
            timePeriodFrom: startDate ? startDate.toISOString() : '',
            timePeriodTo: endDate ? endDate.toISOString() : '',
            working: currentlyWorking,
        }
    })

    const payload: any = {
        categoryName: UserTraitCategoryNames.work,
        traitId: UserTraitIds.work,
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
    let isCreatedSuccess = false
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createWorksPayloadData(works))
        isCreatedSuccess = true
        dispatch(updateWorks(works))
    } catch (error) {
    }

    if (!isCreatedSuccess) {
        await dispatch(updateMemberWorks(works))
    }
}

const createEducationsPayloadData: any = (educations: EducationInfo[]) => {
    const data: any = educations.map(education => {
        const {
            collegeName,
            major,
            startDate,
            endDate,
        }: any = education
        return {
            major,
            schoolCollegeName: collegeName,
            timePeriodFrom: startDate ? startDate.toISOString() : '',
            timePeriodTo: endDate ? endDate.toISOString() : '',
        }
    })

    const payload: any = {
        categoryName: UserTraitCategoryNames.education,
        traitId: UserTraitIds.education,
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
    let isCreatedSuccess = false
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createEducationsPayloadData(educations))
        isCreatedSuccess = true
        dispatch(updateEducations(educations))
    } catch (error) {
    }

    if (!isCreatedSuccess) {
        await dispatch(updateMemberEducations(educations))
    }
}

const createPersonalizationsPayloadData: any = (personalizations: PersonalizationInfo[]) => {
    const data: any = personalizations.map(personalization => {
        const {
            referAs,
            profileSelfTitle,
            shortBio,
            availableForGigs,
        }: any = personalization
        return _.omitBy({
            ...personalization,
            availableForGigs,
            profileSelfTitle,
            referAs,
            shortBio,
        }, _.isUndefined)
    })

    const payload: any = {
        categoryName: UserTraitCategoryNames.personalization,
        traitId: UserTraitIds.personalization,
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
        dispatch(updatePersonalizations(personalizations))
    } catch (error) {
    }
}

export const createMemberPersonalizations: any = (personalizations: PersonalizationInfo[]) => async (dispatch: any) => {
    let isCreatedSuccess = false
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createPersonalizationsPayloadData(personalizations))
        isCreatedSuccess = true
        dispatch(updatePersonalizations(personalizations))
    } catch (error) {
    }

    if (!isCreatedSuccess) {
        await dispatch(updateMemberPersonalizations(personalizations))
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
        categoryName: UserTraitCategoryNames.connectInfo,
        traitId: UserTraitIds.connectInfo,
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
    let isCreatedSuccess = false
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await createMemberTraits(tokenInfo.handle || '', createConnectInfosPayloadData(connectInfos))
        isCreatedSuccess = true
        dispatch(updateConnectInfo(connectInfos[0]))
    } catch (error) {
    }

    if (!isCreatedSuccess) {
        await dispatch(updateMemberConnectInfos(connectInfos))
    }
}

export const setMemberPhotoUrl: any = (photoUrl: string) => ({
    payload: photoUrl,
    type: ACTIONS.MEMBER.UPDATE_MEMBER_PHOTO_URL,
})

export const setMemberOpenForWork: any = (isOpenForWork: boolean) => ({
    payload: isOpenForWork,
    type: ACTIONS.MEMBER.SET_OPEN_FOR_WORK,
})

export const updateMemberHomeAddresss: any = (addresses: MemberAddress[]) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        await putMemberInfo(tokenInfo.handle || '', {
            addresses: addresses.map(address => ({
                ...address,
                city: address.city,
                stateCode: address.stateCode,
                streetAddr1: address.streetAddr1,
                streetAddr2: address.streetAddr2,
                type: 'HOME',
                zip: address.zip,
            })),
        })
        dispatch(updateAddress(addresses[0]))
    } catch (error) {
    }
}

export const updateMemberDescription: any = (description: string) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        await putMemberInfo(tokenInfo.handle || '', {
            description,
        })
        dispatch(setMemberDescription(description))
    } catch (error) {
    }
}

export const updateMemberPhotoUrl: any = (photoURL: string) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        await putMemberInfo(tokenInfo.handle || '', {
            photoURL,
        })
        dispatch(setMemberPhotoUrl(photoURL))
    } catch (error) {
    }
}

export const updateMemberOpenForWork: any = (isOpenForWork: boolean) => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()

        await updateMemberProfileAsync(
            tokenInfo.handle || '',
            { availableForGigs: isOpenForWork },
        )
        dispatch(setMemberOpenForWork(isOpenForWork))
    } catch (error) {
    }
}
