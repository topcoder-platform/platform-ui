/** @jest-environment node */
/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { compile, compileString, Logger } from 'sass'

// Use the test runner's existing jsdom without adding a separate type dependency.
const { JSDOM }: { JSDOM: new (html: string) => { window: Window } } = jest.requireActual('jsdom')

const uiStylesPath = resolve(__dirname, '../../../../../../libs/ui/lib/styles')
const ratingStylesPath = resolve(__dirname, 'MemberRatingCard.module.scss')

describe('MemberRatingCard tooltip visibility', () => {
    it('only shows the positioned tooltip on the first and subsequent hovers', () => {
        const sharedStyles = compile(resolve(uiStylesPath, '../components/tooltip/Tooltip.module.scss'), {
            logger: Logger.silent,
        }).css
        const ratingStyles = compileString(
            readFileSync(ratingStylesPath, 'utf8')
                .replace('@libs/ui/styles/includes', `${uiStylesPath}/includes`),
            { logger: Logger.silent, url: pathToFileURL(ratingStylesPath) },
        ).css.replace(/:global\(([^)]+)\)/g, '$1')
        const dom = new JSDOM(`
            <style>${sharedStyles}${ratingStyles}</style>
            <div class="tooltip ratingTooltip react-tooltip__closing">Top 56% of 2M data scientists</div>
        `)
        const tooltip = dom.window.document.querySelector('div') as HTMLDivElement

        try {
            // react-tooltip mounts in its closing state before calculating a position.
            expect(dom.window.getComputedStyle(tooltip).opacity)
                .toBe('0')

            for (let hover = 0; hover < 3; hover += 1) {
                tooltip.classList.replace('react-tooltip__closing', 'react-tooltip__show')
                expect(dom.window.getComputedStyle(tooltip).opacity)
                    .toBe('1')

                tooltip.classList.replace('react-tooltip__show', 'react-tooltip__closing')
                expect(dom.window.getComputedStyle(tooltip).opacity)
                    .toBe('0')
            }
        } finally {
            dom.window.close()
        }
    })
})
