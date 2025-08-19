import * as yup from 'yup';
import { FC, useCallback, useEffect } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'

import styles from './EditScorecardPage.module.scss'
import { FormProvider, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { useFetchScorecard } from '../../../lib/hooks/useFetchScorecard'
import ScorecardInfoForm, { scorecardInfoSchema } from './components/ScorecardInfoForm'
import ScorecardGroupForm, { scorecardGroupSchema } from './components/ScorecardGroupForm'
import { getEmptyScorecard } from './utils'
import { EditScorecardPageContextProvider } from './EditScorecardPage.context'
import { Button } from '~/libs/ui'
import { saveScorecard } from '../../../lib/services'

interface EditScorecardPageProps {
}

const EditScorecardPage: FC<EditScorecardPageProps> = props => {
    const params = useParams();
    const isEditMode = !!params.scorecardId;
    const scorecardQuery = useFetchScorecard(params.scorecardId)

    const editForm = useForm({
        defaultValues: getEmptyScorecard(),
        mode: 'all',
        resolver: yupResolver(yup.object({
            ...scorecardInfoSchema,
            ...(scorecardGroupSchema as unknown as any),
        })),
    });

    console.log('here12', yup.object({
            ...scorecardInfoSchema,
            ...(scorecardGroupSchema as unknown as any),
        }));


    useEffect(() => {
      if (scorecardQuery.scorecard && !scorecardQuery.isValidating) {
        editForm.reset(scorecardQuery.scorecard)
      }
    }, [scorecardQuery.scorecard, scorecardQuery.isValidating]);

    const handleSubmit = useCallback(async (value: any) => {
      console.log(value)
      return saveScorecard(value);
    }, []);

    if (scorecardQuery.isValidating) {
        return null;
    }

    return (
        <EditScorecardPageContextProvider>
            <h2 className={styles.pageTitle}>{isEditMode ? 'Edit' : 'Create'} Scorecard</h2>

            <form className={styles.pageContentWrap} onSubmit={editForm.handleSubmit(handleSubmit)}>
                <FormProvider {...editForm}>

                    <h3 className={styles.sectionTitle}>1. Scorecard Information</h3>
                    <ScorecardInfoForm />

                    <h3 className={styles.sectionTitle}>2. Evaluation Structure</h3>
                    <ScorecardGroupForm />

                    <div className={styles.bottomContainer}>
                        <hr />
                        <div className={styles.buttonsWrap}>
                            <Button type='button' secondary>
                                Cancel
                            </Button>
                            <Button type='submit' primary>
                                Save Scorecard
                            </Button>
                        </div>
                    </div>
                </FormProvider>
            </form>
        </EditScorecardPageContextProvider>
    )
}

export default EditScorecardPage
