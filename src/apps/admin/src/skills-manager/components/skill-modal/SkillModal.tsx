import { FC, ReactNode, useCallback, useMemo, useState } from 'react'

import { BaseModal, Form, formGetInputModel, FormInputModel, FormValue, LoadingSpinner } from '~/libs/ui'

import { saveStandardizedSkill, StandardizedSkill, StandardizedSkillCategory } from '../../services'

import { skillFormDef, SkillFormField } from './skill-form.config'

interface SkillModalProps {
    skill: StandardizedSkill
    categories: StandardizedSkillCategory[]
    onClose: () => void
    onSave: () => void
}

const SkillModal: FC<SkillModalProps> = props => {
    const action = props.skill?.id ? 'edit' : 'add'

    const [loading, setLoading] = useState<boolean>(false)

    const generateRequest = useCallback((inputs: ReadonlyArray<FormInputModel>): FormValue => ({
        categoryId: formGetInputModel(inputs, SkillFormField.category).value as string,
        description: formGetInputModel(inputs, SkillFormField.description).value as string,
        id: props.skill.id as string,
        name: formGetInputModel(inputs, SkillFormField.name).value as string,
    }), [])

    const saveAsync = useCallback(async (request: FormValue): Promise<void> => {
        setLoading(true)

        return saveStandardizedSkill(request as unknown as StandardizedSkill)
            .then(() => {
                props.onSave.call(undefined)
                props.onClose.call(undefined)
            })
            .catch((e: any) => {
                setLoading(false)
                return Promise.reject(e)
            })
    }, [props.onClose, props.onSave])

    const formDef = useMemo(() => skillFormDef(
        props.onClose,
        props.categories,
    ), [props.categories, props.onClose])

    function renderForm(): ReactNode {
        return (
            <Form
                formDef={formDef}
                formValues={props.skill as unknown as FormValue}
                requestGenerator={generateRequest}
                save={saveAsync}
                resetFormOnUnmount
            />
        )
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={`${action} Skill`}
        >
            {renderForm()}
            <LoadingSpinner hide={!loading} overlay />
        </BaseModal>
    )
}

export default SkillModal
