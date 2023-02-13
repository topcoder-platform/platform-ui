import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'

import { IconSolid } from '../../../../lib'
import { CertIcon, CourseIcon, CrowdIcon } from '../../learn-lib'

import styles from './WhatTCACanDo.module.scss'

const WhatTCACanDo: FC = () => {
    const [collapsed, setCollapsed]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState<boolean>(false)

    const onCollapse: () => void = useCallback(() => {
        setCollapsed(!collapsed)
    }, [
        collapsed,
        setCollapsed,
    ])

    return (
        <div className={styles.wrap}>
            <div className={styles.collapseTrigger}>
                <h2 className='details'>What can topcoder academy do for you?</h2>
                {
                    collapsed ? (
                        <IconSolid.ChevronDownIcon width={24} height={24} onClick={onCollapse} />
                    ) : (
                        <IconSolid.ChevronUpIcon width={24} height={24} onClick={onCollapse} />
                    )
                }
            </div>
            <p>We are working hard to bring you the best content out there. Learn with us!</p>
            {
                !collapsed && (
                    <div className={styles.cards}>
                        <div className={styles.card}>
                            <div className={styles.cardTitle}>
                                <CrowdIcon />
                                <h3 className='details'>Stand out</h3>
                            </div>
                            <p>
                                Increase your chances of getting placed on a gig or placing in a competition!
                                The more you learn, more opportunities will become available.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardTitle}>
                                <CertIcon />
                                <h3 className='details'>Certifications</h3>
                            </div>
                            <p>
                                With our certification program, take advantage of our
                                progress tracking tools and access to future assessments.
                            </p>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardTitle}>
                                <CourseIcon />
                                <h3 className='details'>Courses</h3>
                            </div>
                            <p>
                                Our catalog of courses is growing! We currently offer 11
                                free courses and plan on adding more in the future.
                            </p>
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default WhatTCACanDo
