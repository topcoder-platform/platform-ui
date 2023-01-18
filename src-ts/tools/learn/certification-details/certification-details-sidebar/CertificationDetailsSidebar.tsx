import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { IconOutline, IconSolid, Tooltip } from '../../../../lib'

import img from './certificate-placeholder.jpg'
import styles from './CertificationDetailsSidebar.module.scss'
import { ProvidersLogoList } from '../providers-logo-list'


interface CertificationDetailsSidebarProps {
    title?: string
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
    const { title } = props

    return (
        <div className={styles['sticky-container']}>
            <div className={styles.wrap}>
                <div className={styles['certificate-placeholder']}>
                    <img src={img} alt='Certification Certificate Placeholder' />
                </div>
                <ul className={styles['certification-details-list']}>
                    <li>
                        <span className={styles.icon}>
                            <IconSolid.ChartBarIcon />
                        </span>
                        <span className='quote-main'>Beginer</span>
                    </li>
                    <li>
                        <span className={styles.icon}>
                            <IconSolid.DocumentTextIcon />
                        </span>
                        <span className='quote-main'>4 courses</span>
                    </li>
                    <li>
                        <span className={styles.icon}>
                            <IconSolid.ClockIcon />
                        </span>
                        <span className='quote-main'>
                            2 months
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
                            $5&nbsp;
                            <span className='strike'>$15</span>
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
                    <li>HTML</li>
                    <li>CSS</li>
                    <li>JavaScript</li>
                    <li>React</li>
                    <li>Skill</li>
                    <li>React</li>
                    <li>HTML</li>
                    <li>Skill</li>
                    <li>Javascript</li>
                    <li>Css</li>
                </ul>

                <ProvidersLogoList label='By' className={styles.providers} />

            </div>
        </div>
    )
}

export default CertificationDetailsSidebar
