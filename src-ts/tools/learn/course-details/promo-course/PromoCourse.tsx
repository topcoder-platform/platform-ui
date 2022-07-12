import classNames from 'classnames'
import { FC } from 'react'

import { ReactComponent as LearnGetCertified } from './learn-get-certified.svg'
import { ReactComponent as MobileLearnGetCertified2 } from './mobile-get-certified-2.svg'
import { ReactComponent as MobileLearnGetCertified } from './mobile-get-certified.svg'
import styles from './PromoCourse.module.scss'

const PromoCourse: FC<{}> = () => {

    return (
        <div className={styles['wrap']}>
            <div className={styles['text-content']}>
                <h4 className='details'>Coming soon</h4>
                <div className='body-medium-bold'>
                    More ways to reach your potential with Recommended Learning Paths
                </div>
                <div className='body-main'>
                    We will be building additional learning path courses, where when taken
                    in sequence, will result in a larger Topcoder certification.
                    These certifications will show in your Topcoder profile and will showcase
                    your verified skills and earned certifications. The resulting outcome is
                    that you have gained essential skills allowing you to be more successful
                    on the Topcoder platform.
                </div>
            </div>
            <div className={classNames('mobile-hide', styles['course-path-steps'])}>
                <LearnGetCertified />
            </div>
            <div className={classNames('desktop-hide', styles['course-path-steps'])}>
                <MobileLearnGetCertified />
                <MobileLearnGetCertified2 />
            </div>
        </div>
    )
}

export default PromoCourse
