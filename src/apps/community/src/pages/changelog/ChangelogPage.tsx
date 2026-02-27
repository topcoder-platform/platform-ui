/* eslint-disable ordered-imports/ordered-imports */
import { documentToHtmlString } from '@contentful/rich-text-html-renderer'
import {
    FC,
    useEffect,
    useMemo,
    useState,
} from 'react'
import DOMPurify from 'dompurify'

import {
    Breadcrumb,
    type BreadcrumbItemModel,
    LoadingSpinner,
} from '~/libs/ui'

import {
    changelogRouteId,
    rootRoute,
} from '../../config/routes.config'
import { fetchChangelogEntry } from '../../lib/services'

import styles from './ChangelogPage.module.scss'

interface ContentfulEntry {
    fields?: Record<string, unknown>
}

interface ContentfulRichTextDocument {
    content?: unknown[]
    nodeType?: string
}

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function isRichTextDocument(value: unknown): value is ContentfulRichTextDocument {
    if (!value || typeof value !== 'object') {
        return false
    }

    const document = value as ContentfulRichTextDocument

    return document.nodeType === 'document' && Array.isArray(document.content)
}

function resolveChangelogBodyDocument(entry: unknown): ContentfulRichTextDocument | undefined {
    const fields = (entry as ContentfulEntry)?.fields

    if (!fields) {
        return undefined
    }

    const bodyCandidate = fields.body
    if (isRichTextDocument(bodyCandidate)) {
        return bodyCandidate
    }

    const contentCandidate = fields.content
    if (isRichTextDocument(contentCandidate)) {
        return contentCandidate
    }

    const firstDocument = Object.values(fields)
        .find(value => isRichTextDocument(value))

    return isRichTextDocument(firstDocument)
        ? firstDocument
        : undefined
}

/**
 * Community changelog page sourced from Contentful.
 *
 * @returns Sanitized changelog HTML content.
 */
const ChangelogPage: FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [contentHtml, setContentHtml] = useState<string>('')

    const breadcrumbs = useMemo<Array<BreadcrumbItemModel>>(() => [
        {
            name: 'Changelog',
            url: withLeadingSlash(`${rootRoute}/${changelogRouteId}`)
                .replace(/\/{2,}/g, '/'),
        },
    ], [])

    useEffect(() => {
        let isMounted = true

        async function fetchChangelog(): Promise<void> {
            try {
                const entry = await fetchChangelogEntry()
                const changelogDocument = resolveChangelogBodyDocument(entry)

                if (!isMounted) {
                    return
                }

                if (!changelogDocument) {
                    setContentHtml('')
                    return
                }

                const renderedHtml = documentToHtmlString(changelogDocument as never)
                setContentHtml(DOMPurify.sanitize(renderedHtml))
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchChangelog()
            .catch(() => undefined)

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <section className={styles.page}>
            <Breadcrumb
                items={breadcrumbs}
                renderInline
            />

            <article className={styles.content}>
                <h1 className={styles.title}>Changelog</h1>

                {isLoading ? (
                    <div className={styles.loading}>
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div
                        className={styles.body}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{
                            __html: contentHtml || '<p>No changelog content is currently available.</p>',
                        }}
                    />
                )}
            </article>
        </section>
    )
}

export default ChangelogPage
