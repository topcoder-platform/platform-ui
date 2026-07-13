import { FC, useMemo } from 'react'
import { Params, useParams } from 'react-router-dom'

import { IconOutline, LinkButton, PageTitle } from '~/libs/ui'
import { renderRichTextToHtml } from '~/libs/shared/lib/utils/rich-text'
import { textFormatDateLocaleShortString } from '~/libs/shared/lib/utils/text-format'
import {
    buildProjectUrl,
    useFetchProjectShowcasePost,
    UseFetchProjectShowcasePostResult,
} from '~/apps/work/src/lib'

import { showcaseRootRoute } from '../project-showcase.routes'

import { ShowcasePostMedia } from './ShowcasePostMedia'
import { ShowcasePostChallengeList } from './ShowcasePostChallengeList'
import styles from './ProjectShowcasePostPage.module.scss'

const ProjectShowcasePostPage: FC = () => {
    const routeParams: Params<string> = useParams()
    const { post }: UseFetchProjectShowcasePostResult
        = useFetchProjectShowcasePost(routeParams.projectId, routeParams.postId)
    const industries = useMemo(() => post?.industries.map(ind => ind.name)
        .join(', '), [post?.industries])
    const projectUrl = `${window.location.origin}${buildProjectUrl(routeParams.projectId as string)}`

    const skills = useMemo(
        () => post?.challengeMetadata?.flatMap(entry => entry.skills) ?? [],
        [post?.challengeMetadata],
    )
    const registrantsCount = useMemo(
        () => post?.challengeMetadata?.reduce(
            (count, entry) => count + entry.numOfRegistrants,
            0,
        ) ?? 0,
        [post?.challengeMetadata],
    )
    const countriesCount = useMemo(
        () => {
            const countries = post?.challengeMetadata?.flatMap(entry => entry.countries) ?? []
            return new Set(countries).size
        },
        [post?.challengeMetadata],
    )

    return (
        <div className={styles.wrap}>
            <PageTitle>{post?.title ?? ''}</PageTitle>
            <div className={styles.hero} />
            <div className={styles.contentContainer}>
                <div className={styles.contentHeader}>
                    <div className={styles.topActions}>
                        <div className={styles.tags}>
                            {post?.categories.map(category => (
                                <span key={category.id} className={styles.tag}>{category.name}</span>
                            ))}
                        </div>
                        <div className={styles.btns}>
                            <LinkButton
                                to={showcaseRootRoute}
                                icon={IconOutline.ArrowLeftIcon}
                                iconToLeft
                                label='Back to showcases'
                                size='lg'
                            />
                        </div>
                    </div>
                    <h3 className={styles.title}>
                        {post?.title}
                    </h3>
                    <div className={styles.subTitle}>
                        <div className={styles.subTitleItem}>
                            <IconOutline.OfficeBuildingIcon className='icon-lg' />
                            <span>{industries}</span>
                        </div>
                        <div className={styles.subTitleItem}>
                            <IconOutline.CalendarIcon className='icon-lg' />
                            <span>Published</span>
                            <span>
                                {textFormatDateLocaleShortString(new Date(post?.publishedAt ?? post?.createdAt ?? 0))}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.contentBodyWrap}>
                    <div className={styles.contentBody}>
                        <div
                            className={styles.htmlContent}
                            dangerouslySetInnerHTML={{
                                __html: renderRichTextToHtml(post?.content || ''),
                            }}
                        />
                        <div className={styles.contentSection}>
                            <h5 className={styles.sectionTitle}>Media assets</h5>
                            <ShowcasePostMedia
                                assets={post?.media}
                            />
                        </div>
                        <div className={styles.contentSection}>
                            <h5 className={styles.sectionTitle}>Challenges</h5>
                            <ShowcasePostChallengeList
                                challengeIds={post?.challengeIds}
                            />
                        </div>
                    </div>
                    <aside className={styles.contentBodySidebar}>
                        <div className={styles.panel}>
                            <h5 className={styles.panelTitle}>Project</h5>
                            <div>
                                <a href={projectUrl} target='_blank' rel='noopener noreferrer'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        className='icon-lg'
                                    >
                                        <g clipPath='url(#clip0_56_1248)'>
                                            {/* eslint-disable-next-line max-len */}
                                            <path d='M8.79335 5.79202C9.22657 5.99886 9.60382 6.30664 9.89342 6.68951C10.183 7.07238 10.3765 7.51916 10.4576 7.99232C10.5388 8.46548 10.5052 8.9512 10.3596 9.40867C10.2141 9.86614 9.96093 10.282 9.62135 10.6214L6.62135 13.6213C6.05874 14.184 5.29567 14.5 4.50002 14.5C3.70436 14.5 2.9413 14.184 2.37869 13.6213C1.81607 13.0587 1.5 12.2957 1.5 11.5C1.5 10.7044 1.81607 9.9413 2.37869 9.37868L3.55002 8.20735M12.45 7.79268L13.6213 6.62135C14.184 6.05874 14.5 5.29567 14.5 4.50002C14.5 3.70436 14.184 2.9413 13.6213 2.37869C13.0587 1.81607 12.2957 1.5 11.5 1.5C10.7044 1.5 9.9413 1.81607 9.37868 2.37869L6.37868 5.37868C6.03911 5.71802 5.78593 6.13389 5.64041 6.59137C5.49488 7.04884 5.46127 7.53456 5.5424 8.00772C5.62352 8.48087 5.81701 8.92765 6.10661 9.31053C6.39621 9.6934 6.77347 10.0012 7.20669 10.208' stroke='#0D61BF' strokeWidth='1.4' strokeLinecap='round' strokeLinejoin='round' />
                                        </g>
                                        <defs>
                                            <clipPath id='clip0_56_1248'>
                                                <rect width='16' height='16' fill='white' />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                    <span>{post?.projectTitle}</span>
                                </a>
                            </div>
                            <span className={styles.url}>
                                {projectUrl}
                            </span>
                        </div>
                        <div className={styles.panel}>
                            <h5 className={styles.panelTitle}>Stats</h5>
                            <ul className={styles.statsList}>
                                <li>
                                    <strong>
                                        {post?.challengeMetadata.length}
                                    </strong>
                                    <span>Challenges</span>
                                </li>
                                <li>
                                    <strong>
                                        {registrantsCount}
                                    </strong>
                                    <span>Registrants</span>
                                </li>
                                <li>
                                    <strong>
                                        {countriesCount}
                                    </strong>
                                    <span>Countries</span>
                                </li>
                            </ul>
                        </div>
                        <div className={styles.panel}>
                            <h5 className={styles.panelTitle}>Skills</h5>
                            <p>
                                This showcase includes
                                {' '}
                                <strong>
                                    {skills.length}
                                    {' '}
                                    skills.
                                </strong>
                            </p>
                            <ul className={styles.skillsList}>
                                {skills.map(skill => (
                                    <li key={skill.id}>{skill.name}</li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>

        </div>

    )
}

export default ProjectShowcasePostPage
