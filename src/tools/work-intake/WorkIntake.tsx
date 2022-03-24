import { FC } from 'react'

import { ContentLayout, Form } from '../../lib'

import { workIntakeDef } from './work-intake-form.config'
import styles from './WorkIntake.module.scss'

export const toolTitle: string = 'Work'

const WorkIntake: FC<{}> = () => {

    function requestGenerator(): any { // TODO
        return {}
    }

    function save(): any { // TODO
        return {}
    }

    return (
        <ContentLayout classNames={styles['work-intake']} title={toolTitle}>
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
