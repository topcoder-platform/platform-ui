/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'

import { fireEvent, render, RenderResult, screen } from '@testing-library/react'

import { OpportunitySortSelect } from './OpportunitySortSelect'

const options = [
    { label: 'Newest first', value: 'newest' },
    { label: 'Starting soon', value: 'startingSoon' },
]
const sortStyles = readFileSync(`${__dirname}/OpportunitySortSelect.module.scss`, 'utf8')

describe('OpportunitySortSelect', () => {
    it('renders authored options and selects one by pointer', () => {
        const onChange = jest.fn()
        render(<OpportunitySortSelect onChange={onChange} options={options} value='newest' />)

        fireEvent.click(screen.getByRole('combobox', { name: 'Sort opportunities' }))

        expect(screen.getAllByRole('option'))
            .toHaveLength(2)
        fireEvent.click(screen.getByRole('option', { name: 'Starting soon' }))
        expect(onChange)
            .toHaveBeenCalledWith('startingSoon')
        expect(screen.queryByRole('listbox'))
            .not.toBeInTheDocument()
    })

    it('reserves the longest option width and keeps the chevron 4px from the text', () => {
        const { container }: RenderResult = render(
            <OpportunitySortSelect onChange={jest.fn()} options={options} value='newest' />,
        )

        const sizer = container.querySelector('.labelSizer') as HTMLElement
        expect(sizer)
            .toHaveAttribute('aria-hidden', 'true')
        expect(Array.from(sizer.children)
            .map(child => child.textContent))
            .toEqual(['Newest first', 'Starting soon'])

        const controlBlock = (sortStyles.match(/\.control\s*\{[\s\S]*?\n\}/) ?? [''])[0]
        expect(controlBlock)
            .toContain('gap: 4px')
        expect(sortStyles)
            .not.toContain('gap: 2px')
    })

    it('supports arrow, Enter, and Escape keyboard interaction', () => {
        const onChange = jest.fn()
        render(<OpportunitySortSelect onChange={onChange} options={options} value='newest' />)
        const control = screen.getByRole('combobox', { name: 'Sort opportunities' })

        fireEvent.keyDown(control, { key: 'ArrowDown' })
        fireEvent.keyDown(control, { key: 'Enter' })
        expect(onChange)
            .toHaveBeenCalledWith('startingSoon')

        fireEvent.click(control)
        fireEvent.keyDown(control, { key: 'Escape' })
        expect(screen.queryByRole('listbox'))
            .not.toBeInTheDocument()
    })
})
