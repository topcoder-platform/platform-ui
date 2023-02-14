import { FC, ReactNode } from 'react'

import {
    Form,
    UserProfile,
} from '../../../../../lib'

import {
    enrollmentFormDef,
    EnrollmentFormValue,
    generateEnrollmentFormRequest,
} from './enrollment-form.config'


interface EnrollmentFormProps {
    children?: ReactNode
    onSubmit: (value?: EnrollmentFormValue) => Promise<void>
    profile?: UserProfile
}

const EnrollmentForm: FC<EnrollmentFormProps> = (props: EnrollmentFormProps) => (
    <Form
        formDef={enrollmentFormDef}
        formValues={props.profile ?? {}}
        save={props.onSubmit}
        onSuccess={props.onSubmit}
        requestGenerator={generateEnrollmentFormRequest}
    >
        {props.children}
    </Form>
)

export default EnrollmentForm
