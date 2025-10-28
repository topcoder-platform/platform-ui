import { FC } from 'react'
import classNames from 'classnames'

import styles from './ProgressBar.module.scss'

interface Props {
    progress?: number
    progressWidth?: string
    withoutPercentage?: boolean
}

export const ProgressBar: FC<Props> = (props: Props) => {
    const progressProps: React.CSSProperties & { '--progress': number } = {
        '--progress': props.progress ? props.progress / 100 : 0,
    }
    return (
        <div className={classNames(styles.container)} style={progressProps}>
            <div
                className={styles.progress}
                style={{ width: props.progressWidth }}
            >
                <div className={styles.inner} />
            </div>
            {props.withoutPercentage ? undefined : (
                <div className={styles.percentage}>
                    {Number(props.progress ?? 0)
                        .toFixed(0)}
                    %
                </div>
            )}
        </div>
    )
}

export default ProgressBar
