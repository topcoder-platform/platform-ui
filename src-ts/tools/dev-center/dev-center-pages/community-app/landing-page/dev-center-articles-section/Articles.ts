/** The type of the blog post retrieved from the api */
export interface BlogPost {
    contentSnippet: string
    creator: string
    featuredImage: string
    link: string
    title: string
}

/** The type of the Thrive Articles retrieved from Contentful */
export interface ThriveArticle {
    content: string
    contentAuthor: Array<{ fields: { name: string; }; }>
    featuredImage: { fields: { file: { url: string; }; title: string; }; }
    readTime: string
    slug: string
    title: string
    type?: string
}

/** The type of the objects used to specy which articles should be shown inside articles.config.ts */
export interface ArticleEntry {
    type: ArticleType,
    url: string,
}

export enum ArticleType {
    Blog = 'blog',
    Thrive = 'thrive',
}

/** Check  if the article is a BlogPost or a ThriveArticle */
export function isThriveArticle(article: BlogPost | ThriveArticle): article is ThriveArticle {
    return (article as ThriveArticle).readTime !== undefined
}

/** This is the default image to be used for blog posts that do not provide an url to the hero image */
const DEFAULT_BLOG_IMAGE: string = 'https://www.topcoder.com/wp-content/uploads/2017/04/SRM_Blog.png'

/** Get the blog with the given url, or return undefined if the blog couldn't be fetched */
export async function getBlog(url: string): Promise<BlogPost | undefined> {
    try {
        const response: Response = await fetch('https://www.topcoder.com/api/blog?limit=200')
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
