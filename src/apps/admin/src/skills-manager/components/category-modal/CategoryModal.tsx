import { ChangeEvent, FC, MutableRefObject, ReactNode, useCallback, useMemo, useRef, useState } from 'react'

import { BaseModal, Button, Form, FormInputModel, FormValue, InputText, InputTextarea, LoadingSpinner, formGetInputModel } from '~/libs/ui'

import { StandardizedSkillCategory, saveStandardizedSkillCategory } from '../../services'

import { categoryFormDef, CategoryFormField } from './category-form.config'
import styles from './CategoryModal.module.scss'

interface CategoryModalProps {
    category: StandardizedSkillCategory
    onClose: () => void
}

const CategoryModal: FC<CategoryModalProps> = props => {
    const action = props.category?.id ? 'edit' : 'add'

    const [loading, setLoading] = useState<boolean>(false)

    const generateRequest = useCallback((inputs: ReadonlyArray<FormInputModel>): FormValue => ({
        description: formGetInputModel(inputs, CategoryFormField.description).value as string,
        id: props.category.id as string,
        name: formGetInputModel(inputs, CategoryFormField.name).value as string,
    }), [])

    const saveAsync = useCallback(async (request: FormValue): Promise<void> => {
        setLoading(true)

        return saveStandardizedSkillCategory(request as unknown as StandardizedSkillCategory)
            .then((createdBadge: StandardizedSkillCategory) => {
                console.log('saved', createdBadge)

                props.onClose.call(undefined)
            })
    }, [props.onClose])

    const formDef = useMemo(() => ({
        ...categoryFormDef,
        buttons: {
            primaryGroup: categoryFormDef.buttons.primaryGroup.map(btn => ({
                ...btn,
                ...(btn.isSubmit ? {} : { onClick: props.onClose }),
            })),
        },
    }), [props.onClose])

    function renderForm(): ReactNode {
        return (
            <Form
                formDef={formDef}
                formValues={props.category as unknown as FormValue}
                requestGenerator={generateRequest}
                save={saveAsync}
            />
        )
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title={`${action} Category`}
        >
            {renderForm()}
            <LoadingSpinner hide={!loading} overlay />
        </BaseModal>
    )
}

export default CategoryModal
