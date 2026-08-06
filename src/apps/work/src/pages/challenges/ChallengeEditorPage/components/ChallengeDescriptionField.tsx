import {
    FC,
    KeyboardEvent,
    useCallback,
} from 'react'
import {
    useFormContext,
    UseFormReturn,
} from 'react-hook-form'

import { copyTextToClipboard } from '~/libs/shared'

import { FormMarkdownEditor } from '../../../../lib/components/form'
import type { ChallengeEditorFormData } from '../../../../lib/models'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../../lib/utils'

import styles from './ChallengeDescriptionField.module.scss'

const specificationTemplateLink = 'https://github.com/topcoder-platform-templates/specification-templates'

export interface ChallengeDescriptionFieldProps {
    readOnly?: boolean
}

export const ChallengeDescriptionField: FC<ChallengeDescriptionFieldProps> = (
    props: ChallengeDescriptionFieldProps,
) => {
    const formContext: UseFormReturn<ChallengeEditorFormData> = useFormContext<ChallengeEditorFormData>()
    const getValues = formContext.getValues

    /**
     * Copies the current public specification Markdown and reports whether the copy succeeded.
     *
     * @returns A promise that resolves after the clipboard operation and user feedback complete.
     * Copy failures are handled with an error toast and are not rethrown.
     */
    const handleCopySpec = useCallback(async (): Promise<void> => {
        const description = getValues('description')
        const specification = typeof description === 'string'
            ? description
            : ''

        try {
            await copyTextToClipboard(specification)
            showSuccessToast('Specification copied to clipboard.')
        } catch {
            showErrorToast('Failed to copy specification.')
        }
    }, [getValues])

    /**
     * Activates the copy action with the keyboard while preserving button semantics.
     *
     * @param event Keyboard event raised by the link-styled copy control.
     * @returns void. Keys other than Enter or Space are ignored.
     */
    const handleCopySpecKeyDown = useCallback((event: KeyboardEvent<HTMLSpanElement>): void => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return
        }

        event.preventDefault()
        handleCopySpec()
            .catch(() => undefined)
    }, [handleCopySpec])

    return (
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
            <div className={styles.editor}>
                <span
                    className={styles.copySpecLink}
                    onClick={handleCopySpec}
                    onKeyDown={handleCopySpecKeyDown}
                    role='button'
                    tabIndex={0}
                >
                    Copy spec
                </span>
                <FormMarkdownEditor
                    label='Public Specification'
                    name='description'
                    readOnly={props.readOnly}
                    required
                />
            </div>
        </div>
    )
}

export default ChallengeDescriptionField
