/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable max-len */
/* eslint-disable sort-keys */
import { ethereumCommunityImage, ibmCommunityImage, veteransCommunityImage } from '~/apps/accounts/src/lib'

export const communitiesConfig = [
    {
        id: 'blockchain',
        icon: ethereumCommunityImage,
        programID: 20000010,
        name: 'Topcoder Blockchain Community',
        description: 'Meet like-minded peers from around the world, share tips and insights, and collaborate with customers to build cutting-edge solutions. The Topcoder Blockchain Community provides opportunities to learn from Ethereum experts and work with top companies that are embracing blockchain technology.',
        link: 'https://blockchain.topcoder.com/',
    },
    {
        id: 'cognitive',
        icon: ibmCommunityImage,
        programID: 3449,
        name: 'Topcoder Cognitive Community',
        description: 'By becoming a member of the Topcoder Community and registering for this specialized community, you can compete in fun cognitive challenges, access educational resources, and win money by solving real-life business problems for companies in need of cognitive expertise. ',
        link: 'https://cognitive.topcoder.com/',
    },
    {
        id: 'veteran',
        icon: veteransCommunityImage,
        programID: 3450,
        name: 'Topcoder Veterans Community',
        description: 'We help military service members and veterans transition to a career in technology with the world\'s premier crowdsourcing platform.',
        link: 'https://veterans.topcoder.com/',
    },
]
