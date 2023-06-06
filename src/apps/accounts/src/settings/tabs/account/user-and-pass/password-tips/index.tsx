import { FC } from 'react'

import styles from './PasswordTips.module.scss'

type PasswordTip = { text: string, valid: boolean }

interface PasswordTipsProps {
    infoText: string
    tips: Array<PasswordTip>
}

const PasswordTips: FC<PasswordTipsProps> = (props: PasswordTipsProps) => (
    <div className={styles.container}>
        <p className={styles.infoText}>{props.infoText}</p>
        {
            props.tips.map((tip: PasswordTip) => (
                <p className={styles.tip}>{tip.text}</p>
            ))
        }
    </div>
)

export default PasswordTips
