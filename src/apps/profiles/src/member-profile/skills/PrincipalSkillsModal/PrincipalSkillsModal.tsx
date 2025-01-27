import { FC } from 'react'

import { BaseModal } from '~/libs/ui'

import { MAX_PRINCIPAL_SKILLS_COUNT } from '../../../config'

import principalInputImg from './principal-input.png'
import principalSectionImg from './principal-section.png'
import styles from './PrincipalSkillsModal.module.scss'

interface PrincipalSkillsModalProps {
    onClose: () => void
}

const PrincipalSkillsModal: FC<PrincipalSkillsModalProps> = (props: PrincipalSkillsModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        title='Highlight your Principal Skills'
        size='lg'
    >
        <div className={styles.container}>
            <p>
                <div className={styles.mb1}>
                    Now you can highlight your most important skills using the&nbsp;
                    <strong>Principal Skills</strong>
                    &nbsp;section!
                </div>
                <img src={principalSectionImg} alt='' />
            </p>
            <br />
            <p>
                <div className={styles.mb1}>
                    Just move the skills you want to highlight by typing them in the&nbsp;
                    <strong>Principal Skills input</strong>
                    &nbsp;when you edit your skills.
                </div>
                <img src={principalInputImg} alt='' />
            </p>
            <br />
            <p>
                <strong>NOTE:</strong>
                &nbsp;You can add up to
                {' '}
                {MAX_PRINCIPAL_SKILLS_COUNT}
                {' '}
                skills to your Principal Skills section.
            </p>
            <br />
            <p>
                To move a skill back to the
                {' '}
                <strong>Additional Skills section</strong>
                , just type it in the
                {' '}
                <strong>Additional Skills input</strong>
                .
            </p>
        </div>
    </BaseModal>
)

export default PrincipalSkillsModal
