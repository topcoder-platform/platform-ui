import { FC } from 'react'

import { ContentLayout, Form } from '../../lib'

import { workIntakeDef } from './work-intake-form.config'

export const toolTitle: string = 'Work'

const WorkIntake: FC<{}> = () => {

    function requestGenerator(): any { // TODO
        return {}
    }

    function save(): any { // TODO
        return {}
    }

    return (
        <ContentLayout title={toolTitle}>
            <Form
                formDef={workIntakeDef}
                requestGenerator={requestGenerator}
                resetOnError={false}
                save={save}
            />
        </ContentLayout>
    )
}

export default WorkIntake
