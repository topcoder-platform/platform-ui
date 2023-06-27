/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, PageDivider } from '~/libs/ui'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'
import FieldAvatar from '../../components/FieldAvatar'
import { RadioButton } from '~/apps/self-service/src/components/radio-button'
import InputTextAutoSave from '../../components/InputTextAutoSave'
import PersonalizationInfo, { emptyPersonalizationInfo } from '../../models/PersonalizationInfo'
import InputTextareaAutoSave from '../../components/InputTextareaAutoSave'

const RadioButtonTypescript: any = RadioButton

const referAsOptions = [
    {
        label: 'Only show handle instead of name',
        key: 'handle',
        value: false,
    },
    {
        label: 'Show first name, last name and handle',
        key: 'name',
        value: false,
    },
]

const blankPersonalizationInfo: PersonalizationInfo = emptyPersonalizationInfo()

const PagePersonalizationContent: FC<{
}> = props => {
    const navigate: any = useNavigate()
    const [loading, setLoading] = useState<boolean>(false)
    const [personalizationInfo, setPersonalizationInfo] = useState<PersonalizationInfo | null>(null)

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Show us your personality!</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex flex-column full-width')}>
                <span>When members personalize theirs profiles with a photo and description,
                    they are more likely to get notices by our customers for work and opportunities.</span>

                <div className='d-flex'>
                    <FieldAvatar />

                    <div className='d-flex flex-column'>
                        <h3>Would you like to add a "handle" to use in community communications?</h3>
                        <span>Some of our members prefer to be known within our community with a "handle" or display name that is not their official name.
                            for example: DannyCoder or ZiggyZ123. You will have an opportunity to set preference for how this is used in your profile.
                        </span>

                        <RadioButtonTypescript
                            options={referAsOptions}
                            onChange={(newValues: any) => {
                                console.log('totest newValues', newValues)
                            }}
                            disabled={loading}
                        />
                    </div>
                </div>

                <h3>Give yourself a professional title</h3>
                <span>An industry standard title will help employers know your general area of expertise.</span>
                <InputTextAutoSave
                    name='title'
                    label='Title'
                    value={personalizationInfo?.profileSelfTitle || ''}
                    onChange={event => {
                        setPersonalizationInfo({
                            ...(personalizationInfo || blankPersonalizationInfo),
                            profileSelfTitle: event.target.value,
                        })
                    }}
                    placeholder='Company Name'
                    tabIndex={0}
                    type='text'
                />

                <h3>Write a short biography</h3>
                <span>Describe yourself in your own words. A short bio will give potential customers a sense of who you are.</span>
                <InputTextareaAutoSave
                    name='shortBio'
                    label='Describe yourself and your work'
                    value={personalizationInfo?.profileSelfTitle || ''}
                    onChange={event => {
                        setPersonalizationInfo({
                            ...(personalizationInfo || blankPersonalizationInfo),
                            profileSelfTitle: event.target.value,
                        })
                    }}
                    placeholder='Describe yourself and your work'
                    tabIndex={0}
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
                    disabled={loading}
                    onClick={() => navigate('../educations')}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={() => navigate('../account-details')}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
}

const mapDispatchToProps: any = {
}

export const PagePersonalization: any = connect(mapStateToProps, mapDispatchToProps)(PagePersonalizationContent)

export default PagePersonalization
