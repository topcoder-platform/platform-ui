import { Dispatch, FocusEvent, FormEvent, SetStateAction, useState } from 'react'

import { Button } from '../button'
import '../styles/index.scss'

import { FormDefinition } from './form-definition.model'
import {
    FormErrorMessage,
    formGetInputModel,
    formInitializeValues,
    formReset,
    formSubmitAsync,
    formValidateAndUpdateAsync,
} from './form-functions'
import { InputText, InputTextarea } from './form-input'
import { FormInputModel } from './form-input.model'
import styles from './Form.module.scss'

interface FormProps<ValueType, RequestType> {
    readonly formDef: FormDefinition
    readonly formValues?: ValueType
    readonly requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => RequestType
    readonly resetOnError: boolean
    readonly save: (value: RequestType) => Promise<void>
}

const Form: <ValueType extends any, RequestType extends any>(props: FormProps<ValueType, RequestType>) => JSX.Element
    = <ValueType extends any, RequestType extends any>(props: FormProps<ValueType, RequestType>) => {

        const [disableSave, setDisableSave]: [boolean, Dispatch<SetStateAction<boolean>>]
            = useState<boolean>(true)

        const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
            = useState<FormDefinition>({ ...props.formDef })

        const [formKey, setFormKey]: [number, Dispatch<SetStateAction<number>>]
            = useState<number>(Date.now())

        async function onBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): Promise<void> {
            const inputDef: FormInputModel = formGetInputModel(props.formDef.inputs, event.target.name)
            inputDef.validateOnBlur
                ?.forEach(async validator => {
                    if (!inputDef.error) {
                        inputDef.error = await validator(event.target.value, event.target.form?.elements, inputDef.dependentField)
                        setFormDef({ ...formDef })
                    }
                })
        }

        async function onChange(event: FormEvent<HTMLFormElement>): Promise<void> {
            const isValid: boolean = await formValidateAndUpdateAsync(event, formDef.inputs)
            setFormDef({ ...formDef })
            setDisableSave(!isValid)
        }

        function onFocus(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
            const inputDef: FormInputModel = formGetInputModel(props.formDef.inputs, event.target.name)
            inputDef.dirtyOrTouched = true
            setFormDef({ ...formDef })
        }

        function onReset(): void {
            setFormDef({ ...formDef })
            formReset(props.formDef.inputs, props.formValues)
            setFormKey(Date.now())
        }

        async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
            const values: RequestType = props.requestGenerator(formDef.inputs)
            formSubmitAsync<RequestType, void>(event, formDef.inputs, props.formDef.title, values, props.save, setDisableSave)
                .then(() => {
                    setFormKey(Date.now())
                    formReset(formDef.inputs, props.formValues)
                    setFormDef({ ...formDef })
                })
                .catch((error: FormErrorMessage) => {
                    // only reset on save errors
                    if (props.resetOnError && error === FormErrorMessage.save) {
                        formReset(formDef.inputs, props.formValues)
                        setFormKey(Date.now())
                    }
                    setFormDef({ ...formDef })
                })
        }

        formInitializeValues(formDef.inputs, props.formValues)

        const formInputs: Array<JSX.Element> = props.formDef.inputs
            .map(input => formGetInputModel(props.formDef.inputs, input.name))
            .map((inputModel, index) => {
                switch (inputModel.type) {
                    case 'textarea':
                        return (
                            <InputTextarea
                                {...inputModel}
                                key={inputModel.name}
                                onBlur={onBlur}
                                onFocus={onFocus}
                                tabIndex={inputModel.notTabbable ? -1 : index + 1}
                                value={inputModel.value}
                            />
                        )
                    default:
                        return (
                            <InputText
                                {...inputModel}
                                key={inputModel.name}
                                onBlur={onBlur}
                                onFocus={onFocus}
                                tabIndex={inputModel.notTabbable ? -1 : index + 1}
                                type={inputModel.type || 'text'}
                                value={inputModel.value}
                            />
                        )
                }

            })

        const buttons: Array<JSX.Element> = props.formDef.buttons
            .map((button, index) => {
                // if this is a reset button, set its onclick to reset
                if (!!button.isReset) {
                    button = {
                        ...button,
                        onClick: onReset,
                    }
                }
                return (
                    <Button
                        {...button}
                        disable={button.isSave && disableSave}
                        key={button.label}
                        tabIndex={button.notTabble ? -1 : index + props.formDef.inputs.length}
                    />
                )
            })

        return (
            <form
                action={''}
                key={formKey}
                onChange={onChange}
                onSubmit={onSubmit}
            >

                <h2>{props.formDef.title}</h2>

                <div className={styles['form-fields']}>
                    {formInputs}
                </div>

                <div className='button-container'>
                    {buttons}
                </div>

            </form>
        )
    }

export default Form
