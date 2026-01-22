import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import type {
    CreateMemberExperienceRequest,
    MemberExperience,
    UpdateMemberExperienceRequest,
} from '../models'

const ENGAGEMENTS_URL = `${EnvironmentConfig.API.V6}/engagements`

export const getMemberExperiences = async (
    engagementId: string,
    assignmentId: string,
): Promise<MemberExperience[]> => (
    xhrGetAsync<MemberExperience[]>(
        `${ENGAGEMENTS_URL}/${engagementId}/assignments/${assignmentId}/experiences`,
    )
)

export const getMemberExperienceById = async (
    experienceId: string,
): Promise<MemberExperience> => (
    xhrGetAsync<MemberExperience>(
        `${ENGAGEMENTS_URL}/experiences/${experienceId}`,
    )
)

export const createMemberExperience = async (
    engagementId: string,
    assignmentId: string,
    data: CreateMemberExperienceRequest,
): Promise<MemberExperience> => (
    xhrPostAsync<CreateMemberExperienceRequest, MemberExperience>(
        `${ENGAGEMENTS_URL}/${engagementId}/assignments/${assignmentId}/experiences`,
        data,
    )
)

export const updateMemberExperience = async (
    engagementId: string,
    assignmentId: string,
    experienceId: string,
    data: UpdateMemberExperienceRequest,
): Promise<MemberExperience> => (
    xhrPutAsync<UpdateMemberExperienceRequest, MemberExperience>(
        `${ENGAGEMENTS_URL}/${engagementId}/assignments/${assignmentId}/experiences/${experienceId}`,
        data,
    )
)
