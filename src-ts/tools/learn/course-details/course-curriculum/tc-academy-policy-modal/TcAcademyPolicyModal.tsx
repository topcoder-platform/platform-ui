import { FC } from 'react'

import { BaseModal, Button } from '../../../../../lib'

import styles from './TcAcademyPolicyModal.module.scss'

export interface TcAcademyPolicyModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

const TcAcademyPolicyModal: FC<TcAcademyPolicyModalProps> = (props: TcAcademyPolicyModalProps) => {
    
    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isOpen}
            size='lg'
            title='please accept our academic policy'
        >
            <div className={styles.container}>
                <p>
                    Before you can claim a verified certification, you must accept our Academic Honesty Pledge, which reads:
                </p>
    
                <p>
                    "I understand that plagiarism means copying someone else’s work and presenting the work as if it were my own,
                    without clearly attributing the original author."
                </p>
    
                <p>
                    "I understand that plagiarism is an act of intellectual dishonesty, and that people usually get kicked out of
                    Academy or fired from their jobs if they get caught plagiarizing."
                </p>
    
                <p>
                    "Aside from using open source libraries such as jQuery and Bootstrap, and short snippets of code which are clearly
                    attributed to their original author, 100% of the code in my projects was written by me, or along with another
                    person going through the freeCodeCamp curriculum with whom I was pair programming in real time."
                </p>
    
                <p>
                    "I pledge that I did not plagiarize any of my freeCodeCamp.org work. I understand that freeCodeCamp.org's team
                    will audit my projects to confirm this."
                </p>
    
                <p>
                    In the situations where we discover instances of unambiguous plagiarism, we will replace the person in question's
                    certification with a message that "Upon review, this account has been flagged for academic dishonesty."
                </p>
    
                <p>
                    As an academic institution that grants achievement-based certifications, we take academic honesty very seriously.
                    If you have any questions about this policy, or suspect that someone has violated it, you can email team@freecodecamp.org
                    and we will investigate.
                </p>
            </div>
    
            <div className='button-container'>
                <Button
                    buttonStyle='primary'
                    label={'I Agree'}
                    onClick={props.onConfirm}
                    tabIndex={2}
                    size='lg'
                />
            </div>
        </BaseModal>
    )
}

export default TcAcademyPolicyModal
