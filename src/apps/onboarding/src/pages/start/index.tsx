/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'
import { Button, PageDivider } from '~/libs/ui'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { ProgressBar } from '../../components/progress-bar'
import styles from './styles.module.scss'

export const PageStart: FC<{}> = () => {
    const navigate: any = useNavigate()

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>It&apos;s easy to create an awesome profile!</h2>
            <PageDivider />

            <div className={classNames('d-flex flex-column', styles.blockContent)}>
                <span>
                    When you share your skills, education and work experience, your Topcoder profile will
                    help put your best foot forward.
                </span>
                <span>Let potential employers and others in our network see your exceptional talent!</span>
                <h3 className='mt-30'>How would you like to share your skills and experience?</h3>

                <div className={classNames('d-flex justify-content-between flex-wrap mt-30', styles.blockOr)}>
                    <div>
                        <span>We can extract data from a digital version of your resume.</span>
                        <div className={classNames(styles.blockImportButtons, 'd-flex')}>
                            <Button
                                size='lg'
                                secondary
                                iconToLeft
                            >
                                upload your resume
                            </Button>
                        </div>
                    </div>
                    <h4 className='text-or'>OR</h4>
                    <div>
                        <span>You can enter your information manually</span>
                        <div className={classNames(styles.blockImportButtons, 'd-flex')}>
                            <Button
                                size='lg'
                                secondary
                                iconToLeft
                                onClick={() => navigate('../skills')}
                            >
                                enter my info
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={1.0 / 7}
                label='1/7'
            />

            <div className={classNames('d-flex justify-content-end', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../skills')}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

export default PageStart
