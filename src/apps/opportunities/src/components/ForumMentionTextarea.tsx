/* eslint-disable react/jsx-no-bind */
import { FC, KeyboardEvent, RefObject, useEffect, useState } from 'react'

import { MemberProfileSummary } from '../models'
import { searchForumMentionMembers } from '../services'
import { forumMentionQuery } from '../utils/forum-mention.utils'

import styles from './ForumMentionTextarea.module.scss'

interface Props {
    id: string
    maxLength: number
    onChange: (value: string) => void
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
    placeholder: string
    textareaRef: RefObject<HTMLTextAreaElement>
    value: string
}

/**
 * Forum textarea with debounced handle search and keyboard/mouse mention insertion.
 * @param props controlled Markdown, character limit, textarea ref, and fallback key handler.
 * @returns editor and accessible suggestion list; selecting a member inserts @"handle".
 * @throws Does not throw; request errors are shown as a search hint.
 */
export const ForumMentionTextarea: FC<Props> = props => {
    const [query, setQuery] = useState<ReturnType<typeof forumMentionQuery>>()
    const [members, setMembers] = useState<MemberProfileSummary[]>([])
    const [selected, setSelected] = useState(0)
    const [message, setMessage] = useState('Type a handle to search.')

    useEffect(() => {
        let active = true
        setMembers([])
        setSelected(0)
        setMessage(query?.term ? 'Searching members…' : 'Type a handle to search.')
        const timer = window.setTimeout(() => {
            if (!query?.term) return
            searchForumMentionMembers(query.term)
                .then(results => {
                    if (!active) return
                    setMembers(results)
                    setMessage(results.length ? '' : 'No matching members.')
                })
                .catch(() => {
                    if (active) setMessage('Member search unavailable. Continue typing to retry.')
                })
        }, 200)
        return () => {
            active = false
            window.clearTimeout(timer)
        }
    }, [query?.term])

    /**
     * Refreshes autocomplete from the current caret, closing it for a selected range.
     * @param textarea active editor DOM element.
     * @returns Nothing; updates the current mention replacement range.
     * @throws Does not throw.
     */
    function updateQuery(textarea: HTMLTextAreaElement): void {
        setQuery(textarea.selectionStart === textarea.selectionEnd
            ? forumMentionQuery(textarea.value, textarea.selectionStart)
            : undefined)
    }

    /**
     * Inserts a chosen handle at the mention token, preserving text around the caret.
     * @param member selected autocomplete identity.
     * @returns Nothing; updates controlled text and restores focus/caret.
     * @throws Does not throw; oversized mentions leave the draft unchanged.
     */
    function insertMention(member: MemberProfileSummary): void {
        if (!query) return
        const caret = props.textareaRef.current?.selectionStart ?? props.value.length
        const insertion = `@"${member.handle}" `
        const value = `${props.value.slice(0, query.start)}${insertion}${props.value.slice(caret)}`
        if (value.length > props.maxLength) {
            setMessage('This mention exceeds the character limit.')
            return
        }

        props.onChange(value)
        setQuery(undefined)
        const nextCaret = query.start + insertion.length
        window.setTimeout(() => {
            props.textareaRef.current?.focus()
            props.textareaRef.current?.setSelectionRange(nextCaret, nextCaret)
        })
    }

    /**
     * Handles suggestion navigation before the editor's Markdown list continuation.
     * @param event textarea key event.
     * @returns Nothing; consumes arrows, Escape, Enter, and Tab when applicable.
     * @throws Does not throw.
     */
    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
        if (query && event.key === 'Escape') {
            event.preventDefault()
            setQuery(undefined)
            return
        }

        if (query && members.length && !event.nativeEvent.isComposing) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setSelected(index => (index + (event.key === 'ArrowDown' ? 1 : members.length - 1)) % members.length)
                return
            }

            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault()
                insertMention(members[selected])
                return
            }
        }

        props.onKeyDown(event)
    }

    return (
        <div className={styles.container}>
            <textarea
                aria-activedescendant={query && members.length ? `${props.id}-mention-${selected}` : undefined}
                aria-autocomplete='list'
                aria-controls={query ? `${props.id}-mentions` : undefined}
                id={props.id}
                maxLength={props.maxLength}
                onBlur={() => setQuery(undefined)}
                onChange={event => {
                    props.onChange(event.target.value)
                    updateQuery(event.target)
                }}
                onKeyDown={handleKeyDown}
                onSelect={event => updateQuery(event.currentTarget)}
                placeholder={props.placeholder}
                ref={props.textareaRef}
                value={props.value}
            />
            {query && (
                <div className={styles.suggestions}>
                    <ul aria-label='Mention a member' id={`${props.id}-mentions`} role='listbox'>
                        {members.map((member, index) => (
                            <li
                                aria-selected={selected === index}
                                id={`${props.id}-mention-${index}`}
                                key={member.userId}
                                onClick={() => insertMention(member)}
                                onMouseDown={event => event.preventDefault()}
                                role='option'
                            >
                                {member.handle}
                            </li>
                        ))}
                    </ul>
                    {message && <p role='status'>{message}</p>}
                </div>
            )}
        </div>
    )
}
