import { EnvironmentConfig } from '~/config'
import { xhrPatchAsync } from '~/libs/core'

import { TCACertification, TCASkillType } from '../tca-certifications-provider'
import { LearnCourse } from '../courses-provider'

const baseUrl = `${EnvironmentConfig.API.V5}/learning-paths`

export async function updateTCACertSkills(
    certification: TCACertification,
    skills: TCASkillType[],
): Promise<void> {
    return xhrPatchAsync(`${baseUrl}/topcoder-certifications/${certification.dashedName}`, {
        skills: skills.map(skill => skill.id),
    })
}

export async function updateTCACourseSkills(
    course: LearnCourse,
    skills: TCASkillType[],
): Promise<void> {
    return xhrPatchAsync(`${baseUrl}/courses/${course.id}`, {
        skills: skills.map(skill => skill.id),
    })
}
