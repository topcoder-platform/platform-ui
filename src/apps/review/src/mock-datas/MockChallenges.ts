/**
 * Mock data for the challenge info
 */
// External imports
import moment from 'moment'

// Internal imports
import { ChallengeInfo } from '../lib/models'
import {
    ADMIN,
    BUG_HUNT,
    CODE,
    COPILOT,
    COPILOT_OPPORTUNITY,
    DESIGN,
    FIRST2FINISH,
    MARATHON_MATCH,
    OTHER,
    REVIEWER,
    SUBMITTER,
    TEST_SUITE,
} from '../config/index.config'

import { MockSubmissions } from './MockSubmissions'

export const MockChallengeInfo: ChallengeInfo = {
    currentPhase: 'Review',
    currentPhaseEndDate: moment()
        .add(50, 'minutes')
        .toISOString(),
    id: '1',
    name: 'Topcoder Admin App - User Management',
    role: SUBMITTER,
    submissions: MockSubmissions,
    type: DESIGN,
}

export const MockChalenges: ChallengeInfo[] = [
    {
        currentPhase: 'Review',
        currentPhaseEndDate: moment()
            .add(50, 'minutes')
            .toISOString(),
        id: '1',
        name: 'Topcoder Admin App - User Management',
        role: SUBMITTER,
        submissions: MockSubmissions,
        type: DESIGN,
    },
    {
        currentPhase: 'Review',
        currentPhaseEndDate: moment()
            .subtract(16, 'hours')
            .toISOString(),
        id: '2',
        name: 'Robust automation testing framework for mobile applications',
        role: REVIEWER,
        submissions: [MockSubmissions[1], MockSubmissions[2]],
        type: DESIGN,
    },
    {
        currentPhase: 'Review',
        currentPhaseEndDate: moment()
            .add(2, 'days')
            .toISOString(),
        id: '3',
        name: 'Snowflake Submission for Upcoming Opportunities',
        role: COPILOT,
        submissions: [MockSubmissions[1], MockSubmissions[2], MockSubmissions[3]],
        type: DESIGN,
    },
    {
        currentPhase: 'Appeal',
        currentPhaseEndDate: moment()
            .add(2, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '4',
        name: 'Work Manager - Assets Library management',
        role: ADMIN,
        submissions: [MockSubmissions[2]],
        type: DESIGN,
    },
    {
        currentPhase: 'Appeal Response',
        currentPhaseEndDate: moment()
            .add(1, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '5',
        name: 'Topcoder Admin App - Challenge Management',
        reviewLength: 5,
        role: SUBMITTER,
        submissions: [MockSubmissions[2]],
        type: FIRST2FINISH,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(3, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '6',
        name: 'Design Prisma Schema for Topcoder Review API',
        reviewLength: 2,
        role: REVIEWER,
        submissions: [],
        type: FIRST2FINISH,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(4, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '7',
        name: 'Marathon Match 160',
        role: COPILOT,
        submissions: [],
        type: FIRST2FINISH,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '8',
        name: 'Review App - UI prototype Reviewer Flow',
        role: ADMIN,
        submissions: [],
        type: FIRST2FINISH,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(12, 'hours')
            .toISOString(),
        id: '9',
        name: 'Topcoder Online Review - Document uploading failing after upgrade',
        role: SUBMITTER,
        submissions: [],
        type: CODE,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(5, 'days')
            .add(22, 'hours')
            .toISOString(),
        id: '10',
        name: 'RUX - 96HR NEP Platform Design Concept Challenge',
        role: REVIEWER,
        submissions: [],
        type: CODE,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(6, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '11',
        name: 'AI Agent for Innovation: From Idea to Live Challenge',
        role: COPILOT,
        submissions: [],
        type: CODE,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(6, 'days')
            .add(8, 'hours')
            .toISOString(),
        id: '12',
        name: 'Senior Lead/Analyst/Architect - MS Fabric Expert',
        role: ADMIN,
        submissions: [],
        type: CODE,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(7, 'days')
            .add(1, 'hours')
            .toISOString(),
        id: '13',
        name: 'PPT to Video AI Converter Web App',
        role: ADMIN,
        submissions: [],
        type: BUG_HUNT,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(7, 'days')
            .add(2, 'hours')
            .toISOString(),
        id: '14',
        name: 'Topcoder Admin App - Roles Management Update',
        role: REVIEWER,
        submissions: [],
        type: TEST_SUITE,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(7, 'days')
            .add(3, 'hours')
            .toISOString(),
        id: '15',
        name: 'Topcoder Marathon Matches - Identify missing files',
        role: COPILOT,
        submissions: [],
        type: COPILOT_OPPORTUNITY,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(7, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '16',
        name: 'Topcoder Marathon Matches - Identify missing files',
        role: SUBMITTER,
        submissions: [],
        type: MARATHON_MATCH,
    },
    {
        currentPhase: 'Submission',
        currentPhaseEndDate: moment()
            .add(7, 'days')
            .add(4, 'hours')
            .toISOString(),
        id: '17',
        name: 'Utility to Parse and Export Challenge API Data',
        role: ADMIN,
        submissions: [],
        type: OTHER,
    },
]
