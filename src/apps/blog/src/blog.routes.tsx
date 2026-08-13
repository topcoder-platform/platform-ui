import { ToolTitle } from '~/config'
import type { LazyLoadedComponent, PlatformRoute } from '~/libs/core'
import { lazyLoad } from '~/libs/core'

const BlogApp: LazyLoadedComponent = lazyLoad(() => import('./BlogApp'))
const BlogListPage: LazyLoadedComponent = lazyLoad(() => import('./pages/BlogListPage'), 'BlogListPage')
const BlogPostPage: LazyLoadedComponent = lazyLoad(() => import('./pages/BlogPostPage'), 'BlogPostPage')
const BlogLegacyRoute: LazyLoadedComponent = lazyLoad(
    () => import('./pages/BlogLegacyRoute'),
    'BlogLegacyRoute',
)

/** Tool title used by the platform router to resolve Blog child routes. */
export const toolTitle: string = ToolTitle.blog

/** Public Payload-backed Blog route tree, including legacy community-app URLs. */
export const blogRoutes: ReadonlyArray<PlatformRoute> = [
    {
        children: [
            {
                children: [],
                element: <BlogListPage />,
                id: 'Blog home',
                route: '',
            },
            {
                children: [],
                element: <BlogListPage />,
                id: 'Blog page',
                route: 'page/:page',
            },
            {
                children: [],
                element: <BlogPostPage />,
                id: 'Blog post',
                route: 'post/:slug',
            },
            {
                children: [],
                element: <BlogLegacyRoute />,
                id: 'Legacy Blog page or post',
                route: ':slugOrPage',
            },
        ],
        element: <BlogApp />,
        id: toolTitle,
        route: '/blog',
        title: toolTitle,
    },
]
