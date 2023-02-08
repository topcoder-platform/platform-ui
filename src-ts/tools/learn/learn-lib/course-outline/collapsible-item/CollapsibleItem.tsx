import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { IconOutline, IconSolid } from '../../../../../lib'
import {
    LearnModule,
    LearnModuleProgress,
    LearnModuleStatus,
    LearnUserCertificationProgress,
} from '../..'
import { StatusIcon } from '../status-icon'
import { StepIcon } from '../step-icon'

import styles from './CollapsibleItem.module.scss'

interface CollapsibleListItem {
    dashedName: string
    id: string
    title: string
}

interface CollapsibleItemProps {
    active?: string
    duration: LearnModule['estimatedCompletionTimeValue']
    durationUnits: LearnModule['estimatedCompletionTimeUnits']
    isAssessment: boolean
    itemId?: (item: CollapsibleListItem) => string
    items: Array<CollapsibleListItem>
    lessonsCount: number
    moduleKey: string
    onItemClick: (item: any) => void
    path?: (item: any) => string
    progress?: LearnUserCertificationProgress['moduleProgresses']
    shortDescription: Array<string>
    title: string
}

const CollapsibleItem: FC<CollapsibleItemProps> = (props: CollapsibleItemProps) => {
    const [isOpen, setIsOpen]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState<boolean>(false)

    const toggle: () => void = useCallback(() => {
        setIsOpen(open => !open)
    }, [])

    const progress: LearnModuleProgress | undefined = useMemo(() => (
        props.progress?.find(m => m.module === props.moduleKey)
    ), [props.progress, props.moduleKey])

    const isPartial: boolean = useMemo(() => !!progress && !!progress.completedLessons.length, [progress])

    const isItemCompleted: (itemId: string) => boolean = (itemId: string) => (
        progress?.moduleStatus === LearnModuleStatus.completed
        || !!progress?.completedLessons.find(l => l.id === itemId)
    )

    const stepLabel: (
        item: CollapsibleListItem,
        isActive: boolean,
        stepCount?: string,
        label?: string
    ) => ReactNode
        = (item: CollapsibleListItem, isActive: boolean, stepCount?: string, label?: string) => (
            <StepIcon
                index={stepCount}
                completed={isItemCompleted(item.id)}
                active={isActive}
                label={label}
            />
        )

    const renderListItem: (item: CollapsibleListItem) => ReactNode
        = (item: CollapsibleListItem) => {
            const isActive: boolean = props.itemId?.(item) === props.active
            const stepCount: string | undefined = item.dashedName.match(/^step-(\d+)$/i)?.[1]
            const label: ReactNode = stepLabel(item, isActive, stepCount, !stepCount ? item.title : undefined)
            const key: string = props.itemId?.(item) ?? item.title

            return (
                <li
                    key={key}
                    className={classNames(styles['item-wrap'], !stepCount && 'full-width')}
                    onClick={() => props.onItemClick(item)}
                >
                    {props.path ? (
                        <Link className={styles['item-wrap']} to={props.path(item)}>
                            {label}
                        </Link>
                    ) : label}
                </li>
            )
        }

    return (
        <div className={classNames(styles.wrap, isOpen ? 'is-open' : 'collapsed')}>
            <div className={styles['title-row']} onClick={toggle}>
                <StatusIcon completed={progress?.moduleStatus === LearnModuleStatus.completed} partial={isPartial} />
                <span className={styles.title}>
                    {props.isAssessment && (
                        <div className={classNames(styles['title-tag'], 'label')}>
                            assessment
                        </div>
                    )}
                    {props.title}
                </span>
                <span className={styles.chevron}>
                    <IconSolid.ChevronUpIcon />
                </span>
            </div>
            {isOpen && (
                <div className={styles.content}>
                    <div className={styles.summary}>
                        <span className={styles['summary-item']}>
                            <IconOutline.DocumentTextIcon />
                            {props.lessonsCount}
                            {' '}
                            Lessons
                        </span>
                        {props.duration && (
                            <span className={styles['summary-item']}>
                                <IconOutline.ClockIcon />
                                {props.duration}
                                {' '}
                                {props.durationUnits}
                            </span>
                        )}
                    </div>
                    <div className={styles['short-desc']}>
                        <span
                            className='body-small'
                            dangerouslySetInnerHTML={{ __html: props.shortDescription.join('<br/>') }}
                        />
                    </div>

                    <ul className={classNames(styles.list, 'steps-list')}>
                        {props.items.map(renderListItem)}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default CollapsibleItem
