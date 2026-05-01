import { FC } from 'react'

import { FormMarkdownEditor } from '../../../../lib/components/form'

import styles from './ChallengeDescriptionField.module.scss'

const specificationTemplateLink = 'https://github.com/topcoder-platform-templates/specification-templates'

export interface ChallengeDescriptionFieldProps {
    readOnly?: boolean
}

export const ChallengeDescriptionField: FC<ChallengeDescriptionFieldProps> = (
    props: ChallengeDescriptionFieldProps,
) => (
    <div className={styles.container}>
        <p className={styles.templateLink}>
            Access specification templates
            {' '}
            <a
                href={specificationTemplateLink}
                rel='noreferrer'
                target='_blank'
            >
                here
            </a>
            .
        </p>
        <FormMarkdownEditor
            label='Public Specification'
            name='description'
            readOnly={props.readOnly}
            required
        />
    </div>
)

export default ChallengeDescriptionField
