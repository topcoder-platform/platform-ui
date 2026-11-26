import { PAYLOAD_ASSET_ORIGIN } from '~/libs/cms'

import { ThriveTrack } from '../models'

/** Root route for the Payload-backed Thrive application. */
export const THRIVE_ROOT_ROUTE = '/thrive'

/** Content types displayed in the tabbed Thrive results view. */
export const THRIVE_CONTENT_TYPES = ['Article', 'Video', 'Forum post'] as const

/** Retained source identifier of the curated EDU track taxonomy root. */
export const THRIVE_TAXONOMY_ROOT_ID = '15caxocitaxyK65K9oSd91'

/** Relationship keys authored on the curated EDU track taxonomy root. */
export const THRIVE_TAXONOMY_TRACK_KEYS = [
    'dataScience',
    'competitiveProgramming',
    'design',
    'development',
    'qualityAssurance',
    'topcoder',
    'gigWork',
] as const

/** Compact field projection used by track cards to avoid downloading full article bodies. */
export const THRIVE_CARD_SELECT = [
    'sys.id',
    'sys.type',
    'sys.createdAt',
    'fields.commentsCount',
    'fields.avatar',
    'fields.contentAuthor',
    'fields.contentUrl',
    'fields.creationDate',
    'fields.externalArticle',
    'fields.featuredImage',
    'fields.name',
    'fields.readTime',
    'fields.slug',
    'fields.tags',
    'fields.tcHandle',
    'fields.title',
    'fields.type',
    'fields.upvotes',
    'fields.file',
].join(',')

/** Legacy Thrive tracks in the same order and palette as community-app. */
export const THRIVE_TRACKS: ThriveTrack[] = [
    {
        accent: '#fdbd18',
        banner: '#ffa45d',
        icon: '</>',
        name: 'Competitive Programming',
    },
    {
        accent: '#f46500',
        banner: '#ffa45d',
        icon: '∿',
        name: 'Data Science',
    },
    {
        accent: '#137d60',
        banner: '#50ade8',
        icon: '◆',
        name: 'Design',
    },
    {
        accent: '#26b3c5',
        banner: '#8afb8a',
        icon: '{ }',
        name: 'Development',
    },
    {
        accent: '#0ab88a',
        banner: '#8afb8a',
        icon: '✓',
        name: 'QA',
    },
    {
        accent: '#ef476f',
        banner: '#ef476f',
        icon: '●',
        name: 'Gig Work',
    },
    {
        accent: '#8231a9',
        banner: '#2a2a2a',
        icon: 'TC',
        name: 'Topcoder',
    },
]

/** Default migrated Thrive banner used when an article has no featured image. */
export const THRIVE_DEFAULT_BANNER = `${PAYLOAD_ASSET_ORIGIN}/media/contentful/`
    + 'images.ctfassets.net/97/970c80d628d90c49e1a8817954d5ef8ddcffdf1b0a0e2cdb74a2decd7cabe8ee/'
    + '0C37CB5E-B253-4804-8935-78E64E67589E-970c80d628d90c49e1a8817954d5ef8ddcffdf1b0a0e2cdb74a2decd7cabe8ee.png'

/** Rectangular Thrive artwork for cards without a featured image. */
export const THRIVE_DEFAULT_CARD_IMAGE = `${PAYLOAD_ASSET_ORIGIN}/media/contentful/`
    + 'images.ctfassets.net/c7/c7062f58c497b7d7819b3ea43fbf63807cdce5bf30eadef8f948ba79d227c0c1/'
    + 'Banner_Thrive-c7062f58c497b7d7819b3ea43fbf63807cdce5bf30eadef8f948ba79d227c0c1.png'
