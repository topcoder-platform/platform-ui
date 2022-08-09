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
