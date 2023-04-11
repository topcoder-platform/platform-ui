export enum ArticleType {
    Blog = 'blog',
    Thrive = 'thrive',
}

/** The type of the objects used to specy which articles should be shown inside articles.config.ts */
export interface ArticleEntry {
    type: ArticleType,
    url: string,
}
