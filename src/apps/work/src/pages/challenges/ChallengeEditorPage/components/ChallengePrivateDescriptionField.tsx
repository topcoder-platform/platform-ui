import {
    FC,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { useFormContext } from 'react-hook-form'

import { Button } from '~/libs/ui'

import { FormTinyMceEditor } from '../../../../lib/components/form'

import styles from './ChallengePrivateDescriptionField.module.scss'

const specificationTemplateLink = 'https://github.com/topcoder-platform-templates/specification-templates'

export const ChallengePrivateDescriptionField: FC = () => {
    const formContext = useFormContext()
    const privateDescription = formContext.watch('privateDescription') as string | undefined
    const [isVisible, setIsVisible] = useState<boolean>(!!privateDescription)
    const handleShowPrivateDescription = useCallback((): void => {
        setIsVisible(true)
    }, [])

    useEffect(() => {
        if (privateDescription?.trim()) {
            setIsVisible(true)
        }
    }, [privateDescription])

    if (!isVisible) {
        return (
            <div className={styles.addButtonWrapper}>
                <Button
                    label='Add private specification'
                    onClick={handleShowPrivateDescription}
                    secondary
                    size='lg'
                />
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.infoRow}>
                <a
                    href={specificationTemplateLink}
                    rel='noreferrer'
                    target='_blank'
                >
                    Access specification templates
                </a>
                <p>
                    This text will only be visible to Topcoder members that have
                    registered for this challenge.
                </p>
            </div>

            <FormTinyMceEditor
                label='Private Specification'
                name='privateDescription'
            />
        </div>
    )
}

export default ChallengePrivateDescriptionField
