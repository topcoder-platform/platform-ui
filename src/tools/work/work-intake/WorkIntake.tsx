import { FC } from 'react'

import { Form } from '../../../lib'

import { workIntakeDef } from './work-intake-form.config'

const WorkIntake: FC<{}> = () => {

    function requestGenerator(): any { // TODO
        return {}
    }

    function save(): any { // TODO
        return {}
    }

    return (
        <Form
            formDef={workIntakeDef}
            requestGenerator={requestGenerator}
            resetOnError={false}
            save={save}
        />
    )
}

export default WorkIntake
