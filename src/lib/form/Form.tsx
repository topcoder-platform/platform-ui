import { Dispatch, FormEvent, SetStateAction, useState } from 'react'

import { Button } from '../button'
import '../styles/index.scss'

import { FormDefinition } from './form-definition.model'
import {
    FormErrorMessage,
    formGetInputModel,
    formInitializeValues,
    formReset,
    formSubmitAsync,
    formValidateAndUpdate,
} from './form-functions'
import { FormInputModel } from './form-input.model'
import styles from './Form.module.scss'
import { TextInput } from './text-input'

interface FormProps<ValueType, RequestType> {
    readonly formDef: FormDefinition
    readonly formValues?: ValueType
    readonly requestGenerator: (inputs: Array<FormInputModel>) => RequestType
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

        function onChange(event: FormEvent<HTMLFormElement>): void {
            const isValid: boolean = formValidateAndUpdate(event, formDef.inputs)
            setFormDef({ ...formDef })
            setDisableSave(!isValid)
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
            .sort((a, b) => a.order - b.order)
            .map(input => formGetInputModel(props.formDef.inputs, input.name))
            .map(inputModel => {
                return (
                    <TextInput
                        {...inputModel}
                        key={inputModel.name}
                        tabIndex={inputModel.tabIndex}
                        type={inputModel.type || 'text'}
                        value={inputModel.value}
                    />
                )
            })

        const buttons: Array<JSX.Element> = props.formDef.buttons
            .sort((a, b) => a.order - b.order)
            .map(button => {
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
                        disable={disableSave}
                        key={button.label}
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

                <h6>{props.formDef.title}</h6>

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
