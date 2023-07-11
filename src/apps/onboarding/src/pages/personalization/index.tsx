import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, MutableRefObject, useEffect, useRef } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import { useAutoSavePersonalization, useAutoSavePersonalizationType } from '../../hooks/useAutoSavePersonalization'
import { ProgressBar } from '../../components/progress-bar'
import {
    createMemberPersonalizations,
    setMemberPhotoUrl,
    updateMemberPersonalizations,
    updateMemberPhotoUrl,
} from '../../redux/actions/member'
import FieldAvatar from '../../components/FieldAvatar'
import InputTextAutoSave from '../../components/InputTextAutoSave'
import InputTextareaAutoSave from '../../components/InputTextareaAutoSave'
import MemberInfo from '../../models/MemberInfo'
import PersonalizationInfo, { emptyPersonalizationInfo } from '../../models/PersonalizationInfo'

import styles from './styles.module.scss'

const blankPersonalizationInfo: PersonalizationInfo = emptyPersonalizationInfo()

const PagePersonalizationContent: FC<{
    memberInfo?: MemberInfo,
    reduxPersonalization: PersonalizationInfo | undefined
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    setMemberPhotoUrl: (photoUrl: string) => void
    updateMemberPhotoUrl: (photoUrl: string) => void
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
            if (shouldNavigateTo.current.startsWith('../')) {
                navigate(shouldNavigateTo.current)
            } else {
                window.location.href = shouldNavigateTo.current
            }
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Make it personal</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex flex-column full-width mt-8')}>
                <FieldAvatar
                    memberInfo={props.memberInfo}
                    setMemberPhotoUrl={props.setMemberPhotoUrl}
                    updateMemberPhotoUrl={props.updateMemberPhotoUrl}
                />

                <h3 className='mt-48 mobile-mt-32'>Bio</h3>
                <span className='mt-8 color-black-60'>This is where we can really get to know you. </span>
                <div className='d-flex flex-column mt-16 full-width mobile-gap-16'>
                    <InputTextAutoSave
                        name='title'
                        label='Bio Title'
                        value={personalizationInfo?.profileSelfTitle || ''}
                        onChange={function onChange(value: string | undefined) {
                            setPersonalizationInfo({
                                ...(personalizationInfo || blankPersonalizationInfo),
                                profileSelfTitle: value || '',
                            })
                        }}
                        placeholder='Ex: I’m a creative rockstar'
                        tabIndex={0}
                        type='text'
                        disabled={props.loadingMemberTraits}
                    />

                    <InputTextareaAutoSave
                        name='shortBio'
                        label='Bio'
                        value={personalizationInfo?.shortBio || ''}
                        onChange={function onChange(value: string | undefined) {
                            setPersonalizationInfo({
                                ...(personalizationInfo || blankPersonalizationInfo),
                                shortBio: value || '',
                            })
                        }}
                        placeholder='Share something that makes you, you.'
                        tabIndex={0}
                        disabled={props.loadingMemberTraits}
                    />
                </div>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={5}
                maxStep={5}
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    secondary
                    iconToLeft
                    icon={IconOutline.ChevronLeftIcon}
                    onClick={function previousPage() {
                        if (loading) {
                            shouldNavigateTo.current = '../educations'
                        } else {
                            navigate('../educations')
                        }
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={function nextPage() {
                        if (loading) {
                            shouldNavigateTo.current
                                = `${EnvironmentConfig.USER_PROFILE_URL}/${props.memberInfo?.handle}`
                        } else {
                            window.location.href
                                = `${EnvironmentConfig.USER_PROFILE_URL}/${props.memberInfo?.handle}`
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
        memberInfo,
    }: any = state.member

    return {
        loadingMemberTraits,
        memberInfo,
        reduxPersonalization: personalization,
    }
}

const mapDispatchToProps: any = {
    createMemberPersonalizations,
    setMemberPhotoUrl,
    updateMemberPersonalizations,
    updateMemberPhotoUrl,
}

export const PagePersonalization: any = connect(mapStateToProps, mapDispatchToProps)(PagePersonalizationContent)

export default PagePersonalization
