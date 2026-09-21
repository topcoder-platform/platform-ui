import { FC } from 'react'
import classNames from 'classnames'

import { ProjectShowcasePost } from '~/apps/work/src/lib'
import { IconOutline, LinkButton } from '~/libs/ui'
import { renderRichTextToPlainText } from '~/libs/shared'

import { toClassName } from '../utils'
import { getPostRoute } from '../project-showcase.routes'

import styles from './ProjectShowcaseCard.module.scss'

interface ProjectShowcaseCardProps {
    post: ProjectShowcasePost
}

const ProjectShowcaseCard: FC<ProjectShowcaseCardProps> = props => {
    const industries = props.post.industries.map(item => item.name)
        .join(', ')
    const highlights = [props.post.type, props.post.customer, props.post.currentStatus]
        .map(value => value?.trim())
        .filter(Boolean)
        .join(' · ')
    const summary = props.post.content || props.post.challenge || props.post.businessImpact || ''

    return (
        <article className={styles.wrap}>
            <div className={styles.tags}>
                {props.post.categories.map(category => (
                    <span className={classNames(styles.tag, toClassName(category.name))} id={category.id}>
                        {category.name}
                    </span>
                ))}
            </div>

            <h3 className={styles.title} title={props.post.title || 'Untitled'}>
                {props.post.title || 'Untitled'}
            </h3>
            {highlights && <div className={styles.highlights}>{highlights}</div>}
            {industries && (
                <div className={styles.taxonomy}>
                    <IconOutline.OfficeBuildingIcon className={classNames('icon-lg', styles.industryIcon)} />
                    <span>{industries}</span>
                </div>
            )}

            {summary && (
                <div className={styles.content}>
                    {renderRichTextToPlainText(summary)}
                </div>
            )}

            <div className={styles.button}>
                <LinkButton
                    size='sm'
                    label='View details'
                    secondary
                    to={getPostRoute(props.post.projectId as string, props.post.id)}
                />
            </div>
        </article>
    )
}

export default ProjectShowcaseCard
