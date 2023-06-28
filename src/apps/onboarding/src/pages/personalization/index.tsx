/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
/* eslint-disable sort-keys */
import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, MutableRefObject, useEffect, useRef, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, PageDivider } from '~/libs/ui'
import { RadioButton } from '~/apps/self-service/src/components/radio-button'

import { ProgressBar } from '../../components/progress-bar'
import styles from './styles.module.scss'
import FieldAvatar from '../../components/FieldAvatar'
import InputTextAutoSave from '../../components/InputTextAutoSave'
import PersonalizationInfo, { emptyPersonalizationInfo } from '../../models/PersonalizationInfo'
import InputTextareaAutoSave from '../../components/InputTextareaAutoSave'
import { createMemberPersonalizations, updateMemberPersonalizations } from '../../redux/actions/member'
import MemberInfo from '../../models/MemberInfo'
import SelectOption from '../../models/SelectOption'

const RadioButtonTypescript: any = RadioButton

const referAsOptions: SelectOption[] = [
    {
        label: 'Only show handle instead of name',
        key: 'handle',
    },
    {
        label: 'Show first name, last name and handle',
        key: 'name',
    },
]

const blankPersonalizationInfo: PersonalizationInfo = emptyPersonalizationInfo()

const PagePersonalizationContent: FC<{
    memberInfo?: MemberInfo,
    reduxPersonalization: PersonalizationInfo | null
    updateMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    createMemberPersonalizations: (infos: PersonalizationInfo[]) => void
    loadingMemberTraits: boolean
}> = props => {
    const navigate: any = useNavigate()
    const [loading, setLoading] = useState<boolean>(false)
    const [personalizationInfo, setPersonalizationInfo] = useState<PersonalizationInfo | null>(null)
    const shouldSavingData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    useEffect(() => {
        if (!personalizationInfo && props.reduxPersonalization) {
            setPersonalizationInfo(props.reduxPersonalization)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxPersonalization])

    const saveData: any = async () => {
        if (!personalizationInfo) {
            return
        }

        setLoading(true)
        if (!props.reduxPersonalization) {
            await props.createMemberPersonalizations([personalizationInfo])
        } else {
            await props.updateMemberPersonalizations([personalizationInfo])
        }

        setLoading(false)
    }

    useEffect(() => {
        if (!!personalizationInfo && !_.isEqual(props.reduxPersonalization, personalizationInfo)) {
            if (loading) {
                shouldSavingData.current = true
                return
            }

            saveData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [personalizationInfo])

    useEffect(() => {
        if (!loading && shouldSavingData.current) {
            shouldSavingData.current = false
            saveData()
                .then(_.noop)
        } else if (!loading && !!shouldNavigateTo.current) {
            navigate(shouldNavigateTo.current)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Show us your personality!</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex flex-column full-width gap-20')}>
                <span>
                    When members personalize theirs profiles with a photo and description,
                    they are more likely to get notices by our customers for work and opportunities.
                </span>

                <div className='d-flex gap-100 flex-wrap'>
                    <FieldAvatar
                        memberInfo={props.memberInfo}
                    />

                    <div className={classNames('d-flex flex-column gap-20', styles.blockHandleSelect)}>
                        <h3>Would you like to add a &quot;handle&quot; to use in community communications?</h3>
                        <span>
                            Some of our members prefer to be known within our community with a &quot;handle&quot;
                            or display name that is not their official name.
                            for example: DannyCoder or ZiggyZ123. You will have an opportunity to
                            set preference for how this is used in your profile.
                        </span>

                        <RadioButtonTypescript
                            options={referAsOptions.map(option => ((
                                option.key !== personalizationInfo?.referAs) ? option : ({
                                    ...option,
                                    value: true,
                                })))}
                            onChange={(newValues: any) => {
                                const matchValue: SelectOption = _.find(
                                    newValues,
                                    { value: true },
                                ) as SelectOption
                                if (matchValue) {
                                    const matchOption: SelectOption = _.find(
                                        referAsOptions,
                                        { label: matchValue.label },
                                    ) as SelectOption
                                    if (matchOption) {
                                        setPersonalizationInfo({
                                            ...(personalizationInfo || blankPersonalizationInfo),
                                            referAs: matchOption.key,
                                        })
                                    }
                                }
                            }}
                            disabled={props.loadingMemberTraits}
                        />
                    </div>
                </div>

                <h3 className='mt-30'>Give yourself a professional title</h3>
                <span>An industry standard title will help employers know your general area of expertise.</span>
                <InputTextAutoSave
                    name='title'
                    label='Title'
                    value={personalizationInfo?.profileSelfTitle || ''}
                    onChange={value => {
                        setPersonalizationInfo({
                            ...(personalizationInfo || blankPersonalizationInfo),
                            profileSelfTitle: value || '',
                        })
                    }}
                    placeholder='Company Name'
                    tabIndex={0}
                    type='text'
                    disabled={props.loadingMemberTraits}
                />

                <h3 className='mt-30'>Write a short biography</h3>
                <span>
                    Describe yourself in your own words. A short bio will give
                    potential customers a sense of who you are.
                </span>
                <InputTextareaAutoSave
                    name='shortBio'
                    label='Describe yourself and your work'
                    value={personalizationInfo?.shortBio || ''}
                    onChange={value => {
                        setPersonalizationInfo({
                            ...(personalizationInfo || blankPersonalizationInfo),
                            shortBio: value || '',
                        })
                    }}
                    placeholder='Describe yourself and your work'
                    tabIndex={0}
                    disabled={props.loadingMemberTraits}
                />
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={5.0 / 7}
                label='5/7'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => {
                        if (loading) {
                            shouldNavigateTo.current = '../educations'
                        } else {
                            navigate('../educations')
                        }
                    }}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    onClick={() => {
                        if (loading) {
                            shouldNavigateTo.current = '../account-details'
                        } else {
                            navigate('../account-details')
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
        memberInfo,
        loadingMemberTraits,
        reduxPersonalization: personalization,
    }
}

const mapDispatchToProps: any = {
    createMemberPersonalizations,
    updateMemberPersonalizations,
}

export const PagePersonalization: any = connect(mapStateToProps, mapDispatchToProps)(PagePersonalizationContent)

export default PagePersonalization
