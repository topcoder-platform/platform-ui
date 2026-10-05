/**
 * Universities listed on the campus homepage.
 *
 * Names and logos mirror the university landing pages in the Payload CMS `website` space
 * (`/universities/*`, `/lpu`, `/brown-university`); group ids come from each page's join group modal.
 */

export interface CampusUniversity {
    /** Campus group the leaderboard is built for (name, id or legacy id are all accepted). */
    groupId: string
    groupName: string
    logoUrl?: string
    name: string
}

export const CAMPUS_UNIVERSITIES: ReadonlyArray<CampusUniversity> = [
    {
        groupId: '41b00495-659d-4610-ba8e-62543d6c8168',
        groupName: 'mecw',
        logoUrl: 'https://assets.topcoder-dev.com/media/contentful/images.ctfassets.net/'
            + '96/96c272a3d61609101d2aec2bad4dd3e397bd3202d7454eb410c3824d0f18badf/'
            + 'Logo_lockup__1_-96c272a3d61609101d2aec2bad4dd3e397bd3202d7454eb410c3824d0f18badf.svg',
        name: 'Mahendra Engineering College for Women',
    },
    {
        groupId: '0f241463-8f48-4248-85a1-ba0fae4ac226',
        groupName: 'mahendra',
        logoUrl: 'https://assets.topcoder-dev.com/media/mahendra%20-%20logos.svg',
        name: 'Mahendra Institutions',
    },
    {
        groupId: '9ff2c7f8-8f77-47a7-96ed-891baf2ebd0c',
        groupName: 'skct',
        logoUrl: 'https://assets.topcoder-dev.com/media/skct%20-%20logos.svg',
        name: 'Sri Krishna College of Technology',
    },
    {
        groupId: 'a4a6e38e-a14f-44b1-8036-9dbcd713ad77',
        groupName: 'skcet',
        logoUrl: 'https://assets.topcoder-dev.com/media/skcet%20-%20logos.svg',
        name: 'Sri Krishna College of Engineering And Technology',
    },
    {
        groupId: '582ba94b-0787-43b2-89a4-afd0a7b4eb31',
        groupName: 'sathyabama',
        logoUrl: 'https://assets.topcoder-dev.com/media/sathyabama%20-%20logos.svg',
        name: 'Sathyabama Institute of Science And Technology',
    },
    {
        groupId: 'f224c94d-85c8-4b36-be25-3d7d4caf0ffd',
        groupName: 'lnctbhopal',
        logoUrl: 'https://assets.topcoder-dev.com/media/lnct%20-%20logos.svg',
        name: 'Lakshmi Narain College of Technology',
    },
    {
        groupId: 'f3518838-62b7-408f-a269-c439f6ef96d1',
        groupName: 'kluniversity',
        logoUrl: 'https://assets.topcoder-dev.com/media/kl%20-%20logos.svg',
        name: 'K L University',
    },
    {
        groupId: 'da3a64f6-4478-47dc-b051-75d33a0ac759',
        groupName: 'lpu',
        logoUrl: 'https://assets.topcoder-dev.com/media/contentful/images.ctfassets.net/6e/'
            + '6e12c8c6d43382a9bd4b17104c0124452ec6b734d46cc6c4e4004224b0823476/'
            + 'image_1-6e12c8c6d43382a9bd4b17104c0124452ec6b734d46cc6c4e4004224b0823476.svg',
        name: 'LPU',
    },
    {
        groupId: '8e071d83-d2a5-49c2-8e3f-fa2a42881168',
        groupName: 'brown-university',
        name: 'Brown University',
    },
]
