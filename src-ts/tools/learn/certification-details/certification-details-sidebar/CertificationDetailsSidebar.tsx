import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, IconSolid, Tooltip } from '../../../../lib'
import {
    CompletionTimeRange,
    LearnLevelIcon,
    ProvidersLogoList,
    StickySidebar,
    TCACertificatePreview,
    TCACertification,
    TCACertificationProgress,
} from '../../learn-lib'
import { EnrollCtaBtn } from '../enroll-cta-btn'
import { getTCACertificateUrl, getTCACertificationValidationUrl } from '../../learn.routes'

import styles from './CertificationDetailsSidebar.module.scss'

interface CertificationDetailsSidebarProps {
    certification: TCACertification
    enrolled: boolean
    certProgress?: TCACertificationProgress
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

const CertificationDetailsSidebar: FC<CertificationDetailsSidebarProps> = (props: CertificationDetailsSidebarProps) => {
    const completed: boolean = !!props.certProgress?.completedAt

    const validateLink: string
        = getTCACertificationValidationUrl(props.certProgress?.completionUuid as string ?? '')

    return (
        <StickySidebar>
            <div className={styles['certificate-placeholder']}>
                <TCACertificatePreview
                    certification={props.certification}
                    userName={props.certProgress?.userName}
                    tcHandle={props.certProgress?.userHandle}
                    completedDate={props.certProgress?.completedAt as unknown as string ?? ''}
                    validateLink={validateLink}
                />
            </div>
            {completed && props.certification && (
                <div className={styles.certCta}>
                    <Button
                        buttonStyle='primary'
                        route={getTCACertificateUrl(props.certification.dashedName)}
                        label='View Certificate'
                    />
                </div>
            )}
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
                        {' courses'}
                    </span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.ClockIcon />
                    </span>
                    <span className='quote-main'>
                        <CompletionTimeRange range={props.certification.completionTimeRange} />
                        <Tooltip
                            content={renderTooltipContents(<IconSolid.ClockIcon />, [
                                'Assuming 4 hour',
                                'learning per day',
                            ])}
                            place='bottom'
                            trigger={<IconOutline.InformationCircleIcon />}
                            triggerOn='hover'
                        />
                    </span>
                </li>
                {!props.certProgress && (
                    <li>
                        <span className={styles.icon}>
                            <IconSolid.CurrencyDollarIcon />
                        </span>
                        <span className='quote-main'>
                            <strong>Free</strong>
                            &nbsp;until March 31&nbsp;
                            <span className='strike'>$20</span>
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
                )}
            </ul>

            <div className={classNames('body-main-medium', styles['section-header'])}>
                Skills Covered
            </div>
            <ul className={styles['certification-skills-list']}>
                {props.certification.skills.map(skill => (
                    <li key={skill}>{skill}</li>
                ))}
            </ul>

            <ProvidersLogoList
                label='Content from'
                className={styles.providers}
                providers={props.certification.providers}
            />

            <div className={styles.btns}>
                {(props.enrolled || completed) ? (
                    <div className={classNames(styles.tag, completed ? styles.completed : styles.enrolled)}>
                        <span className='body-main-medium'>{completed ? 'Completed' : 'Enrolled'}</span>
                    </div>
                ) : (
                    <EnrollCtaBtn certification={props.certification.dashedName} />
                )}
            </div>
        </StickySidebar>
    )
}

export default CertificationDetailsSidebar
