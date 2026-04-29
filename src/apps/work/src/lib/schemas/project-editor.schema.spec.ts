import { PROJECT_STATUS } from '../constants'

import {
    createProjectEditorSchema,
    ProjectEditorSchemaData,
} from './project-editor.schema'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: {
            DIRECT_URL: 'https://direct.topcoder-dev.com',
            REVIEW_UI_URL: 'https://review.topcoder-dev.com',
        },
        API: {
            V5: 'https://api.topcoder-dev.com/v5',
            V6: 'https://api.topcoder-dev.com/v6',
        },
        CHALLENGE_API_URL: 'https://api.topcoder-dev.com/v5/challenges',
        CHALLENGE_API_VERSION: 'v5',
        COMMUNITY_APP_URL: 'https://topcoder-dev.com',
        DIRECT_PROJECT_URL: 'https://direct.topcoder-dev.com',
        ENGAGEMENTS_URL: 'https://work.topcoder-dev.com',
        REVIEW_APP_URL: 'https://review.topcoder-dev.com',
        TC_DOMAIN: 'topcoder-dev.com',
        TC_FINANCE_API: 'https://finance.topcoder-dev.com',
        TOPCODER_URL: 'https://topcoder-dev.com',
    },
}), {
    virtual: true,
})

describe('createProjectEditorSchema', () => {
    it('allows project creation without a billing account', async () => {
        const schema = createProjectEditorSchema(false, true)
        const values: ProjectEditorSchemaData = {
            billingAccountId: '',
            description: 'Create work before billing is assigned',
            groups: [],
            name: 'Project without billing',
            status: PROJECT_STATUS.DRAFT,
            terms: '',
            type: 'generic',
        }

        await expect(schema.validate(values, {
            abortEarly: false,
        })).resolves.toMatchObject({
            billingAccountId: '',
            name: 'Project without billing',
        })
    })
})
