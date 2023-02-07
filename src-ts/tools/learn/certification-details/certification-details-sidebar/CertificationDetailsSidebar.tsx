import { FC } from 'react'
import classNames from 'classnames'

import { Button, IconSolid } from '../../../../lib'
import { CompletionTimeRange, LearnLevelIcon, ProvidersLogoList, TCACertification } from '../../learn-lib'

import img from './certificate-placeholder.jpg'
import styles from './CertificationDetailsSidebar.module.scss'

interface CertificationDetailsSidebarProps {
    certification: TCACertification
    enrolled: boolean
    onEnroll: () => void
}

// Needed for the tooltip which is disabled unti payments are implemented
// function renderTooltipContents(icon: ReactNode, text: Array<string>): ReactNode {
//     return (
//         <div className={styles.tooltip}>
//             {icon}
//             <span
//                 className='body-small'
//                 dangerouslySetInnerHTML={{ __html: text.join('<br />') }}
//             />
//         </div>
//     )
// }

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
                        {' courses'}
                    </span>
                </li>
                <li>
                    <span className={styles.icon}>
                        <IconSolid.ClockIcon />
                    </span>
                    <span className='quote-main'>
                        <CompletionTimeRange range={props.certification.completionTimeRange} />
                    </span>
                </li>
                {/* Probably will be added later on when payments are implemented */}
                {/* <li>
                    <span className={styles.icon}>
                        <IconSolid.CurrencyDollarIcon />
                    </span>
                    <span className='quote-main'>
                        <span className='strike'>$15</span>
                        {' Free until March 31'}
                        <Tooltip
                            content={renderTooltipContents(<IconSolid.CurrencyDollarIcon />, [
                                'Introductory low pricing',
                            ])}
                            place='bottom'
                            trigger={<IconOutline.InformationCircleIcon />}
                            triggerOn='hover'
                        />
                    </span>
                </li> */}
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
                label='By'
                className={styles.providers}
                providers={props.certification.providers}
            />

            <div className={styles.btns}>
                {props.enrolled ? (
                    <div className={classNames(styles.tag, styles.enrolled)}>
                        <span className='body-main-medium'>Enrolled</span>
                    </div>
                ) : (
                    <Button
                        buttonStyle='primary'
                        size='md'
                        label='Enroll Now'
                        onClick={props.onEnroll}
                    />
                )}
            </div>
        </div>
    </div>
)

export default CertificationDetailsSidebar
