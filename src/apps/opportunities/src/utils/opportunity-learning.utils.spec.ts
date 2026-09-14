import {
    AI_EXPONENTIAL_LEAGUE_URL,
    QA_BUG_HUNT_LEARNING_URL,
    QA_COMPETITION_TYPES_URL,
} from './opportunity-learning.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: { TOPCODER_URL: 'https://www.topcoder-qa.com' },
}), { virtual: true })

describe('opportunity learning destinations', () => {
    it('keeps the AI hub and QA resources on the configured Topcoder environment', () => {
        expect(AI_EXPONENTIAL_LEAGUE_URL)
            .toBe('https://www.topcoder-qa.com/ai-hub/ai-exponential-league')
        expect(QA_BUG_HUNT_LEARNING_URL)
            .toBe('https://www.topcoder-qa.com/thrive/articles/'
                + 'How%20To%20Compete%20in%20a%20Bug%20Hunt%20Challenge')
        expect(QA_COMPETITION_TYPES_URL)
            .toBe('https://www.topcoder-qa.com/thrive/articles/QA%20Competition%20Types')
    })
})
