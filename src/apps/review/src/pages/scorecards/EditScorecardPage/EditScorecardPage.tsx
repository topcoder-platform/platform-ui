import * as yup from 'yup'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button, LinkButton } from '~/libs/ui'

import { useFetchScorecard } from '../../../lib/hooks/useFetchScorecard'
import { saveScorecard } from '../../../lib/services'
import { rootRoute } from '../../../config/routes.config'
import { PageWrapper } from '../../../lib'

import { getEmptyScorecard } from './utils'
import { EditScorecardPageContextProvider } from './EditScorecardPage.context'
import ScorecardGroupForm, { scorecardGroupSchema } from './components/ScorecardGroupForm'
import ScorecardInfoForm, { scorecardInfoSchema } from './components/ScorecardInfoForm'
import styles from './EditScorecardPage.module.scss'

const EditScorecardPage: FC = () => {
    const navigate = useNavigate()
    const [isSaving, setSaving] = useState(false)
    const params = useParams()
    const isEditMode = !!params.scorecardId
    const scorecardQuery = useFetchScorecard(params.scorecardId, false)
    const title = useMemo(() => (
        `${isEditMode ? 'Edit' : 'Create'} Scorecard`
    ), [isEditMode])
    const breadCrumb = useMemo(
        () => [
            { index: 1, label: 'Scorecards', path: '..' },
            { index: 2, label: title },
        ],
        [title],
    )

    const editForm = useForm({
        defaultValues: getEmptyScorecard(),
        mode: 'all',
        resolver: yupResolver(yup.object({
            ...scorecardInfoSchema,
            ...(scorecardGroupSchema as unknown as any),
        })),
    })

    useEffect(() => {
        if (scorecardQuery.scorecard && !scorecardQuery.isValidating) {
            editForm.reset(scorecardQuery.scorecard)
        }
    }, [scorecardQuery.scorecard, scorecardQuery.isValidating])

    const handleSubmit = useCallback(async (value: any) => {
        setSaving(true)
        try {
            const response = await saveScorecard(value)
            toast.info('Scorecard saved successfully!')
            if (response.id && !params.scorecardId) {
                navigate(`${rootRoute}/scorecard/${response.id}`)
            }
        } catch (e: any) {
            toast.error(`Couldn't save scorecard! ${e.message}`)
            console.error('Couldn\'t save scorecard!', e)
        } finally {
            setSaving(false)
        }
    }, [params.scorecardId, navigate])

    if (scorecardQuery.isValidating) {
        return <></>
    }

    return (
        <EditScorecardPageContextProvider>
            <PageWrapper
                pageTitle={title}
                breadCrumb={breadCrumb}
            >
                <form className={styles.pageContentWrap} onSubmit={editForm.handleSubmit(handleSubmit)}>
                    <FormProvider {...editForm}>

                        <h3 className={styles.sectionTitle}>1. Scorecard Information</h3>
                        <ScorecardInfoForm />

                        <h3 className={styles.sectionTitle}>2. Evaluation Structure</h3>
                        <ScorecardGroupForm />

                        <div className={styles.bottomContainer}>
                            <hr />
                            <div className={styles.buttonsWrap}>
                                <LinkButton to='..' type='button' secondary uiv2>
                                    Cancel
                                </LinkButton>
                                <Button type='submit' primary disabled={isSaving || !editForm.formState.isDirty} uiv2>
                                    Save Scorecard
                                </Button>
                            </div>
                        </div>
                    </FormProvider>
                </form>
            </PageWrapper>
        </EditScorecardPageContextProvider>
    )
}

export default EditScorecardPage
