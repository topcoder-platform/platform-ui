import type { LocalServiceOverride } from './global-config.model'

export * from './default.env'

export const LOCAL_SERVICE_OVERRIDES: LocalServiceOverride[] = [
    { prefix: '/v5/billing-accounts', target: 'http://localhost:3010' },
    { prefix: '/v6/billing-accounts', target: 'http://localhost:3010' },
    { prefix: '/v6/clients', target: 'http://localhost:3010' },
    { prefix: '/v6/clients', target: 'http://localhost:3010' },
    { prefix: '/v6/lookups', target: 'http://localhost:3007' },

    { prefix: '/v6/challenge-settings', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-tracks', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-phases', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-types', target: 'http://localhost:3000' },
    { prefix: '/v6/challenges', target: 'http://localhost:3000' },
    { prefix: '/v6/submissions', target: 'http://localhost:3005' },
    { prefix: '/v6/timeline-templates', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-settings', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-tracks', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-phases', target: 'http://localhost:3000' },
    { prefix: '/v6/challenge-types', target: 'http://localhost:3000' },
    { prefix: '/v6/challenges', target: 'http://localhost:3000' },

    { prefix: '/v5/groups', target: 'http://localhost:3001' },
    { prefix: '/v6/groups', target: 'http://localhost:3001' },

    { prefix: '/v6/users', target: 'http://localhost:3002' },
    { prefix: '/v6/roles', target: 'http://localhost:3002' },
    { prefix: '/v6/permissions', target: 'http://localhost:3002' },
    { prefix: '/v6/user-roles', target: 'http://localhost:3002' },
    { prefix: '/v6/identityproviders', target: 'http://localhost:3002' },

    { prefix: '/v6/members', target: 'http://localhost:3003' },

    { prefix: '/v6/resources', target: 'http://localhost:3004' },
    { prefix: '/v6/resource-roles', target: 'http://localhost:3004' },

    { prefix: '/v6/reviewSummations', target: 'http://localhost:3005' },
    { prefix: '/v6/reviewTypes', target: 'http://localhost:3005' },
    { prefix: '/v6/reviews', target: 'http://localhost:3005' },
    { prefix: '/v6/my-reviews', target: 'http://localhost:3005' },
    { prefix: '/v6/review-opportunities', target: 'http://localhost:3005' },
    { prefix: '/v6/review-applications', target: 'http://localhost:3005' },

    // Review app: route payments and appeals to local review API
    { prefix: '/v6/payments', target: 'http://localhost:3005' },
    { prefix: '/v6/appeals', target: 'http://localhost:3005' },
    { prefix: '/v6/scorecards', target: 'http://localhost:3005' },
    { prefix: '/v6/contact-requests', target: 'http://localhost:3005' },

    { prefix: '/v5/standardized-skills', target: 'http://localhost:3006' },
]
