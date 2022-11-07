import classNames from 'classnames'
import { FC } from 'react'

import { Button, textFormatDateLocaleShortString } from '../../../../../lib'
import { CourseTitle, LearnCertification } from "../.."
import { getCertificatePath, getCoursePath } from '../../../learn.routes'

import styles from './Completed.module.scss'

interface CompletedProps {
    certification: LearnCertification
    completed: string
}

const Completed: FC<CompletedProps> = (props: CompletedProps) => {

    if (!props.certification) {
        return <></>
    }

    return (
        <div className={classNames(styles.wrap, 'course-card-wrap', 'completed')}>
            <div className={styles.line}>
                <CourseTitle
                    title={props.certification.title}
                    trackType={props.certification.trackType}
                    credits={props.certification.providerName}
                >
                    <div className={styles['completed-status']}>
                        Completed{' '}
                        {textFormatDateLocaleShortString(new Date(props.completed))}
                    </div>
                </CourseTitle>
            </div>
            <div className={styles['buttons-wrap']}>
                <Button
                    size='xs'
                    buttonStyle='secondary'
                    label='View Course'
                    route={getCoursePath(props.certification.providerName, props.certification.certification)}
                />
                <Button
                    size='xs'
                    buttonStyle='secondary'
                    label='View certificate'
                    route={getCertificatePath(props.certification.providerName, props.certification.certification)}
                />
            </div>
        </div>
    )
}

export default Completed
