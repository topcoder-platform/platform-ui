/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { FC, MutableRefObject, useEffect, useRef } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import { Button, PageDivider } from '~/libs/ui'
import { FormInputCheckbox } from '~/apps/self-service/src/components/form-elements'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'
import PersonalizationInfo, { emptyPersonalizationInfo } from '../../models/PersonalizationInfo'
import { createMemberPersonalizations, updateMemberPersonalizations } from '../../redux/actions/member'
import { useAutoSavePersonalization, useAutoSavePersonalizationType } from '../../hooks/useAutoSavePersonalization'
import { ReactComponent as IconBackGreen } from '../../assets/images/back-green.svg'

const FormInputCheckboxMiddleware: any = FormInputCheckbox as any

const blankPersonalizationInfo: PersonalizationInfo = emptyPersonalizationInfo()

export const PageOpenToWorkContent: FC<{
    reduxPersonalization: PersonalizationInfo | null
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    loadingMemberTraits: boolean
}> = props => {
    const navigate: any = useNavigate()

    const shouldSavingData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    const {
        loading,
        personalizationInfo,
        setPersonalizationInfo,
    }: useAutoSavePersonalizationType = useAutoSavePersonalization(
        props.reduxPersonalization,
        props.updateMemberPersonalizations,
        props.createMemberPersonalizations,
        shouldSavingData,
    )

    useEffect(() => {
        if (!loading && !shouldSavingData.current && !!shouldNavigateTo.current) {
            navigate(shouldNavigateTo.current)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>
                Are you open to work?
            </h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex mt-8')}>
                <div className={classNames('d-flex flex-column full-width', styles.blockLeft)}>
                    <h3>Don’t miss work opportunities.</h3>
                    <span className='mt-8 color-black-80'>
                        By selecting “Yes, I’m open to work” our customers will know that you are
                        available for job opportunities.
                        You will have the option to change this at any time on your member profile.
                    </span>

                    <div className='mt-26'>
                        <FormInputCheckboxMiddleware
                            label='Yes, I’m open to work'
                            checked={(personalizationInfo || blankPersonalizationInfo).availableForGigs}
                            inline
                            onChange={(e: any) => {
                                setPersonalizationInfo({
                                    ...personalizationInfo,
                                    availableForGigs: e.target.checked,
                                })
                            }}
                            disabled={props.loadingMemberTraits}
                        />
                    </div>
                </div>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={2}
                maxStep={5}
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    icon={IconBackGreen}
                    onClick={() => {
                        if (loading) {
                            shouldNavigateTo.current = '../skills'
                        } else {
                            navigate('../skills')
                        }
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => {
                        if (loading) {
                            shouldNavigateTo.current = '../works'
                        } else {
                            navigate('../works')
                        }
                    }}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        loadingMemberTraits,
        personalization,
    }: any = state.member

    return {
        loadingMemberTraits,
        reduxPersonalization: personalization,
    }
}

const mapDispatchToProps: any = {
    createMemberPersonalizations,
    updateMemberPersonalizations,
}

export const PageOpenToWork: any = connect(mapStateToProps, mapDispatchToProps)(PageOpenToWorkContent)

export default PageOpenToWork
