import classNames from 'classnames'
import { FC } from 'react'

import { EnvironmentConfig } from '../../../../../../../config'
import { IconSolid } from '../../../../../../../lib'
import { DevCenterTag } from '../../dev-center-tag'
import { isThriveArticle } from '../Articles'
import { BlogPost, ThriveArticle } from '../models'

import styles from './ArticleCard.module.scss'

interface ArticleCardProps {
    article: ThriveArticle | BlogPost
    className?: string
    isMain: boolean
}

interface ArticleDetails {
    author: string
    image: string
    isThrive: boolean
    isVideo: boolean
    summary: string
    tagText: string
    url: string
}

function openArticle(url: string): void {
    window.open(
        url,
        '_blank' // This is what makes it open in a new window.
    )
}

function getTagText(isThrive: boolean, isVideo: boolean): string {
    return isThrive
        ? isVideo
            ? 'Thrive Video'
            : 'Thrive Article'
        : 'Success Story'
}

function getArticleContent(
    article: ThriveArticle | BlogPost,
    isThrive: boolean
): string {
    return isThrive ? article.content : article.contentSnippet
}

function getArticleDetails(article: ThriveArticle | BlogPost): ArticleDetails {
    const isThrive: boolean = isThriveArticle(article)
    const isVideo: boolean = isThrive && article.type === 'Video'

    const tagText: string = getTagText(isThrive, isVideo)

    const content: string = getArticleContent(article, isThrive)
    const regex: RegExp = /(<([^>]+)>)/gi
    const summary: string = content.replace(regex, '') // Remove html from the content string
    const url: string = isThrive
        ? `${EnvironmentConfig.TOPCODER_URLS.THRIVE_PAGE}/articles/${article.slug}`
        : article.link
    const author: string = !isThrive ? article.creator : ''
    const image: string = isThrive
        ? article.featuredImage.fields.file.url
        : article.featuredImage

    return {
        author,
        image,
        isThrive,
        isVideo,
        summary,
        tagText,
        url,
    }
}

function getOuterClass(isMain: boolean, className: string): string {
    return classNames(
        className,
        styles.outerContainer,
        isMain ? styles.mainArticle : styles.smallArticle
    )
}

const ArticleCard: FC<ArticleCardProps> = ({
    article,
    isMain,
    className = '',
}) => {
    const outerClass: string = getOuterClass(isMain, className)
    const {
        isThrive,
        isVideo,
        tagText,
        summary,
        url,
        author,
        image,
    }: ArticleDetails = getArticleDetails(article)

    return (
        <div
            style={{ backgroundImage: `url('${  image  }')` }}
            className={outerClass}
        >
            <div
                className={styles.innerContainer}
                onClick={() => openArticle(url)}
            >
                {isThrive && isVideo && (
                    <IconSolid.PlayIcon className={styles.playButton} />
                )}
                <div className={styles.container}>
                    <div className={styles.topLine}>
                        <DevCenterTag text={tagText} />
                        {isThrive && (
                            <span className='font-tc-white body-small'>
                                {article.readTime}
                            </span>
                        )}
                    </div>
                    {isMain ? (
                        <h2 className={classNames('font-tc-white', 'details')}>
                            {article.title}
                        </h2>
                    ) : (
                        <h4 className="font-tc-white details">
                            {article.title}
                        </h4>
                    )}
                    {!isThrive && (
                        <span
                            className={classNames(
                                'medium-subtitle',
                                'font-tc-white',
                                styles.author
                            )}
                        >
                            {author}
                        </span>
                    )}
                    {isMain && (
                        <>
                            <span
                                className={classNames(
                                    'body-main',
                                    'font-tc-white',
                                    styles.summary
                                )}
                            >
                                {summary}
                            </span>
                            <span
                                className={classNames(
                                    'font-tc-white',
                                    styles.readMore
                                )}
                            >
                                READ MORE
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ArticleCard
