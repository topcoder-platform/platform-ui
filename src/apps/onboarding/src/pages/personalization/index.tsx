import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, MutableRefObject, useEffect, useRef } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'

import { ProgressBar } from '../../components/progress-bar'
import {
    useAutoSaveMemberDescription,
    useAutoSaveMemberDescriptionType,
} from '../../hooks/useAutoSaveMemberDescription'
import {
    useAutoSavePersonalization,
    useAutoSavePersonalizationType,
} from '../../hooks/useAutoSavePersonalization'
import {
    createMemberPersonalizations,
    setMemberPhotoUrl,
    updateMemberDescription,
    updateMemberPersonalizations,
    updateMemberPhotoUrl,
} from '../../redux/actions/member'
import FieldAvatar from '../../components/FieldAvatar'
import InputTextAutoSave from '../../components/InputTextAutoSave'
import InputTextareaAutoSave from '../../components/InputTextareaAutoSave'
import MemberInfo from '../../models/MemberInfo'
import PersonalizationInfo from '../../models/PersonalizationInfo'

import styles from './styles.module.scss'

interface PagePersonalizationContentReduxProps {
    memberInfo?: MemberInfo,
    reduxPersonalizations: PersonalizationInfo[] | undefined
    loadingMemberTraits: boolean
    loadingMemberInfo: boolean
}

interface PagePersonalizationContentProps extends PagePersonalizationContentReduxProps {
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    setMemberPhotoUrl: (photoUrl: string) => void
    updateMemberPhotoUrl: (photoUrl: string) => void
    updateMemberDescription: (photoUrl: string) => void
}

const PagePersonalizationContent: FC<PagePersonalizationContentProps> = props => {
    const navigate: any = useNavigate()

    const shouldSavingData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldSavingMemberData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    const {
        loading,
        personalizationInfo,
        setPersonalizationInfo,
    }: useAutoSavePersonalizationType = useAutoSavePersonalization(
        props.reduxPersonalizations,
        ['profileSelfTitle'],
        props.updateMemberPersonalizations,
        props.createMemberPersonalizations,
        shouldSavingData,
    )

    const {
        loading: loadingMemberInfo,
        description,
        setDescription,
    }: useAutoSaveMemberDescriptionType = useAutoSaveMemberDescription(
        props.memberInfo,
        props.updateMemberDescription,
        shouldSavingMemberData,
    )

    useEffect(() => {
        if (
            !loading
            && !loadingMemberInfo
            && !shouldSavingData.current
            && !shouldSavingMemberData.current
            && !!shouldNavigateTo.current
        ) {
            if (shouldNavigateTo.current.startsWith('../')) {
                navigate(shouldNavigateTo.current)
            } else {
                window.location.href = shouldNavigateTo.current
            }
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading, loadingMemberInfo])

    function nextPage(pageUrl: string): void {
        if (loading || loadingMemberInfo) {
            shouldNavigateTo.current = pageUrl
        } else if (pageUrl.startsWith('../')) {
            navigate(pageUrl)
        } else {
            window.location.href = pageUrl
        }
    }

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
                                ...(personalizationInfo || {}),
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
                        value={description || ''}
                        onChange={function onChange(value: string | undefined) {
                            setDescription(value || '')
                        }}
                        placeholder='Share something that makes you, you.'
                        tabIndex={0}
                        disabled={props.loadingMemberInfo}
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
                    disabled={!!shouldNavigateTo.current}
                    onClick={function previousPage() {
                        nextPage('../educations')
                    }}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={!!shouldNavigateTo.current}
                    onClick={function onClick() {
                        nextPage(
                            `${EnvironmentConfig.USER_PROFILE_URL}/${props.memberInfo?.handle}`
                            + '?edit-mode=onboardingCompleted',
                        )
                    }}
                >
                    done
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: (state: any) => PagePersonalizationContentReduxProps
    = (state: any): PagePersonalizationContentReduxProps => {
        const {
            loadingMemberTraits,
            loadingMemberInfo,
            personalizations,
            memberInfo,
        }: any = state.member

        return {
            loadingMemberInfo,
            loadingMemberTraits,
            memberInfo,
            reduxPersonalizations: personalizations,
        }
    }

const mapDispatchToProps: any = {
    createMemberPersonalizations,
    setMemberPhotoUrl,
    updateMemberDescription,
    updateMemberPersonalizations,
    updateMemberPhotoUrl,
}

export const PagePersonalization: any = connect(mapStateToProps, mapDispatchToProps)(PagePersonalizationContent)

export default PagePersonalization
