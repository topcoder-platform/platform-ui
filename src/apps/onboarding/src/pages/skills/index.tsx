import { useNavigate } from 'react-router-dom'
import { FC, useState } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { Button, PageDivider } from '~/libs/ui'
import { Member } from '~/apps/talent-search/src/lib/models'
import { MemberSkillEditor, useMemberSkillEditor } from '~/libs/shared'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'

export const PageSkillsContent: FC<{
    reduxMemberInfo: Member | undefined
}> = props => {
    const navigate: any = useNavigate()
    const [loading, setLoading] = useState(false)
    const editor: MemberSkillEditor = useMemberSkillEditor()

    async function saveSkills(): Promise<void> {
        setLoading(true)
        try {
            await editor.saveSkills()
        } catch (error) {
        }

        setLoading(false)
        navigate('../open-to-work')
    }

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
                        {editor.formInput}
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
                    onClick={saveSkills}
                    disabled={loading}
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
