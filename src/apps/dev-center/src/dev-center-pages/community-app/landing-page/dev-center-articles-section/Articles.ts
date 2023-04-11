import { EnvironmentConfig } from '~/config'

import { BlogPost, ThriveArticle } from './models'

/** Check  if the article is a BlogPost or a ThriveArticle */
export function isThriveArticle(article: BlogPost | ThriveArticle): article is ThriveArticle {
    return (article as ThriveArticle).readTime !== undefined
}

/** This is the default image to be used for blog posts that do not provide an url to the hero image */
const DEFAULT_BLOG_IMAGE: string = `${EnvironmentConfig.TOPCODER_URLS.WP_CONTENT}/uploads/2017/04/SRM_Blog.png`

/** Get the blog with the given url, or return undefined if the blog couldn't be fetched */
export async function getBlog(url: string): Promise<BlogPost | undefined> {
    try {
        const response: Response = await fetch(`${EnvironmentConfig.TOPCODER_URLS.API_BASE}/blog?limit=200`)
        const data: Array<BlogPost> = await response.json()
        const blog: BlogPost = data.filter(x => x.link === url)[0]
        // If the returned data do not contain the URL to the image, use the default one
        if (!blog.featuredImage) {
            blog.featuredImage = DEFAULT_BLOG_IMAGE
        }

        return blog
    } catch (e) {
        return undefined
    }
}
