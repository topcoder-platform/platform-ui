/* eslint-disable ordered-imports/ordered-imports */
import { createElement } from 'react'
import {
    extractTableOfContents,
    headingSlug,
    markdownHeadingText,
} from './ChallengeMarkdown'
import { paginationWindow } from './OpportunityPagination'
import { requiresExternalAgreement } from './ChallengeTermsModal'
import {
    engagementSkillNames,
    formatAnticipatedStart,
    formatEngagementDuration,
    reviewApplicationTotal,
} from './OpportunityListCard'
import { buildLegacyOpportunityRedirect } from '../pages/LegacyOpportunityRedirectPage'
import { parseSkillsFilter } from '../utils/opportunity-filter.utils'

jest.mock('react-markdown', () => () => undefined)
jest.mock('remark-breaks', () => jest.fn())
jest.mock('remark-gfm', () => jest.fn())
jest.mock('~/libs/cms', () => ({ getSafeCmsLink: jest.fn(value => value) }), { virtual: true })
jest.mock('~/libs/ui', () => ({ IconOutline: {} }), { virtual: true })
jest.mock('dompurify', () => ({ sanitize: jest.fn(value => value) }))
jest.mock('../services', () => ({ getChallengeSubmitterTermsDetails: jest.fn() }))

describe('opportunity presentation utilities', () => {
    it('creates stable Markdown table-of-contents fragments including duplicate headings', () => {
        const markdown = [
            '# Challenge',
            '## [Getting Started](https://topcoder.com)',
            'Body',
            '### Getting Started',
        ].join('\n')

        expect(extractTableOfContents(markdown))
            .toEqual([
                { id: 'getting-started-2', label: 'Getting Started', level: 2 },
                { id: 'getting-started-4', label: 'Getting Started', level: 3 },
            ])
        expect(headingSlug('API & UI Requirements!'))
            .toBe('api-ui-requirements')
        expect(headingSlug('<script>alert(1)</script>'))
            .toBe('script-alert-1-script')
        expect(markdownHeadingText([
            createElement('a', { key: 'link' }, 'Getting '),
            createElement('strong', { key: 'strong' }, 'Started'),
        ]))
            .toBe('Getting Started')
    })

    it('keeps short pagination complete and compacts large page ranges', () => {
        expect(paginationWindow(2, 4))
            .toEqual([1, 2, 3, 4])
        expect(paginationWindow(6, 12))
            .toEqual([1, 0, 5, 6, 7, 0, 12])
    })

    it('formats canonical engagement durations and anticipated-start enums', () => {
        expect(formatEngagementDuration({
            anticipatedStart: 'FEW_DAYS',
            durationWeeks: 8,
            id: 'engagement',
            title: 'Engineer',
        }))
            .toBe('8 weeks')
        expect(formatEngagementDuration({
            durationMonths: 1,
            id: 'engagement',
            title: 'Designer',
        }))
            .toBe('1 month')
        expect(formatAnticipatedStart('IMMEDIATE'))
            .toBe('Immediate')
        expect(formatAnticipatedStart('FEW_WEEKS'))
            .toBe('In a few weeks')
    })

    it('prefers hydrated Engagement skill names with a legacy ID fallback', () => {
        expect(engagementSkillNames({
            id: 'hydrated-engagement',
            requiredSkills: ['react-uuid', 'figma-uuid'],
            skills: [
                { id: 'react-uuid', name: 'React' },
                { id: 'react-duplicate', name: ' React ' },
                { id: 'blank-skill', name: '   ' },
                { id: 'figma-uuid', name: 'Figma' },
            ],
            title: 'Frontend Engineer',
        }))
            .toEqual(['React', 'Figma'])
        expect(engagementSkillNames({
            id: 'legacy-engagement',
            requiredSkills: ['react-uuid'],
            title: 'Legacy Engineer',
        }))
            .toEqual(['react-uuid'])
    })

    it('normalizes editable comma-separated skill facets', () => {
        expect(parseSkillsFilter(' React, Figma, React, , Python '))
            .toEqual(['React', 'Figma', 'Python'])
    })

    it('uses the public review application total instead of caller-visible rows', () => {
        expect(reviewApplicationTotal({
            applicationCount: 12,
            applications: [{ id: 'current-member-application' }],
            challengeId: 'challenge',
            id: 'opportunity',
        }))
            .toBe(12)
        expect(reviewApplicationTotal({
            applications: [{ id: 'legacy-application' }],
            challengeId: 'challenge',
            id: 'legacy-opportunity',
        }))
            .toBe(1)
    })

    it('preserves compatible query and hash values on legacy redirects', () => {
        expect(buildLegacyOpportunityRedirect(
            '/opportunities/challenge/challenge-id',
            '?tab=submissions',
            '#requirements',
        ))
            .toBe('/opportunities/challenge/challenge-id?tab=submissions#requirements')
    })

    it('blocks challenge registration for outstanding external agreements only', () => {
        expect(requiresExternalAgreement({
            agreeabilityType: 'DocuSign-template',
            agreed: false,
            id: 'nda',
        }))
            .toBe(true)
        expect(requiresExternalAgreement({
            agreed: false,
            docusignTemplateId: 'template',
            id: 'template-only-nda',
        }))
            .toBe(true)
        expect(requiresExternalAgreement({
            agreeabilityType: 'Electronically-agreeable',
            agreed: false,
            id: 'rules',
        }))
            .toBe(false)
        expect(requiresExternalAgreement({
            agreeabilityType: 'DocuSign-template',
            agreed: true,
            id: 'accepted-nda',
        }))
            .toBe(false)
    })
})
