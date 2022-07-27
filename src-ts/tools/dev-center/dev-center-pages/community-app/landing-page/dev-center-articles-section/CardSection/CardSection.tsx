import { ContentfulClientApi, createClient } from 'contentful'
import { FC, useEffect, useState } from 'react'

import { ArticleCard } from '../ArticleCard'
import { ArticleType, BlogPost, getBlog, ThriveArticle } from '../Articles'
import { ArticlesUrl, defaultBlogs } from '../articles.config'

import styles from './CardSection.module.scss'

const CardSection: FC = () => {
    const [articles, setArticles] = useState<Array<ThriveArticle | BlogPost>>([]) // tslint:disable-line:typedef
    useEffect(() => {
        const client: ContentfulClientApi = createClient({
            accessToken: process.env.REACT_APP_CONTENTFUL_EDU_CDN_API_KEY ?? '',
            space: process.env.REACT_APP_CONTENTFUL_EDU_SPACE_ID ?? '',
        })
        Promise.all(ArticlesUrl.map(async (articleUrl, idx) => {
            switch (articleUrl.type) {
                case ArticleType.Thrive:
                    const response: {fields: ThriveArticle} = await client.getEntry(articleUrl.url)
                    return response.fields
                case ArticleType.Blog:
                    const blog: BlogPost = await getBlog(articleUrl.url) ?? defaultBlogs[idx]
                    return blog
            }
        })).then(arr => setArticles(arr))

    }, [])

    return (
        <div className={styles.container}>
            <div className={styles.innerContainer}>
                {articles.length > 0 && <ArticleCard article={articles[0]} className={styles.mainItem} isMain={true}/> }
                {articles.length > 1 && <ArticleCard article={articles[1]} className={styles.item2} isMain={false}/>}
                {articles.length > 2 && <ArticleCard article={articles[2]} className={styles.item3} isMain={false}/>}
                {articles.length > 3 && <ArticleCard article={articles[3]} className={styles.item4} isMain={false}/>}
                {articles.length > 4 && <ArticleCard article={articles[4]} className={styles.item5} isMain={false}/>}
            </div>
        </div>
    )
}

export default CardSection
