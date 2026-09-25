/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { searchForumMentionMembers } from '../services'

import { ForumMentionTextarea } from './ForumMentionTextarea'

jest.mock('../services', () => ({ searchForumMentionMembers: jest.fn() }))
const searchMembers = searchForumMentionMembers as jest.Mock

describe('forum mention autocomplete', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        searchMembers.mockReset()
        searchMembers.mockResolvedValue([{ handle: 'member.name', userId: '42' }])
    })
    afterEach(() => jest.useRealTimers())

    it('searches at the caret and inserts the chosen handle using Enter', async () => {
        const onChange = jest.fn()
        const onKeyDown = jest.fn()
        render(
            <ForumMentionTextarea
                id='comment'
                maxLength={500}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder='Comment'
                textareaRef={createRef<HTMLTextAreaElement>()}
                value='Hi @mem rest'
            />,
        )
        const textarea = screen.getByPlaceholderText('Comment') as HTMLTextAreaElement
        textarea.setSelectionRange(7, 7)
        fireEvent.select(textarea)
        await act(async () => { jest.advanceTimersByTime(200) })
        expect(searchMembers)
            .toHaveBeenCalledWith('mem')
        expect(screen.getByRole('option', { name: 'member.name' }))
            .toHaveAttribute('aria-selected', 'true')
        fireEvent.keyDown(textarea, { key: 'Enter' })
        expect(onChange)
            .toHaveBeenCalledWith('Hi @"member.name"  rest')
        expect(onKeyDown).not.toHaveBeenCalled()
    })

    it('opens on @ and closes on Escape without changing the draft', () => {
        const onChange = jest.fn()
        render(
            <ForumMentionTextarea
                id='comment'
                maxLength={500}
                onChange={onChange}
                onKeyDown={jest.fn()}
                placeholder='Comment'
                textareaRef={createRef<HTMLTextAreaElement>()}
                value='@'
            />,
        )
        const textarea = screen.getByPlaceholderText('Comment') as HTMLTextAreaElement
        textarea.setSelectionRange(1, 1)
        fireEvent.select(textarea)
        expect(screen.getByRole('listbox'))
            .toBeInTheDocument()
        fireEvent.keyDown(textarea, { key: 'Escape' })
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
        expect(onChange).not.toHaveBeenCalled()
    })
})
