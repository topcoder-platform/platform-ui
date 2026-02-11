import { FC } from 'react'

import { FormTinyMceEditor } from '../../../../lib/components/form'

import styles from './ChallengeDescriptionField.module.scss'

const specificationTemplateLink = 'https://github.com/topcoder-platform-templates/specification-templates'

export const ChallengeDescriptionField: FC = () => (
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
        <FormTinyMceEditor
            label='Public Specification'
            name='description'
            required
        />
    </div>
)

export default ChallengeDescriptionField
