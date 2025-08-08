/**
 * Scorecard
 */

export enum ProjectType {
  DEVELOPMENT = 'DEVELOPMENT',
  DATA_SCIENCE = 'DATA_SCIENCE',
  DESIGN = 'DESIGN',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
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

export interface Scorecard {
    id: string
    name: string
    type: ScorecardType
    projectType: ProjectType
    category: string
    status: ScorecardStatus
    index?: number
}
