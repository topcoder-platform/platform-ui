/**
 * Scorecard
 */

import { ScorecardGroup } from './ScorecardGroup.model'

export enum ProjectType {
  DEVELOPMENT = 'DEVELOPMENT',
  DATA_SCIENCE = 'DATA_SCIENCE',
  DESIGN = 'DESIGN',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
}

export const ProjectTypeLabels: Record<ProjectType, string> = {
    [ProjectType.DEVELOPMENT]: 'Development',
    [ProjectType.DATA_SCIENCE]: 'Data Science',
    [ProjectType.DESIGN]: 'Design',
    [ProjectType.QUALITY_ASSURANCE]: 'Quality Assurance',
}

export const categoryByProjectType = {
    DATA_SCIENCE: ['Marathon Match'],
    DESIGN: [
        'Design',
        'Banners/Icons',
        'Web Design',
        'Wireframes',
        'Logo Design',
        'Print/Presentation',
        'Widget or Mobile Screen Design',
        'Application Front-End Design',
        'Design First2Finish',
    ],
    DEVELOPMENT: [
        'Development',
        'Security',
        'Architecture',
        'Deployment',
        'Process',
        'UI Prototype Competition',
        'Conceptualization',
        'RIA Build Competition',
        'RIA Component Competition',
        'Front-End Flash',
        'First2Finish',
        'Code',
    ],
    QUALITY_ASSURANCE: [
        'Testing Competition',
        'Test Suites',
        'Test Scenarios',
        'Reporting',
        'Automated Testing',
    ],
} satisfies Record<ProjectType, string[]>

export enum ScorecardStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

export const ScorecardStatusLabels: Record<ScorecardStatus, string> = {
    [ScorecardStatus.ACTIVE]: 'Active',
    [ScorecardStatus.INACTIVE]: 'Inactive',
    [ScorecardStatus.DELETED]: 'Deleted',
}

export enum ScorecardType {
  SCREENING = 'SCREENING',
  REVIEW = 'REVIEW',
  APPROVAL = 'APPROVAL',
  POST_MORTEM = 'POST_MORTEM',
  SPECIFICATION_REVIEW = 'SPECIFICATION_REVIEW',
  CHECKPOINT_SCREENING = 'CHECKPOINT_SCREENING',
  CHECKPOINT_REVIEW = 'CHECKPOINT_REVIEW',
  ITERATIVE_REVIEW = 'ITERATIVE_REVIEW',
}

export const ScorecardTypeLabels: Record<ScorecardType, string> = {
    [ScorecardType.SCREENING]: 'Screening',
    [ScorecardType.REVIEW]: 'Review',
    [ScorecardType.APPROVAL]: 'Approval',
    [ScorecardType.POST_MORTEM]: 'Post Mortem',
    [ScorecardType.SPECIFICATION_REVIEW]: 'Specification Review',
    [ScorecardType.CHECKPOINT_SCREENING]: 'Checkpoint Screening',
    [ScorecardType.CHECKPOINT_REVIEW]: 'Checkpoint Review',
    [ScorecardType.ITERATIVE_REVIEW]: 'Iterative Review',
}

export interface Scorecard {
    id: string
    name: string
    type: ScorecardType
    challengeTrack: ProjectType
    category: string
    status: ScorecardStatus
    index?: number
    version: string
    challengeType: string
    minScore: number
    maxScore: number
    scorecardGroups: ScorecardGroup[]
}
