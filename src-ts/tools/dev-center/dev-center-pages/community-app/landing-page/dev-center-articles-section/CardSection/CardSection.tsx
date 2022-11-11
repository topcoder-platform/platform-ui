import { ContentfulClientApi, createClient } from 'contentful'
import { FC, useEffect, useState } from 'react'

import { ArticleCard } from '../ArticleCard'
import { getBlog } from '../Articles'
import { ArticlesUrl, defaultBlogs } from '../articles.config'
import { ArticleType, BlogPost, ThriveArticle } from '../models'

import styles from './CardSection.module.scss'

const CardSection: FC = () => {
    const [articles, setArticles]: [
        Array<ThriveArticle | BlogPost>,
        React.Dispatch<React.SetStateAction<Array<ThriveArticle | BlogPost>>>
    ] = useState<Array<ThriveArticle | BlogPost>>([])

    useEffect(() => {
        const client: ContentfulClientApi = createClient({
            accessToken: process.env.REACT_APP_CONTENTFUL_EDU_CDN_API_KEY ?? '',
            space: process.env.REACT_APP_CONTENTFUL_EDU_SPACE_ID ?? '',
        })
        Promise.all(
            ArticlesUrl.map(async (articleUrl, idx) => {
                switch (articleUrl.type) {
                    case ArticleType.Thrive:
                        const response: { fields: ThriveArticle }
                            = await client.getEntry(articleUrl.url)
                        return response.fields
                    case ArticleType.Blog:
                        const blog: BlogPost
                            = (await getBlog(articleUrl.url))
                            ?? defaultBlogs[idx]
                        return blog
                }
            }),
        )
            .then(arr => setArticles(arr))
    }, [])

    const articleStyles: Array<any> = [
        styles.mainItem,
        styles.item2,
        styles.item3,
        styles.item4,
        styles.item5,
    ]

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                {articles.map((article, index) => (
                    <ArticleCard
                        article={article}
                        className={articleStyles[index]}
                        isMain={index === 0}
                    />
                ))}
            </div>
        </div>
    )
}

export default CardSection
