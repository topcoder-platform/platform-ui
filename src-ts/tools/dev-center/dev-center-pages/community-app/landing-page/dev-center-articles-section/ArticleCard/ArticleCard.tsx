import { FC } from 'react'
import classNames from 'classnames'

import { EnvironmentConfig } from '../../../../../../../config'
import { IconSolid } from '../../../../../../../lib'
import { DevCenterTag } from '../../dev-center-tag'
import { isThriveArticle } from '../Articles'
import { BlogPost, ThriveArticle } from '../models'

import styles from './ArticleCard.module.scss'

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
        '_blank', // This is what makes it open in a new window.
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
    isThrive: boolean,
): string {
    return isThrive ? (article as ThriveArticle).content : (article as BlogPost).contentSnippet
}

function getArticleDetails(article: ThriveArticle | BlogPost): ArticleDetails {
    const isThrive: boolean = isThriveArticle(article)
    const thriveArticle: ThriveArticle = article as ThriveArticle
    const blogPost: BlogPost = article as BlogPost
    const isVideo: boolean = isThrive && thriveArticle.type === 'Video'

    const tagText: string = getTagText(isThrive, isVideo)

    const content: string = getArticleContent(article, isThrive)
    const regex: RegExp = /(<([^>]+)>)/gi
    const summary: string = content.replace(regex, '') // Remove html from the content string
    const url: string = isThrive
        ? `${EnvironmentConfig.TOPCODER_URLS.THRIVE_PAGE}/articles/${thriveArticle.slug}`
        : blogPost.link
    const author: string = !isThrive ? blogPost.creator : ''
    const image: string = isThrive
        ? thriveArticle.featuredImage.fields.file.url
        : blogPost.featuredImage

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
        isMain ? styles.mainArticle : styles.smallArticle,
    )
}

interface ArticleCardProps {
    article: ThriveArticle | BlogPost
    className?: string
    isMain: boolean
}

const ArticleCard: FC<ArticleCardProps> = props => {
    const outerClass: string = getOuterClass(props.isMain, props.className ?? '')
    const {
        isThrive,
        isVideo,
        tagText,
        summary,
        url,
        author,
        image,
    }: ArticleDetails = getArticleDetails(props.article)

    return (
        <div
            style={{ backgroundImage: `url('${image}')` }}
            className={outerClass}
        >
            <div
                className={styles.innerContainer}
                onClick={function handleOpenArticle() { openArticle(url) }}
            >
                {isThrive && isVideo && (
                    <IconSolid.PlayIcon className={styles.playButton} />
                )}
                <div className={styles.container}>
                    <div className={styles.topLine}>
                        <DevCenterTag text={tagText} />
                        {isThrive && (
                            <span className='font-tc-white body-small'>
                                {(props.article as ThriveArticle).readTime}
                            </span>
                        )}
                    </div>
                    {props.isMain ? (
                        <h2 className={classNames('font-tc-white', 'details')}>
                            {props.article.title}
                        </h2>
                    ) : (
                        <h4 className='font-tc-white details'>
                            {props.article.title}
                        </h4>
                    )}
                    {!isThrive && (
                        <span
                            className={classNames(
                                'medium-subtitle',
                                'font-tc-white',
                                styles.author,
                            )}
                        >
                            {author}
                        </span>
                    )}
                    {props.isMain && (
                        <>
                            <span
                                className={classNames(
                                    'body-main',
                                    'font-tc-white',
                                    styles.summary,
                                )}
                            >
                                {summary}
                            </span>
                            <span
                                className={classNames(
                                    'font-tc-white',
                                    styles.readMore,
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
