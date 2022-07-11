import classNames from 'classnames'
import { FC } from 'react'

import { Button } from '../../../../lib'
import { CourseTitle } from '../../learn-lib'

import styles from './CoursesCard.module.scss'

interface CoursesCardProps {
    credits?: string
    link?: string
    title: string
    type: string
}

const CoursesCard: FC<CoursesCardProps> = (props: CoursesCardProps) => {

    return (
        <div className={classNames(styles['wrap'], !props.link && 'soon')}>
            <div className='overline'>
                {props.type}
            </div>
            <CourseTitle title={props.title} type={props.type} credits={props.credits} />
            <div className={styles['bottom']}>
                {props.link && (
                    <Button
                        buttonStyle='primary'
                        size='sm'
                        label='Get Started'
                        route={props.link}
                    />
                )}
                {!props.link && (
                    <h4 className='details'>Coming Soon</h4>
                )}
            </div>
        </div>
    )
}

export default CoursesCard
