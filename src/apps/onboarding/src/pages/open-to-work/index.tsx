/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { FC, MutableRefObject, useEffect, useMemo, useRef } from 'react'
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

    const availableForGigsValue: boolean | undefined = useMemo(() => {
        if (!personalizationInfo || personalizationInfo.availableForGigs === undefined) {
            return blankPersonalizationInfo.availableForGigs
        }

        return personalizationInfo.availableForGigs
    }, [personalizationInfo])

    useEffect(() => {
        if (!loading && !shouldSavingData.current && !!shouldNavigateTo.current) {
            navigate(shouldNavigateTo.current)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    function checkToNavigateNextPage(pageUrl: string): void {
        if (!personalizationInfo || personalizationInfo.availableForGigs === undefined) {
            shouldNavigateTo.current = pageUrl
            setPersonalizationInfo({
                ...(personalizationInfo || blankPersonalizationInfo),
                availableForGigs: blankPersonalizationInfo.availableForGigs,
            })
        } else {
            navigate(pageUrl)
        }
    }

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
                            checked={availableForGigsValue}
                            inline
                            onChange={(e: any) => {
                                setPersonalizationInfo({
                                    ...(personalizationInfo || blankPersonalizationInfo),
                                    availableForGigs: e.target.checked,
                                })
                            }}
                            disabled={props.loadingMemberTraits || loading}
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
                    disabled={loading}
                    icon={IconBackGreen}
                    onClick={() => {
                        checkToNavigateNextPage('../skills')
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={() => {
                        checkToNavigateNextPage('../works')
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
