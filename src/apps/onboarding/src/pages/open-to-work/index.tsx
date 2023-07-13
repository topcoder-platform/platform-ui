import { useNavigate } from 'react-router-dom'
import { FC, MutableRefObject, useEffect, useMemo, useRef } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { FormInputCheckbox } from '~/apps/self-service/src/components/form-elements'

import { createMemberPersonalizations, updateMemberPersonalizations } from '../../redux/actions/member'
import { ProgressBar } from '../../components/progress-bar'
import { useAutoSavePersonalization, useAutoSavePersonalizationType } from '../../hooks/useAutoSavePersonalization'
import PersonalizationInfo, { emptyPersonalizationInfo } from '../../models/PersonalizationInfo'

import styles from './styles.module.scss'

const FormInputCheckboxMiddleware: any = FormInputCheckbox as any

const blankPersonalizationInfo: PersonalizationInfo = emptyPersonalizationInfo()

interface PageOpenToWorkContentReduxProps {
    reduxPersonalizations: PersonalizationInfo[] | undefined
    loadingMemberTraits: boolean
}

interface PageOpenToWorkContentProps extends PageOpenToWorkContentReduxProps {
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void
}

export const PageOpenToWorkContent: FC<PageOpenToWorkContentProps> = props => {
    const navigate: any = useNavigate()

    const shouldSavingData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    const {
        loading,
        personalizationInfo,
        setPersonalizationInfo,
    }: useAutoSavePersonalizationType = useAutoSavePersonalization(
        props.reduxPersonalizations,
        ['availableForGigs'],
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
                ...(personalizationInfo || {}),
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
                            onChange={function onChange(e: any) {
                                setPersonalizationInfo({
                                    ...(personalizationInfo || {}),
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
                    icon={IconOutline.ChevronLeftIcon}
                    onClick={function previousPage() {
                        checkToNavigateNextPage('../skills')
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={function nextPage() {
                        checkToNavigateNextPage('../works')
                    }}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: (state: any) => PageOpenToWorkContentReduxProps
    = (state: any): PageOpenToWorkContentReduxProps => {
        const {
            loadingMemberTraits,
            personalizations,
        }: any = state.member

        return {
            loadingMemberTraits,
            reduxPersonalizations: personalizations,
        }
    }

const mapDispatchToProps: any = {
    createMemberPersonalizations,
    updateMemberPersonalizations,
}

export const PageOpenToWork: any = connect(mapStateToProps, mapDispatchToProps)(PageOpenToWorkContent)

export default PageOpenToWork
