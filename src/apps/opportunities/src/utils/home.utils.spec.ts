import type { ChallengeOpportunity } from '../models'

import {
    collectHomeCmsBlocks,
    filterHomeChallenges,
    formatTopcoderTime,
    getHomeViewportIds,
    stripCmsStyleElements,
} from './home.utils'

/**
 * Builds an embedded CMS entry in the Payload compatibility response shape.
 *
 * @param id entry ID.
 * @param contentType content type ID.
 * @param fields entry fields.
 * @returns a resolved CMS entry.
 */
function entry(id: string, contentType: string, fields: Record<string, unknown>): Record<string, unknown> {
    return {
        fields,
        sys: {
            contentType: { sys: { id: contentType, linkType: 'ContentType', type: 'Link' } },
            id,
            type: 'Entry',
        },
    }
}

/**
 * Builds a minimal Challenge API list item.
 *
 * @param id challenge ID.
 * @param tags authored challenge tags.
 * @returns challenge list item.
 */
function challenge(id: string, tags?: string[]): ChallengeOpportunity {
    return { id, name: `Challenge ${id}`, tags }
}

describe('member home utils', () => {
    it('selects the community-app dev viewports on -dev domains and production entries elsewhere', () => {
        expect(getHomeViewportIds('topcoder-dev.com'))
            .toEqual({
                centerTop: 'IYMEHgYwk6S0S9tx5SsHd',
                leftBottom: '2tq6jtu9GzPab7lAb7swlT',
                rightBottom: '2qVJTorSdRVNlfRqoQocUH',
            })
        expect(getHomeViewportIds('topcoder.com'))
            .toEqual({
                centerTop: '1BK50OyMT29IOavUC7wSEB',
                leftBottom: '6sjlJHboX3aG3mFS5FnZND',
                rightBottom: 'SSwOFPT8l0WpGhqCBRISG',
            })
        expect(getHomeViewportIds('topcoder-qa.com').centerTop)
            .toBe('1BK50OyMT29IOavUC7wSEB')
    })

    it('drops Innovation Challenges and keeps the first five remaining challenges in API order', () => {
        const challenges = [
            challenge('1', ['Innovation Challenge']),
            challenge('2'),
            challenge('3', ['AI']),
            challenge('4', ['innovation challenge']),
            challenge('5', ['Design', 'Innovation Challenge']),
            challenge('6'),
            challenge('7'),
            challenge('8'),
            challenge('9'),
        ]

        expect(filterHomeChallenges(challenges)
            .map(item => item.id))
            .toEqual(['2', '3', '4', '6', '7'])
        expect(filterHomeChallenges(challenges, ['AI'], 2)
            .map(item => item.id))
            .toEqual(['1', '2'])
        expect(filterHomeChallenges(challenges, [], -1))
            .toEqual([])
    })

    it('formats Topcoder Time in US Eastern time with its daylight-saving UTC offset', () => {
        expect(formatTopcoderTime(new Date('2026-10-08T11:31:45.999Z')))
            .toBe('Oct 8th, 07:31 UTC-4')
        expect(formatTopcoderTime(new Date('2026-01-02T04:05:00Z')))
            .toBe('Jan 1st, 23:05 UTC-5')
        expect(formatTopcoderTime(new Date('2026-11-01T05:59:59Z')))
            .toBe('Nov 1st, 01:59 UTC-4')
        expect(formatTopcoderTime(new Date('2026-11-01T06:00:00Z')))
            .toBe('Nov 1st, 01:00 UTC-5')
        expect(formatTopcoderTime(new Date('2026-12-23T23:59:00Z')))
            .toBe('Dec 23rd, 18:59 UTC-5')
        expect(formatTopcoderTime(new Date('2026-04-12T16:00:00Z')))
            .toBe('Apr 12th, 12:00 UTC-4')
        expect(formatTopcoderTime(new Date('2026-05-22T04:00:00Z')))
            .toBe('May 22nd, 00:00 UTC-4')
    })

    it('removes authored style elements without touching the remaining markup', () => {
        expect(stripCmsStyleElements(
            '<a href="https://discord.gg/topcoder">Join</a>\n\n<style>\n  #x { color: red; }\n</style><STYLE/>',
        ))
            .toBe('<a href="https://discord.gg/topcoder">Join</a>\n\n')
    })

    it('flattens the retained dashboard viewport into Markdown and slider blocks', () => {
        const styleOnly = entry('styles', 'contentBlock', {
            extraStylesForContainer: { display: 'none' },
            text: '<style>.slider img{width:100%}</style>',
        })
        const slider = entry('slider', 'contentSlider', {
            autoStart: true,
            items: [
                entry('slide-1', 'contentBlock', {
                    text: '<a href="https://www.topcoder-dev.com/challenges">'
                        + '<img src="//assets.topcoder-dev.com/a.png" /></a>',
                }),
                entry('slide-empty', 'contentBlock', { text: '<style>p{}</style>' }),
                { sys: { id: 'missing', linkType: 'Entry', type: 'Link' } },
                entry('slide-2', 'contentBlock', { text: '<a><img src="//assets.topcoder-dev.com/b.png" /></a>' }),
            ],
            theme: 'Default',
        })
        const viewport = entry('viewport', 'viewport', {
            content: [
                styleOnly,
                entry('wrapper', 'viewport', { content: [styleOnly, slider] }),
                entry('discord', 'contentBlock', {
                    text: '<a href="https://discord.gg/topcoder"><span>Join us on Discord</span></a>'
                        + '\n\n<style>a{}</style>',
                }),
                entry('empty-link', 'contentBlock', { baseTheme: 'TCO20' }),
                entry('video', 'video', { url: 'https://www.youtube.com/embed/x' }),
            ],
        })

        expect(collectHomeCmsBlocks(viewport))
            .toEqual([
                {
                    autoplay: true,
                    id: 'slider',
                    intervalMs: 5000,
                    kind: 'slider',
                    slides: [
                        {
                            id: 'slide-1',
                            kind: 'markdown',
                            text: '<a href="https://www.topcoder-dev.com/challenges">'
                                + '<img src="//assets.topcoder-dev.com/a.png" /></a>',
                        },
                        {
                            id: 'slide-2',
                            kind: 'markdown',
                            text: '<a><img src="//assets.topcoder-dev.com/b.png" /></a>',
                        },
                    ],
                },
                {
                    id: 'discord',
                    kind: 'markdown',
                    text: '<a href="https://discord.gg/topcoder"><span>Join us on Discord</span></a>',
                },
            ])
    })

    it('honors authored slider timing and skips empty sliders, cycles, and missing viewports', () => {
        const cyclicContent: unknown[] = []
        const cyclic = entry('cyclic', 'viewport', { content: cyclicContent })
        cyclicContent.push(cyclic, entry('block', 'contentBlock', { text: 'Hi' }))
        const manualSlider = entry('manual', 'contentSlider', {
            autoStart: false,
            duration: 8,
            items: [entry('only', 'contentBlock', { text: 'Only slide' })],
        })

        expect(collectHomeCmsBlocks(cyclic))
            .toEqual([{ id: 'block', kind: 'markdown', text: 'Hi' }])
        expect(collectHomeCmsBlocks(manualSlider))
            .toEqual([{
                autoplay: false,
                id: 'manual',
                intervalMs: 8000,
                kind: 'slider',
                slides: [{ id: 'only', kind: 'markdown', text: 'Only slide' }],
            }])
        expect(collectHomeCmsBlocks(entry('empty', 'contentSlider', { items: [] })))
            .toEqual([])
        expect(collectHomeCmsBlocks(undefined))
            .toEqual([])
        expect(collectHomeCmsBlocks({ sys: { id: 'asset', type: 'Asset' } }))
            .toEqual([])
    })
})
