import { FC } from 'react'

import { BaseModal, IconOutline } from '~/libs/ui'

import styles from './PrincipalSkillsModal.module.scss'
import { MAX_PRINCIPAL_SKILLS_COUNT } from '../../../config'
import principalSectionImg from './principal-section.png'
import principalInputImg from './principal-input.png'

interface PrincipalSkillsModalProps {
    onClose: () => void
}

const PrincipalSkillsModal: FC<PrincipalSkillsModalProps> = (props: PrincipalSkillsModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        title='Highlight your Principal skills'
        size='lg'
    >
        <div className={styles.container}>
            <p>
                <div className={styles.mb1}>
                    Now you can highlight your most important skills using the&nbsp;
                    <strong>Principal skills</strong>
                    &nbsp;section!
                </div>
                <img src={principalSectionImg} alt="" />
            </p>
            <br />
            <p>
                <div className={styles.mb1}>
                    Just move the skills you want to highlight by typing them in the&nbsp;
                    <strong>principal skills input</strong>
                    &nbsp;when you edit your skills.
                </div>
                <img src={principalInputImg} alt="" />
            </p>
            <br />
            <p>
                <strong>NOTE:</strong>
                &nbsp;You can add up to {MAX_PRINCIPAL_SKILLS_COUNT} skills to your principal section.
            </p>
            <br />
            <p>
                To move a skill back to the <strong>additional section</strong>, just type it in the <strong>additional skills input</strong>.
            </p>
        </div>
    </BaseModal>
)

export default PrincipalSkillsModal
