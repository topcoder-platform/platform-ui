import { useNavigate } from 'react-router-dom'
import { FC, MutableRefObject, useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { pick } from 'lodash'
import classNames from 'classnames'

import { Button, IconOutline, PageDivider } from '~/libs/ui'
import { FormInputCheckbox } from '~/apps/self-service/src/components/form-elements'

import { ProgressBar } from '../../components/progress-bar'
import { updateMemberOpenForWork } from '../../redux/actions/member'

import styles from './styles.module.scss'

const FormInputCheckboxMiddleware: any = FormInputCheckbox as any

interface PageOpenToWorkContentProps {
    availableForGigs: boolean
    updateMemberOpenForWork: (isOpenForWork: boolean) => void
}

export const PageOpenToWorkContent: FC<PageOpenToWorkContentProps> = props => {
    const navigate: any = useNavigate()

    const [loading, setLoading] = useState<boolean>(false)

    const shouldSavingData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    useEffect(() => {
        if (!loading && !shouldSavingData.current && !!shouldNavigateTo.current) {
            navigate(shouldNavigateTo.current)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loading])

    function goToPreviousStep(): void {
        navigate('../skills')
    }

    function goToNextStep(): void {
        navigate('../works')
    }

    async function handleSaveAvailableForGigs(e: any): Promise<void> {
        setLoading(true)
        await props.updateMemberOpenForWork(e.target.checked)
        setLoading(false)
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
                            checked={props.availableForGigs}
                            inline
                            onChange={handleSaveAvailableForGigs}
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

const mapStateToProps: any = (state: any) => pick(state.member, 'availableForGigs')

const mapDispatchToProps: any = {
    updateMemberOpenForWork,
}

export const PageOpenToWork: any = connect(mapStateToProps, mapDispatchToProps)(PageOpenToWorkContent)

export default PageOpenToWork
