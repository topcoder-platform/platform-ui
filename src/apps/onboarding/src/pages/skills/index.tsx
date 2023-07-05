/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { FC } from 'react'
import classNames from 'classnames'

import { Button, PageDivider } from '~/libs/ui'
import { InputSkillSelector } from '~/libs/shared/lib/components/input-skill-selector'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'

export const PageSkills: FC<{}> = () => {
    const navigate: any = useNavigate()

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>What skills do you have?</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex justify-content-between')}>
                <div className={classNames('d-flex flex-column', styles.blockLeft)}>
                    <h3>Select your skills</h3>
                    <span className='mt-30'>
                        Add industry standard skills to your profile to let employers
                        search and find you for opportunities that fit your capabilities.
                    </span>
                    <div className='mt-30'>
                        <InputSkillSelector />
                    </div>
                </div>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={2.0 / 7}
                label='2/7'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../start')}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../works')}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

export default PageSkills
