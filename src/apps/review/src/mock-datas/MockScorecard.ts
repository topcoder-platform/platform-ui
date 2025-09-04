/* eslint-disable max-len */
/**
 * Mock data for the scorecard info
 */

import { ScorecardInfo } from '../lib/models'

const mockGuidelines = `
The challenge itself has a set of requirements that the submission should fulfill. During evaluation, the reviewer must verify that all requirements are met. This section deals with the major requirements - requirements, which when remain unfulfilled, contribute to the challenge's failure.
A submission not meeting the challenge requirements does not contribute to the challenge's success and jeopardizes the project deliverables and timelines.
Grade using a continuous 0 thru 9 scale - range includes:
* 0-2 - Multiple requirements are missing or were improperly implemented, and most major functionality is missing or does not work.
* 3-5 - A few important requirements are missing or were improperly implemented. Significant areas of the functionality are missing or do not work.
* 6-8 - The implementation takes into consideration all requirements, but there are some areas where one or more requirements are not fully addressed and necessary features are missing.
* 9 - The implementation fully addresses all requirements. All functionality can be used without any issues.
`

export const MockScorecard: ScorecardInfo = {
    id: '1',
    name: 'Generic Post-Mortem Scorecard',
    scorecardGroups: [
        {
            id: '2',
            name: 'Post-Mortem Comments',
            sections: [
                {
                    id: '3',
                    // eslint-disable-next-line max-len
                    name: 'The answers to the questions should try to identify the possible reasons of the contest’s failure.',
                    questions: [
                        {
                            description:
                                'Was the pricing adequate for the contest?',
                            guidelines: mockGuidelines,
                            id: '4',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 0,
                            type: 'YES_NO',
                            weight: 25,
                        },
                        {
                            description:
                                'Was the timeline adequate for the contest?',
                            guidelines: mockGuidelines,
                            id: '5',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 1,
                            type: 'YES_NO',
                            weight: 25,
                        },
                        {
                            description: 'Were the specifications clear?',
                            guidelines: mockGuidelines,
                            id: '6',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 2,
                            type: 'SCALE',
                            weight: 25,
                        },
                        {
                            description: 'Here comes another question',
                            guidelines: mockGuidelines,
                            id: '7',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 3,
                            type: 'SCALE',
                            weight: 25,
                        },
                    ],
                    sortOrder: 1,
                    weight: 60,
                },
                {
                    id: '8',
                    name: 'Challenge Specification Requirements',
                    questions: [
                        {
                            description:
                                'Have all major specification requirements been met?',
                            guidelines: mockGuidelines,
                            id: '9',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 0,
                            type: 'SCALE',
                            weight: 50,
                        },
                        {
                            description:
                                'Have all minor specification requirements been met?',
                            guidelines: mockGuidelines,
                            id: '10',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 1,
                            type: 'SCALE',
                            weight: 50,
                        },
                    ],
                    sortOrder: 2,
                    weight: 40,
                },
            ],
            sortOrder: 1,
            weight: 60,
        },
        {
            id: '11',
            name: 'This is another section',
            sections: [
                {
                    id: '12',
                    name: 'The answers to the questions should try to identify some other issue.',
                    questions: [
                        {
                            description:
                                'This is the first question of this section',
                            guidelines: mockGuidelines,
                            id: '13',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 0,
                            type: 'SCALE',
                            weight: 50,
                        },
                        {
                            description:
                                'This is the second question of this section',
                            guidelines: mockGuidelines,
                            id: '14',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 1,
                            type: 'SCALE',
                            weight: 50,
                        },
                    ],
                    sortOrder: 1,
                    weight: 30,
                },
                {
                    id: '15',
                    name: 'Testing',
                    questions: [
                        {
                            description:
                                'Does the code have proper code coverage?',
                            guidelines: mockGuidelines,
                            id: '16',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 0,
                            type: 'SCALE',
                            weight: 50,
                        },
                        {
                            description:
                                // eslint-disable-next-line max-len
                                'Do all test cases provided, pass, given any test data or setup for the current application?',
                            guidelines: mockGuidelines,
                            id: '17',
                            requiresUpload: true,
                            scaleMax: 9,
                            scaleMin: 1,
                            sortOrder: 1,
                            type: 'SCALE',
                            weight: 50,
                        },
                    ],
                    sortOrder: 2,
                    weight: 70,
                },
            ],
            sortOrder: 2,
            weight: 40,
        },
    ],
}
