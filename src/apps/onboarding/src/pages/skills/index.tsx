/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { FC } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { Button, PageDivider } from '~/libs/ui'
import { InputSkillSelector } from '~/libs/shared/lib/components/input-skill-selector'
import { Member } from '~/apps/talent-search/src/lib/models'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'

export const PageSkillsContent: FC<{
    reduxMemberInfo: Member | null
}> = props => {
    const navigate: any = useNavigate()

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>
                Welcome
                {` ${props.reduxMemberInfo?.firstName || ''}`}
                !
                <br />
                Let’s get acquainted.
            </h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex mt-8')}>
                <div className={classNames('d-flex flex-column full-width', styles.blockLeft)}>
                    <h3>What are your skills?</h3>
                    <span className='mt-8 color-black-80'>
                        Understanding your skills will allow us to connect you to the right opportunities.
                    </span>
                    <div className='mt-16 full-width color-black-80'>
                        <InputSkillSelector />
                    </div>
                </div>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={1}
                maxStep={5}
            />

            <div className={classNames('d-flex justify-content-end', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => navigate('../open-to-work')}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        memberInfo,
    }: any = state.member

    return {
        reduxMemberInfo: memberInfo,
    }
}

export const PageSkills: any = connect(mapStateToProps, undefined)(PageSkillsContent)

export default PageSkills
