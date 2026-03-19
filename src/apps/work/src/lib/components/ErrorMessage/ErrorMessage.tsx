import { FC } from 'react'

import { Button } from '~/libs/ui'

import styles from './ErrorMessage.module.scss'

interface ErrorMessageProps {
    message: string
    onRetry?: () => void
}

export const ErrorMessage: FC<ErrorMessageProps> = (props: ErrorMessageProps) => (
    <div className={styles.container}>
        <p className={styles.message}>{props.message}</p>
        {props.onRetry
            ? (
                <Button
                    label='Retry'
                    onClick={props.onRetry}
                    secondary
                    size='lg'
                />
            )
            : undefined}
    </div>
)

export default ErrorMessage
