import { useNavigate } from 'react-router-dom'
import { FC, MutableRefObject, useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { updateOrCreateMemberTraitsAsync,
    useMemberTraits,
    UserTraitCategoryNames,
    UserTraitIds,
    UserTraits } from '~/libs/core'
import { OpenToWorkData } from '~/libs/shared/lib/components/modify-open-to-work-modal'
import { upsertTrait } from '~/libs/shared'
import OpenToWorkForm from '~/libs/shared/lib/components/modify-open-to-work-modal/ModifyOpenToWorkModal'

import { ProgressBar } from '../../components/progress-bar'
import { updateMemberOpenForWork } from '../../redux/actions/member'

import styles from './styles.module.scss'

interface PageOpenToWorkContentProps {
    profileHandle: string
    availableForGigs: boolean
    updateMemberOpenForWork: (isOpenForWork: boolean) => void
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

    useEffect(() => {
        if (!memberPersonalizationTraits) return

        const personalizationData
      = memberPersonalizationTraits?.[0]?.traits?.data?.[0]?.openToWork || {}

        setFormValue(prev => ({
            ...prev,
            availability: personalizationData?.availability,
            availableForGigs: !!props.availableForGigs,
            preferredRoles: personalizationData?.preferredRoles ?? [],
        }))
    }, [memberPersonalizationTraits, props.availableForGigs])

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
        setLoading(true)

        const existingData = memberPersonalizationTraits?.[0]?.traits?.data || []

        const personalizationData = upsertTrait(
            'openToWork',
            {
                availability: formValue.availability,
                preferredRoles: formValue.preferredRoles,
            },
            existingData,
        )

        try {
            await Promise.all([
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

            navigate('../works')
        } catch (e) {
            toast.error('Failed to save work preferences')
            setLoading(false)
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
                        <OpenToWorkForm
                            value={formValue}
                            onChange={setFormValue}
                            disabled={loading}
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
}

export const PageOpenToWork: any = connect(mapStateToProps, mapDispatchToProps)(PageOpenToWorkContent)

export default PageOpenToWork
