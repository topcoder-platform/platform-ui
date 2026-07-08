import { FC } from 'react'
import classNames from 'classnames'

import { ProjectShowcasePost } from '~/apps/work/src/lib'
import { IconOutline, LinkButton } from '~/libs/ui'

import styles from './ProjectShowcaseCard.module.scss'
import { getPostRoute } from '../project-showcase.routes'

interface ProjectShowcaseCardProps {
    post: ProjectShowcasePost
}

const ProjectShowcaseCard: FC<ProjectShowcaseCardProps> = props => {
    return (
        <article className={styles.wrap}>
            <div className={styles.tags}>
                {props.post.categories.map(category => (
                    <span className={styles.tag} id={category.id}>
                        {category.name}
                    </span>
                ))}
            </div>

            <h3 className={styles.title} title={props.post.title || 'Untitled'}>
                {props.post.title || 'Untitled'}
            </h3>
            <div className={styles.taxonomy}>
                <IconOutline.OfficeBuildingIcon className={classNames('icon-lg', styles.industryIcon)} />
                <span>{props.post.industries.map(item => item.name).join(', ') || '—'}</span>
            </div>

            <div className={styles.content}>
                {props.post.content}
            </div>

            <div>
                <LinkButton
                    size='sm'
                    label="View details"
                    secondary
                    to={getPostRoute(props.post.id)}
                />
            </div>
        </article>
    )
}

export default ProjectShowcaseCard
