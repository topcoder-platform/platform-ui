import { FC, useMemo } from 'react'

import { EnvironmentConfig } from '~/config'
import { IconOutline } from '~/libs/ui'
import { renderRichTextToHtml } from '~/libs/shared/lib/utils/rich-text'
import { textFormatDateLocaleShortString } from '~/libs/shared/lib/utils/text-format'

import styles from './ShowcasePostPreview.module.scss'

export interface ShowcasePostPreviewChallenge {
    id: string
    name: string
    url: string
    track?: string
    numOfSubmissions?: number
    numOfRegistrants?: number
}

export interface ShowcasePostPreviewData {
    title: string
    content: string
    categories: Array<{ id: string; name: string }>
    industries: Array<{ id: string; name: string }>
    media: Array<{ url: string; type: string; alt?: string }>
    challenges: ShowcasePostPreviewChallenge[]
    projectTitle: string
    projectUrl: string
    publishedAt: number | string
    challengeCount: number
    registrantsCount: number
    countriesCount: number
    skills: Array<{ id: string; name: string }>
}

export interface ShowcasePostPreviewProps {
    data: ShowcasePostPreviewData
}

function isImageMedia(type: string, url: string): boolean {
    const value = `${type} ${url}`.toLowerCase()
    return /\.(bmp|gif|jpe?g|png)(?:[?#]|$)/.test(value)
        || value.includes('image/')
}

/**
 * Allows only http(s) URLs for media src/href to block javascript: and other XSS vectors.
 */
function getSafeHttpUrl(value: string | undefined): string | undefined {
    if (!value) {
        return undefined
    }

    try {
        const parsed = new URL(value)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString()
        }
    } catch {
        return undefined
    }

    return undefined
}

const ShowcasePostPreview: FC<ShowcasePostPreviewProps> = props => {
    const data: ShowcasePostPreviewData = props.data
    const industries: string = useMemo(
        () => data.industries.map(item => item.name)
            .join(', '),
        [data.industries],
    )
    const projectUrl: string | undefined = getSafeHttpUrl(data.projectUrl)

    return (
        <div className={styles.wrap}>
            <div className={styles.header}>
                <div className={styles.tags}>
                    {data.categories.map(category => (
                        <span key={category.id} className={styles.tag}>{category.name}</span>
                    ))}
                </div>
                <h3 className={styles.title}>{data.title || 'Untitled post'}</h3>
                <div className={styles.subTitle}>
                    {industries && (
                        <div className={styles.subTitleItem}>
                            <IconOutline.OfficeBuildingIcon className='icon-lg' />
                            <span>{industries}</span>
                        </div>
                    )}
                    <div className={styles.subTitleItem}>
                        <IconOutline.CalendarIcon className='icon-lg' />
                        <span>Published</span>
                        <span>
                            {textFormatDateLocaleShortString(new Date(data.publishedAt || Date.now()))}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.bodyWrap}>
                <div className={styles.body}>
                    <div
                        className={styles.htmlContent}
                        dangerouslySetInnerHTML={{
                            __html: renderRichTextToHtml(data.content || ''),
                        }}
                    />

                    <section className={styles.section}>
                        <h5 className={styles.sectionTitle}>Media assets</h5>
                        {data.media.length > 0 ? (
                            <ul className={styles.mediaList}>
                                {data.media.map((item, index) => {
                                    const key: string = `${item.url}-${index}`
                                    const safeUrl: string | undefined = getSafeHttpUrl(item.url)
                                    if (!safeUrl) {
                                        return (
                                            <li key={key} className={styles.mediaItem}>
                                                <span className={styles.mediaLink}>
                                                    {item.alt || item.type || 'Unavailable file'}
                                                </span>
                                            </li>
                                        )
                                    }

                                    if (isImageMedia(item.type, item.url)) {
                                        return (
                                            <li key={key} className={styles.mediaItem}>
                                                <img
                                                    src={safeUrl}
                                                    alt={item.alt || `Media ${index + 1}`}
                                                    className={styles.mediaImage}
                                                />
                                            </li>
                                        )
                                    }

                                    return (
                                        <li key={key} className={styles.mediaItem}>
                                            <a
                                                href={safeUrl}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className={styles.mediaLink}
                                            >
                                                {item.alt || item.type || 'Open file'}
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <p className={styles.emptyMessage}>No media added yet.</p>
                        )}
                    </section>

                    <section className={styles.section}>
                        <h5 className={styles.sectionTitle}>Challenges</h5>
                        {data.challenges.length > 0 ? (
                            <ul className={styles.challengeList}>
                                {data.challenges.map(challenge => {
                                    const challengeUrl: string | undefined = getSafeHttpUrl(
                                        challenge.url
                                            || `${EnvironmentConfig.URLS.CHALLENGES_PAGE}/${challenge.id}`,
                                    )

                                    return (
                                        <li key={challenge.id} className={styles.challengeItem}>
                                            <div className={styles.challengeMain}>
                                                {challenge.track && (
                                                    <span className={styles.challengeTrack}>
                                                        {challenge.track}
                                                    </span>
                                                )}
                                                {challengeUrl ? (
                                                    <a
                                                        href={challengeUrl}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className={styles.challengeTitle}
                                                    >
                                                        {challenge.name}
                                                    </a>
                                                ) : (
                                                    <span className={styles.challengeTitle}>
                                                        {challenge.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.challengeMeta}>
                                                {(typeof challenge.numOfSubmissions === 'number'
                                                    || typeof challenge.numOfRegistrants === 'number') && (
                                                    <div className={styles.challengeStats}>
                                                        {typeof challenge.numOfSubmissions === 'number' && (
                                                            <span>
                                                                {challenge.numOfSubmissions}
                                                                {' '}
                                                                submissions
                                                            </span>
                                                        )}
                                                        {typeof challenge.numOfRegistrants === 'number' && (
                                                            <span>
                                                                {challenge.numOfRegistrants}
                                                                {' '}
                                                                registrants
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {challengeUrl && (
                                                    <a
                                                        href={challengeUrl}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className={styles.challengeViewLink}
                                                    >
                                                        View
                                                        <IconOutline.ArrowRightIcon className='icon-sm' />
                                                    </a>
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <p className={styles.emptyMessage}>No challenges selected.</p>
                        )}
                    </section>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.panel}>
                        <h5 className={styles.panelTitle}>Project</h5>
                        {projectUrl ? (
                            <>
                                <a
                                    href={projectUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className={styles.projectLink}
                                >
                                    <span>{data.projectTitle || 'Project'}</span>
                                </a>
                                <span className={styles.projectUrl}>{projectUrl}</span>
                            </>
                        ) : (
                            <p className={styles.projectName}>{data.projectTitle || 'Project'}</p>
                        )}
                    </div>

                    <div className={styles.panel}>
                        <h5 className={styles.panelTitle}>Stats</h5>
                        <ul className={styles.statsList}>
                            <li>
                                <strong>{data.challengeCount}</strong>
                                <span>Challenges</span>
                            </li>
                            <li>
                                <strong>{data.registrantsCount}</strong>
                                <span>Registrants</span>
                            </li>
                            <li>
                                <strong>{data.countriesCount}</strong>
                                <span>Countries</span>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.panel}>
                        <h5 className={styles.panelTitle}>Skills</h5>
                        <p className={styles.skillsSummary}>
                            This showcase includes
                            {' '}
                            <strong>
                                {data.skills.length}
                                {' '}
                                skills.
                            </strong>
                        </p>
                        {data.skills.length > 0 && (
                            <ul className={styles.skillsList}>
                                {data.skills.map(skill => (
                                    <li key={skill.id}>{skill.name}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default ShowcasePostPreview
