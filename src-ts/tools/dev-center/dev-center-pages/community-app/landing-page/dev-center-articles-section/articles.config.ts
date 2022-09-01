import { EnvironmentConfig } from '../../../../../../config'

import { ArticleEntry, ArticleType, BlogPost } from './models'

/**
 * This array defiens which thirive articles and blog pasts should be shown.
 * The  first element in the array will be the main article.
 * For Thrive Articles, the url should be the Contentful ID.
 * For Blog Posts, the url is the url linking to the post on topcoder.com
 * Example
 * {
 *   type: ArticleType.Blog,
 *   url: `${EnvironmentConfig.TOPCODER_URLS.BLOG_PAGE}/talent-as-a-service-taas-a-brilliant-solution-to-the-talent-gap/`,
 * }
 * {
 *   type: ArticleType.Thrive,
 *   url: '6KP9iCELCsLWTSWirplWs2',
 * }
 */
export const ArticlesUrl: Array<ArticleEntry> = [
    {
        type: ArticleType.Thrive,
        url: '6KP9iCELCsLWTSWirplWs2',
    },
    {
        type: ArticleType.Thrive,
        url: '1afUuuZVt1JI14iRkAIqba',
    },
    {
        type: ArticleType.Thrive,
        url: 'puRqAymWv7hjjyHyunGK2',
    },
    {
        type: ArticleType.Thrive,
        url: '6yZJ8xSYTEqVJhMeQyA7BA',
    },
    {
        type: ArticleType.Thrive,
        url: '3QOvaHaSxjF26owDurtfKZ',
    },
]

/**
 * This array contains the default blog posts to be shown if the ones specified above are not available.
 */
export const defaultBlogs: Array<BlogPost> = [
    {
        contentSnippet: 'In light of the incredible speed of innovation, specialized tech talent has never been more critical to business success. Yet access to that talent remains frustratingly difficult for many companies. According to the Society for Human Resources Management, 83% of businesses are having trouble recruiting suitable candidates for their open positions, particularly when it comes […]\nThe post Talent as a Service (TaaS): A Brilliant Solution to the Talent Gap appeared first on Topcoder.',
        creator: 'Kiran Hampapura',
        featuredImage: `${EnvironmentConfig.TOPCODER_URLS.WP_CONTENT}/uploads/2019/11/taashero.jpg`,
        link: `${EnvironmentConfig.TOPCODER_URLS.BLOG_PAGE}/talent-as-a-service-taas-a-brilliant-solution-to-the-talent-gap/`,
        title: 'Talent as a Service (TaaS): A Brilliant Solution to the Talent Gap',
    },
    {
        contentSnippet: 'Can our Topcoder accounts be hacked? Can our well-earned cash be stolen away through the platform? Can customers suffer from intellectual theft? These sensitive questions belong to a discussion on a beyond-interesting topic: security. Honoring Topcoder’s security themed month, we want to raise awareness on what cyber security means for members and customers. We turned […]\nThe post Securing A Safe Work System For Members And Customers With John Wheeler - The Topcoder Nation Show #18 appeared first on Topcoder.',
        creator: 'mahestro',
        featuredImage: `${EnvironmentConfig.TOPCODER_URLS.WP_CONTENT}/uploads/2022/07/00-tcn-show-18-john-wheeler.png`,
        link: `${EnvironmentConfig.TOPCODER_URLS.BLOG_PAGE}/securing-a-safe-work-system-for-members-and-customers-with-john-wheeler-the-topcoder-nation-show-18/`,
        title: 'Securing A Safe Work System For Members And Customers With John Wheeler – The Topcoder Nation Show #18',
    },
    {
        contentSnippet: 'Job opportunities, upskilling, and mentoring are traits that identify the endeavor that this young gentleman is leading in Africa. Meet Abiodun (), born and raised in Lagos; he aims to close the gap between the tech talent in his region and opportunities, leveraging Topcoder as a medium to make it happen. Abiodun loves live music […]\nThe post Building A Tech Community In Africa With Code_Abbey – The Topcoder Nation Show #17 appeared first on Topcoder.',
        creator: 'mahestro',
        featuredImage: `${EnvironmentConfig.TOPCODER_URLS.WP_CONTENT}/uploads/2022/06/00-tcn-show-17-code_abby-and-gigs-in-africa.png`,
        link: `${EnvironmentConfig.TOPCODER_URLS.BLOG_PAGE}/building-a-tech-community-in-africa-with-code_abbey-the-topcoder-nation-show-17/`,
        title: 'Building A Tech Community In Africa With Code_Abbey – The Topcoder Nation Show #17',
    },
    {
        contentSnippet: 'CellPhoneService We just need to do the calculations described in the statement. One part of the calculations that may be tricky for beginners is the fee per each started minute of a call. If we have a call that takes S seconds, the number of minutes we’ll paying for can be computed by dividing S […]\nThe post Single Round Match 833 Editorials appeared first on Topcoder.',
        creator: 'misof',
        featuredImage: `${EnvironmentConfig.TOPCODER_URLS.WP_CONTENT}/uploads/2017/04/SRM_Blog.png`,
        link: `${EnvironmentConfig.TOPCODER_URLS.BLOG_PAGE}/single-round-match-833-editorials/`,
        title: 'Single Round Match 833 Editorials',
    },
    {
        contentSnippet: 'TwoDimensionalSort Imagine that we label rows of the board A to Z from top to bottom. If we got each rook X into its row X, the board would surely be sorted. With N rooks we can always achieve that in at most 2*N moves. In the first N moves we’ll move some rooks horizontally […]\nThe post TCO22 Round 3 Editorial appeared first on Topcoder.',
        creator: 'misof',
        featuredImage: `${EnvironmentConfig.TOPCODER_URLS.WP_CONTENT}/uploads/2017/04/SRM_Blog.png`,
        link: `${EnvironmentConfig.TOPCODER_URLS.BLOG_PAGE}/tco22-round-3-editorial/`,
        title: 'TCO22 Round 3 Editorial',
    },
]
