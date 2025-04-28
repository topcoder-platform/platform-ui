/**
 * Mock data for the challenge info
 */
import moment from 'moment'

import { ChallengeInfo } from '../lib/models'

import { MockSubmissions } from './MockSubmissions'
import { REVIEWER, SUBMITTER } from '../config/index.config'

export const MockChallengeInfo: ChallengeInfo = {
    currentPhase: 'Review',
    currentPhaseEndDate: moment()
        .add(50, 'minutes')
        .toISOString(),
    id: '1',
    name: 'Topcoder Admin App - User Management',
    submissions: MockSubmissions,
    role: SUBMITTER,
}

export const MockChalenges: ChallengeInfo[] = [
    {
        currentPhase: 'Review',
        currentPhaseEndDate: moment()
            .add(50, 'minutes')
            .toISOString(),
        id: '1',
        name: 'Topcoder Admin App - User Management',
        submissions: MockSubmissions,
        role: SUBMITTER,
    },
    {
        currentPhase: 'Review',
        currentPhaseEndDate: moment()
            .subtract(16, 'hours')
            .toISOString(),
        id: '2',
        name: 'Robust automation testing framework for mobile applications',
        submissions: [MockSubmissions[1], MockSubmissions[2]],
        role: SUBMITTER,
    },
    {
        currentPhase: 'Review',
        currentPhaseEndDate: moment()
            .add(2, 'days')
            .toISOString(),
        id: '3',
        name: 'Snowflake Submission for Upcoming Opportunities',
        submissions: [MockSubmissions[1], MockSubmissions[2], MockSubmissions[3]],
        role: SUBMITTER,
    },
    {
        currentPhase: 'Appeal',
        currentPhaseEndDate: moment()
            .add(2, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '4',
        name: 'Work Manager - Assets Library management',
        submissions: [],
        role: REVIEWER
    },
    {
        currentPhase: 'Appeal Response',
        currentPhaseEndDate: moment()
            .add(1, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '5',
        name: 'Topcoder Admin App - Challenge Management',
        submissions: [],
        role: REVIEWER
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '5',
        name: 'Design Prisma Schema for Topcoder Review API',
        submissions: [],
        role: REVIEWER
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '6',
        name: 'Marathon Match 160',
        submissions: [],
        role: REVIEWER
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '7',
        name: 'Review App - UI prototype Reviewer Flow',
        submissions: [],
        role: REVIEWER
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '8',
        name: 'Topcoder Online Review - Document uploading failing after upgrade',
        submissions: [],
        role: REVIEWER
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '9',
        name: 'Topcoder Connect App - Universal nav fixes',
        submissions: [],
        role: REVIEWER
    },
]

export const MockChalengesDesign: ChallengeInfo[] = [
    MockChalenges[0],
    MockChalenges[1],
]

export const MockChalengesCode: ChallengeInfo[] = []

export const MockChalengesBugHunt: ChallengeInfo[] = [
    MockChalenges[2],
    MockChalenges[3],
]

export const MockChalengesTestSuite: ChallengeInfo[] = [
    MockChalenges[4],
    MockChalenges[5],
]

export const MockChalengesCopilotOpportunity: ChallengeInfo[] = [
    MockChalenges[6],
    MockChalenges[7],
]

export const MockChalengesMarathonMatch: ChallengeInfo[] = [
    MockChalenges[2],
    MockChalenges[7],
]

export const MockChalengesFirst2Finish: ChallengeInfo[] = [
    MockChalenges[5],
    MockChalenges[6],
]

export const MockChalengesOther: ChallengeInfo[] = [
    MockChalenges[4],
    MockChalenges[5],
]
