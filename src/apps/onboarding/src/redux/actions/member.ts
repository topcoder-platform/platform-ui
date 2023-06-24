/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable sort-keys */
import moment from 'moment'
import { Member } from '~/apps/talent-search/src/lib/models'
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

export const updateMemberInfo: any = (memberInfo: Member) => ({
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

export const fetchMemberInfo: any = () => async (dispatch: any) => {
    try {
        const tokenInfo: TokenModel = await getAsyncToken()
        const memberInfo: Member = await getMemberInfo(tokenInfo.handle || '')
        dispatch(updateMemberInfo(memberInfo))
    } catch (error) {
    }
}

const dateTimeToDate: any = (s: string) => (s ? new Date(s) : undefined)
export const fetchMemberTraits: any = () => async (dispatch: any) => {
    const tokenInfo: TokenModel = await getAsyncToken()
    let memberTraits: any = []
    try {
        memberTraits = await getMemberTraits(tokenInfo.handle || '')
    } catch (error) {
    }

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

export const setMemberSkills: any = (skills: SkillInfo[]) => ({
    type: ACTIONS.MEMBER.UPDATE_MEMBER_SKILLS,
    payload: skills,
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
