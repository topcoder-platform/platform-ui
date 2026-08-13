/* eslint-disable react/jsx-no-bind */

import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import styles from '../Blog.module.scss'

interface BlogPaginationProps {
    page: number
    totalPages: number
}

/**
 * Renders first, previous, next, last, and direct-page controls from community-app Blog.
 *
 * @param props current one-based page and available page count.
 * @returns Blog pagination navigation.
 * @throws Does not throw; invalid direct-page values are ignored.
 */
export const BlogPagination: FC<BlogPaginationProps> = (props: BlogPaginationProps) => {
    const navigate = useNavigate()
    const [input, setInput] = useState('')
    /**
     * Builds the canonical URL for one Blog page.
     *
     * @param page one-based page number.
     * @returns the root route for page one or an explicit pagination route.
     * @throws Does not throw.
     */
    const route = (page: number): string => (page === 1 ? '/blog' : `/blog/page/${page}`)

    /**
     * Navigates to a valid direct-page input.
     *
     * @param event browser form event to prevent from reloading the application.
     * @returns nothing after navigation or validation.
     * @throws Does not throw.
     */
    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault()
        const page = Number(input)
        if (Number.isInteger(page) && page >= 1 && page <= props.totalPages) {
            navigate(route(page))
        }
    }

    return (
        <nav aria-label='Blog pagination' className={styles.pagination}>
            <div className={styles.paginationLinks}>
                <Link aria-disabled={props.page === 1} to={route(1)}>«</Link>
                <Link aria-disabled={props.page === 1} to={route(Math.max(1, props.page - 1))}>‹</Link>
                <span>
                    Page
                    {props.page}
                    {' '}
                    of
                    {props.totalPages}
                </span>
                <Link
                    aria-disabled={props.page === props.totalPages}
                    to={route(Math.min(props.totalPages, props.page + 1))}
                >
                    ›
                </Link>
                <Link aria-disabled={props.page === props.totalPages} to={route(props.totalPages)}>»</Link>
            </div>
            <form onSubmit={submit}>
                <label htmlFor='blog-page-number'>Go to Page</label>
                <input
                    id='blog-page-number'
                    inputMode='numeric'
                    onChange={event => setInput(event.target.value)}
                    value={input}
                />
                <button disabled={props.totalPages === 1} type='submit'>Go</button>
            </form>
        </nav>
    )
}
