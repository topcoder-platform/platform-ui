import { useNavigate } from 'react-router-dom'
import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { updateOrCreateMemberTraitsAsync,
    useMemberTraits,
    UserTrait,
    UserTraitCategoryNames,
    UserTraitIds,
    UserTraits } from '~/libs/core'
import { OpenToWorkData } from '~/libs/shared/lib/components/modify-open-to-work-modal'
import OpenToWorkForm,
{ validateOpenToWork } from '~/libs/shared/lib/components/modify-open-to-work-modal/ModifyOpenToWorkModal'

import { ProgressBar } from '../../components/progress-bar'
import { updateMemberOpenForWork, updatePersonalizations } from '../../redux/actions/member'
import PersonalizationInfo from '../../models/PersonalizationInfo'

import styles from './styles.module.scss'

interface PageOpenToWorkContentProps {
    profileHandle: string
    availableForGigs: boolean
    updateMemberOpenForWork: (isOpenForWork: boolean) => void
    updatePersonalizations: (personalizations: PersonalizationInfo[]) => void
}

export const PageOpenToWorkContent: FC<PageOpenToWorkContentProps> = props => {
    const navigate: any = useNavigate()

    const [loading, setLoading] = useState<boolean>(false)

    const shouldSavingData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    const { data: memberPersonalizationTraits }: {data: UserTraits[] | undefined,} = useMemberTraits(
        props.profileHandle,
        { traitIds: UserTraitIds.personalization },
    )

    const [formValue, setFormValue] = useState<OpenToWorkData>({
        availability: undefined,
        availableForGigs: !!props.availableForGigs,
        preferredRoles: [],
    })

    const [submitAttempted, setSubmitAttempted] = useState(false)

    const [formErrors, setFormErrors]: [
            { [key: string]: string },
            Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    useEffect(() => {
        if (!memberPersonalizationTraits) return

        const personalizationData = memberPersonalizationTraits?.[0]?.traits?.data?.[0] || {}

        const openToWorkItem = personalizationData.openToWork || {}

        setFormValue(prev => ({
            ...prev,
            availability: openToWorkItem?.availability,
            availableForGigs: !!props.availableForGigs,
            preferredRoles: openToWorkItem?.preferredRoles ?? [],
        }))
    }, [memberPersonalizationTraits, props.availableForGigs])

    function handleFormChange(nextValue: OpenToWorkData): void {
        setFormValue(nextValue)

        if (submitAttempted) {
            setFormErrors(validateOpenToWork(nextValue))
        }
    }

    useEffect(() => {
        if (!loading && !shouldSavingData.current && !!shouldNavigateTo.current) {
            navigate(shouldNavigateTo.current)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    function goToPreviousStep(): void {
        navigate('../skills')
    }

    async function goToNextStep(): Promise<void> {
        setSubmitAttempted(true)

        const errors = validateOpenToWork(formValue)
        setFormErrors(errors)

        if (Object.keys(errors).length > 0) {
            // Don't move to next step
            return
        }

        setLoading(true)

        const existing = memberPersonalizationTraits?.[0]?.traits?.data?.[0] || {}

        const personalizationData = [{
            ...existing,
            openToWork: {
                ...(existing.openToWork || {}),
                availability: formValue.availability,
                preferredRoles: formValue.preferredRoles,
            },
        }]

        try {
            const [, updatedTraits] = await Promise.all([
                // profile flag
                props.updateMemberOpenForWork(formValue.availableForGigs),

                // personalization trait
                updateOrCreateMemberTraitsAsync(props.profileHandle, [{
                    categoryName: UserTraitCategoryNames.personalization,
                    traitId: UserTraitIds.personalization,
                    traits: {
                        data: personalizationData,
                    },
                }]),
            ])

            const personalizationTrait = updatedTraits?.find(
                (t: UserTrait) => t.traitId === UserTraitIds.personalization,
            )

            const nextPersonalizations = personalizationTrait?.traits?.data

            if (Array.isArray(nextPersonalizations)) {
                props.updatePersonalizations(nextPersonalizations)
            }

            navigate('../works')
        } catch (e) {
            toast.error('Failed to save work preferences')
            setLoading(false)
        }
    }

    // reset error when open to work toggle off
    useEffect(() => {
        if (!formValue.availableForGigs) {
            setFormErrors({})
            setSubmitAttempted(false)
        }
    }, [formValue.availableForGigs])

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
                        <OpenToWorkForm
                            value={formValue}
                            onChange={handleFormChange}
                            disabled={loading}
                            formErrors={formErrors}
                            showErrors={submitAttempted}
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
                    onClick={goToPreviousStep}
                />
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={goToNextStep}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => ({
    availableForGigs: state.member.memberInfo?.availableForGigs,
    profileHandle: state.member.memberInfo?.handle,
})

const mapDispatchToProps: any = {
    updateMemberOpenForWork,
    updatePersonalizations,
}

export const PageOpenToWork: any = connect(mapStateToProps, mapDispatchToProps)(PageOpenToWorkContent)

export default PageOpenToWork
