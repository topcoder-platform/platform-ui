import { FILESTACK as DefaultFileStack } from './default.env'
import { getReactEnv } from './react-env'

export * from './default.env'

export const TERMS_URL = 'https://www.topcoder.com/challenges/terms/detail/564a981e-6840-4a5c-894e-d5ad22e9cd6f'

export const VANILLA_FORUM = {
    V2_URL: 'https://vanilla.topcoder.com/api/v2',
}

export const ADMIN = {
    AGREE_ELECTRONICALLY: '2db6c920-4089-4755-9cd1-99b0df0af961',
    AGREE_FOR_DOCUSIGN_TEMPLATE: '1363a7ab-fd3e-4d7c-abbb-2f7440b8b355',
    AV_SCAN_SCORER_REVIEW_TYPE_ID: '55bbb17d-aac2-45a6-89c3-a8d102863d05',
    AVSCAN_TOPIC: 'avscan.action.scan',
    AWS_CLEAN_BUCKET: 'topcoder-submissions',
    AWS_DMZ_BUCKET: 'topcoder-submissions-dmz',
    AWS_QUARANTINE_BUCKET: 'topcoder-submissions-quarantine',
    AWS_REGION: 'us-east-1',
    CHALLENGE_URL: 'https://www.topcoder.com/challenges',
    CONNECT_URL: 'https://connect.topcoder.com',
    DEFAULT_PAYMENT_TERMS: 1,
    DIRECT_URL: 'https://www.topcoder.com/direct',
    ONLINE_REVIEW_URL: 'https://software.topcoder.com/review',
    REVIEW_UI_URL: 'https://review.topcoder.com',
    SUBMISSION_SCAN_TOPIC: 'submission.scan.complete',
    WORK_MANAGER_URL: 'https://challenges.topcoder.com',
}

export const REVIEW = {
    CHALLENGE_PAGE_URL: 'https://www.topcoder.com/challenges',
    OPPORTUNITIES_URL: 'https://www.topcoder.com/challenges/?bucket=reviewOpportunities&'
        + 'tracks[DS]=true&tracks[Des]=true&tracks[Dev]=true&tracks[QA]=true',
    PROFILE_PAGE_URL: 'https://profiles.topcoder.com',
}

export const FILESTACK = {
    ...DefaultFileStack,
    CNAME: getReactEnv<string>('FILESTACK_CNAME', 'fs.topcoder.com'),
    CONTAINER: getReactEnv<string>('FILESTACK_CONTAINER', 'topcoder-submissions'),
    PATH_PREFIX: getReactEnv<string>('FILESTACK_PATH_PREFIX', 'review-app'),
}
