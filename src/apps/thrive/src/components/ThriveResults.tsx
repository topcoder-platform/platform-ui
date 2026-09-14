/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */

import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'

import type { CmsResource } from '~/libs/cms'
import { useCmsCollection } from '~/libs/cms'

import { THRIVE_CONTENT_TYPES } from '../config'
import type {
    ThriveArticleFields,
    ThriveCategoryFields,
    ThriveContentType,
    ThriveFilters,
    ThrivePersonFields,
} from '../models'
import { buildThriveContentQuery } from '../utils'
import { ThriveArticleCard } from './ThriveArticleCard'
import styles from '../Thrive.module.scss'

interface ThriveResultsProps {
    categories: Array<CmsResource<ThriveCategoryFields>>
    filters: ThriveFilters
}

/**
 * Loads only the selected Thrive result tab and refreshes it whenever route filters change.
 *
 * @param props normalized filters plus the resolved taxonomy needed for category IDs.
 * @returns tabbed article, video, and forum-post results with incremental pagination.
 * @throws Does not throw; Payload errors are shown inline.
 */
export const ThriveResults: FC<ThriveResultsProps> = (props: ThriveResultsProps) => {
    const [activeType, setActiveType] = useState<ThriveContentType>('Article')
    const [limit, setLimit] = useState(5)
    const authorQuery = useMemo(() => ({
        content_type: 'person',
        limit: 1,
        query: props.filters.author,
    }), [props.filters.author])
    const authors = useCmsCollection<ThrivePersonFields>('edu', authorQuery, Boolean(props.filters.author))
    const authorId = props.filters.author
        ? authors.data?.items[0]?.sys.id || (authors.loading ? undefined : 'NO_SUCH_ID')
        : undefined
    const contentQuery = useMemo(() => buildThriveContentQuery(
        activeType,
        props.filters,
        props.categories,
        authorId,
        limit,
        0,
    ), [activeType, authorId, limit, props.categories, props.filters])
    const content = useCmsCollection<ThriveArticleFields>(
        'edu',
        contentQuery,
        !props.filters.author || Boolean(authorId),
    )

    useEffect(() => {
        setLimit(5)
    }, [activeType, props.filters])

    return (
        <section className={styles.results}>
            <div aria-label='Thrive content types' className={styles.tabs} role='tablist'>
                {THRIVE_CONTENT_TYPES.map(type => (
                    <button
                        aria-selected={activeType === type}
                        className={activeType === type ? styles.activeTab : undefined}
                        key={type}
                        onClick={() => setActiveType(type)}
                        role='tab'
                        type='button'
                    >
                        {type === 'Forum post' ? 'Forum posts' : `${type}s`}
                        {activeType === type && content.data && <span>{content.data.total}</span>}
                    </button>
                ))}
            </div>
            {content.loading && (
                <div className={styles.loading}>
                    Loading
                    {activeType.toLowerCase()}
                    s…
                </div>
            )}
            {content.error && <div className={styles.error}>{content.error.message}</div>}
            {!content.loading && !content.error && !content.data?.items.length && (
                <div className={styles.empty}>No results found</div>
            )}
            <div className={activeType === 'Video' ? styles.videoGrid : styles.resultList}>
                {content.data?.items.map(article => (
                    <ThriveArticleCard article={article} key={article.sys.id} />
                ))}
            </div>
            {content.data && content.data.items.length < content.data.total && (
                <button className={styles.loadMore} onClick={() => setLimit(value => value + 5)} type='button'>
                    Show More
                </button>
            )}
        </section>
    )
}
