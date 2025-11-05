import { FC } from 'react'

import { BaseModal } from '~/libs/ui'
import { AiWorkflow } from '~/apps/review/src/lib/hooks'
import { IconExternalLink } from '~/apps/review/src/lib/assets/icons'

import styles from './AiModelModal.module.scss'

interface AiModelModalProps {
    model: AiWorkflow['llm']
    onClose: () => void
}

const AiModelModal: FC<AiModelModalProps> = props => (
    <BaseModal
        spacer={false}
        open
        blockScroll
        onClose={props.onClose}
        size='lg'
    >
        <div className={styles.wrap}>
            <div className={styles.modelNameWrap}>
                <div className={styles.modelIcon}>
                    <img src={props.model.icon} alt={props.model.name} />
                </div>
                <div className={styles.modelName}>
                    <h3>{props.model.name}</h3>
                    <a href={props.model.url} target='_blank' rel='noreferrer'>
                        <IconExternalLink />
                    </a>
                </div>
            </div>

            <p className={styles.modelDescription}>
                {props.model.description}
            </p>
        </div>
    </BaseModal>
)

export default AiModelModal
