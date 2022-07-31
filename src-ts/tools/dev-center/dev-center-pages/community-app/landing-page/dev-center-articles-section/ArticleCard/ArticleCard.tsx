/* tslint:disable:cyclomatic-complexity */
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

const ArticleCard: FC<ArticleCardProps> = ({ article, isMain, className= '' }) => {

    const openArticle: () => void = () => {
        window.open(
            url,
            '_blank' // This is what makes it open in a new window.
          )
    }

    const outerClass: string = classNames(className, styles.outerContainer, (isMain ? styles.mainArticle : styles.smallArticle))

    const isThrive = isThriveArticle(article) // tslint:disable-line:typedef
    const isVideo: boolean = isThrive && article.type === 'Video'

    const tagText: string = isThrive
                    ? isVideo
                    ? 'Thrive Video'
                    : 'Thrive Article'
                    : 'Success Story'
    const content: string = isThrive ? article.content : article.contentSnippet

    const regex: RegExp = /(<([^>]+)>)/ig
    const summary: string = content.replace(regex, '') // Remove html from the content string
    const url: string = isThrive
        ? `${EnvironmentConfig.TOPCODER_URLS.THRIVE_PAGE}/articles/${article.slug}`
        : article.link

    const author: string = !isThrive ? article.creator : ''
    const image: string = isThrive ? article.featuredImage.fields.file.url : article.featuredImage

    return (
        <div style={{backgroundImage: 'url(\'' + image + '\')'}} className={outerClass}>
            <div className={styles.innerContainer} onClick={openArticle}>
                {isThrive && isVideo && <IconSolid.PlayIcon className={styles.playButton}/>}
                <div className={styles.container}>
                    <div className={styles.topLine}>
                        <DevCenterTag text={tagText}/>
                        {isThrive && <span className='font-tc-white body-small'>{article.readTime}</span>}
                    </div>
                    {isMain
                    ? <h2 className={classNames('font-tc-white', 'details')}>{article.title}</h2>
                    : <h4 className={'font-tc-white details'}>{article.title}</h4>
                    }
                    { !isThrive && <span className={classNames('medium-subtitle', 'font-tc-white', styles.author)}>{author}</span> }
                    { isMain &&
                    <>
                        <span className={classNames('body-main', 'font-tc-white', styles.summary)}>{summary}</span>
                        <span className={classNames('font-tc-white', styles.readMore)}>READ MORE</span>
                    </>}
                </div>
            </div>
        </div>
    )
}

export default ArticleCard
