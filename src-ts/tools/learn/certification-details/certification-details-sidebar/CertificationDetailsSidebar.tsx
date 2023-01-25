import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, IconSolid, Tooltip } from '../../../../lib'
import { LearnLevelIcon, ProvidersLogoList, TCACertification } from '../../learn-lib'

import img from './certificate-placeholder.jpg'
import styles from './CertificationDetailsSidebar.module.scss'

interface CertificationDetailsSidebarProps {
    certification: TCACertification
}

function renderTooltipContents(icon: ReactNode, text: Array<string>): ReactNode {
    return (
        <div className={styles.tooltip}>
            {icon}
            <span
                className='body-small'
                dangerouslySetInnerHTML={{ __html: text.join('<br />') }}
            />
        </div>
    )
}

const CertificationDetailsSidebar: FC<CertificationDetailsSidebarProps> = (props: CertificationDetailsSidebarProps) => (
    <div className={styles['sticky-container']}>
        <div className={styles.wrap}>
            <div className={styles['certificate-placeholder']}>
                <img src={img} alt='Certification Certificate Placeholder' />
            </div>
            <ul className={styles['certification-details-list']}>
                <li>
                    <span className={styles.icon}>
                        <LearnLevelIcon level={props.certification.learnerLevel} />
                    </span>
                    <span className='quote-main'>{props.certification.learnerLevel}</span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.DocumentTextIcon />
                    </span>
                    <span className='quote-main'>
                        {props.certification.coursesCount}
                        &nbsp;courses
                    </span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.ClockIcon />
                    </span>
                    <span className='quote-main'>
                        {props.certification.estimatedCompletionTime}
                        &nbsp;months
                        <Tooltip
                            content={renderTooltipContents(<IconSolid.ClockIcon />, [
                                'Assuming 1 hour',
                                'learning per day',
                            ])}
                            place='bottom'
                            trigger={<IconOutline.InformationCircleIcon />}
                            triggerOn='hover'
                        />
                    </span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.CurrencyDollarIcon />
                    </span>
                    <span className='quote-main'>
                        <span className='strike'>$15</span>
                        &nbsp;$5
                        &nbsp;one-time payment
                        <Tooltip
                            content={renderTooltipContents(<IconSolid.CurrencyDollarIcon />, [
                                'Introductory low pricing',
                            ])}
                            place='bottom'
                            trigger={<IconOutline.InformationCircleIcon />}
                            triggerOn='hover'
                        />
                    </span>
                </li>
            </ul>

            <div className={classNames('body-main-medium', styles['section-header'])}>
                Skills covered
            </div>
            <ul className={styles['certification-skills-list']}>
                {props.certification.skills.map(skill => (
                    <li key={skill}>{skill}</li>
                ))}
            </ul>

            <ProvidersLogoList
                label='By'
                className={styles.providers}
                providers={props.certification.providers}
            />

            <div className={styles.btns}>
                <Button
                    buttonStyle='primary'
                    size='md'
                    label='Enroll Now'
                />
            </div>
        </div>
    </div>
)

export default CertificationDetailsSidebar
