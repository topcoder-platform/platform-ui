/* eslint-disable import/first, import/no-extraneous-dependencies */
/* eslint-disable ordered-imports/ordered-imports, react/function-component-definition */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('../MarkdownAccordion', () => (
    props: PropsWithChildren,
): JSX.Element => <>{props.children}</>)

jest.mock('../MarkdownCode', () => (
    props: PropsWithChildren,
): JSX.Element => <>{props.children}</>)

jest.mock('../MarkdownImages', () => (
    props: PropsWithChildren,
): JSX.Element => <>{props.children}</>)

jest.mock('../MarkdownLink', () => (
    props: PropsWithChildren,
): JSX.Element => <>{props.children}</>)

import { Renderer } from './renderer'

describe('Markdown renderer', () => {
    it('extracts the outer tag from multiline generated HTML', () => {
        render(
            <>
                {Renderer.getInstance()
                    .render('First line\nsecond line')}
            </>,
        )

        expect(screen.getByText(/First line/).tagName)
            .toBe('P')
        expect(screen.getByText(/First line/))
            .toHaveTextContent('First line second line')
    })

    it('handles long repeated text without ambiguous regular-expression matching', () => {
        const repeatedText: string = `${'n'.repeat(50_000)}!`

        render(
            <>
                {Renderer.getInstance()
                    .render(repeatedText)}
            </>,
        )

        expect(screen.getByText(repeatedText).tagName)
            .toBe('P')
    })
})
