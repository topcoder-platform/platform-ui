import { LearnModelBase } from '../../functions'
import { CertificationLearnLevel, LearnCertification } from '../all-certifications-provider'
import { LearnModule } from '../lesson-provider'
import { ResourceProvider } from '../resource-provider-provider'
import { TCASkillType } from '../tca-certifications-provider/tca-skill-type'

export interface LearnCourse extends LearnModelBase {
    certificationId: string
    completionSuggestions: Array<string>
    emsiSkills: Array<TCASkillType>
    estimatedCompletionTimeValue: number
    estimatedCompletionTimeUnits: string
    fccCourseUuid: string
    freeCodeCampCertification: LearnCertification
    id: string
    introCopy: Array<string>
    key: string
    keyPoints: Array<string>
    learnerLevel: CertificationLearnLevel
    moduleCount: number
    modules: Array<LearnModule>
    note: string
    resourceProvider: ResourceProvider
    skills: Array<string>
    title: string
}
