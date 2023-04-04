import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal, Form, FormDefinition, formGetInputFields, FormInputModel, formOnReset } from '../../../../lib'
import { FormValue } from '../../../../lib/form/form-functions'
import { Challenge } from '../../work-lib'

import { workFeedbackFormDef } from './work-feedback-form.config'
import styles from './WorkFeedback.module.scss'

interface WorkFeedbackProps {
    // eslint-disable-next-line react/no-unused-prop-types
    challenge: Challenge
    onClose: () => void
    saveSurvey: (feedback: any) => void
    showSurvey: boolean
}

interface Feedback {
    name: string
    value: string | undefined
}

const WorkFeedback: FC<WorkFeedbackProps> = (props: WorkFeedbackProps) => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...workFeedbackFormDef })

    function requestGenerator(inputs: ReadonlyArray<FormInputModel>): Array<Feedback> {
        return inputs
            .map((input: FormInputModel) => ({
                name: input.instructions || input.label as string,
                value: input.value,
            } as Feedback))
    }

    async function saveAsync(feedback: FormValue): Promise<void> {
        props.saveSurvey(feedback)
        onClose()
    }

    function onClose(): void {
        const updatedForm: FormDefinition = { ...formDef }
        formOnReset(formGetInputFields(updatedForm.groups || []))
        setFormDef(updatedForm)
        props.onClose()
    }

    return (
        <BaseModal
            open={props.showSurvey}
            onClose={onClose}
            size='lg'
            title='How did we do?'
        >
            <div className={styles['form-wrapper']}>
                <Form
                    formDef={formDef}
                    requestGenerator={requestGenerator}
                    save={saveAsync}
                />
            </div>
        </BaseModal>
    )
}

export default WorkFeedback
