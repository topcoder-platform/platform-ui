import classNames from 'classnames'
import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline, IconSolid } from '../../../../../lib'
import { LearnModule, LearnModuleProgress, LearnUserCertificationProgress } from '../../../learn-lib'
import { StatusIcon } from '../status-icon'
import { StepIcon } from '../step-icon'

import styles from './CollapsibleItem.module.scss'

interface CollapsibleListItem {
    dashedName: string
    title: string
}

interface CollapsibleItemProps {
    active?: string
    duration: LearnModule['meta']['estimatedCompletionTime']
    itemId?: (item: any) => string
    items: Array<CollapsibleListItem>
    lessonsCount: number
    moduleKey: string
    path?: (item: any) => string
    progress?: LearnUserCertificationProgress['modules']
    shortDescription: Array<string>
    title: string
}

const CollapsibleItem: FC<CollapsibleItemProps> = (props: CollapsibleItemProps) => {
    const [isOpen, setIsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const isAssessment: boolean = props.lessonsCount === 1

    const toggle: () => void = useCallback(() => {
        setIsOpen(open => !open)
    }, [])

    const progress: LearnModuleProgress | undefined = useMemo(() => {
        return props.progress?.find(m => m.module === props.moduleKey)
    }, [props.progress, props.moduleKey])

    const isCompleted: boolean = useMemo(() => {
        return !!progress && progress.lessonCount === progress?.completedLessons.length
    }, [progress])

    const isPartial: boolean = useMemo(() => {
        return !!progress && !!progress.completedLessons.length
    }, [progress])

    const isItemCompleted: (key: string) => boolean = (key: string) => (
        !!progress?.completedLessons.find(l => l.dashedName === key)
    )

    const listItem: (item: any, isActive?: boolean) => ReactNode = (item: any, isActive?: boolean) => (
        <StepIcon
            index={parseInt(item.dashedName.split('-').pop(), 10) || 1}
            completed={isItemCompleted(item.dashedName)}
            active={isActive}
        />
    )

    return (
        <div className={classNames(styles['wrap'], isOpen ? 'is-open' : 'collapsed')}>
            <div className={styles['title-row']} onClick={toggle}>
                <StatusIcon completed={isCompleted} partial={isPartial} />
                <span className={styles['title']}>
                    {isAssessment && (
                        <div className={classNames(styles['title-tag'], 'label')}>
                            assessment
                        </div>
                    )}
                    {props.title}
                </span>
                <span className={styles['chevron']}>
                    <IconSolid.ChevronUpIcon />
                </span>
            </div>
            {isOpen && (
                <div className={styles['content']}>
                    <div className={styles['summary']}>
                        <span className={styles['summary-item']}>
                            <IconOutline.DocumentTextIcon />
                            {props.lessonsCount} Lessons
                        </span>
                        <span className={styles['summary-item']}>
                            <IconOutline.ClockIcon />
                            {props.duration.value} {props.duration.units}
                        </span>
                    </div>
                    <div className={styles['short-desc']}>
                        <span className='body-small' dangerouslySetInnerHTML={{ __html: props.shortDescription.join('<br/>') }}></span>
                    </div>

                    <ul className={classNames(styles['list'], 'steps-list')}>
                        {props.items.map((it) => (
                            <li key={props.itemId?.(it) ?? it.title} className={styles['item-wrap']}>
                                {props.path ? (
                                    <Link className={styles['item-wrap']} to={props.path(it)}>{listItem(it, props.itemId?.(it) === props.active)}</Link>
                                ) : (listItem(it, props.itemId?.(it) === props.active))}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default CollapsibleItem
