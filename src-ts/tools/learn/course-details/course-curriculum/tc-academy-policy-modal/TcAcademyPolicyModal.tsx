import { Dispatch, FC, SetStateAction, useState } from 'react'

import { BaseModal, Button } from '../../../../../lib'

import styles from './TcAcademyPolicyModal.module.scss'

export interface TcAcademyPolicyModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

const TcAcademyPolicyModal: FC<TcAcademyPolicyModalProps> = (props: TcAcademyPolicyModalProps) => {
    const [loading, setLoading]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const handleConfirm: () => void = () => {
        if (loading) {
            return
        }

        setLoading(true)
        props.onConfirm()
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open={props.isOpen}
            size='lg'
            title='please accept our academic policy'
        >
            <div className={styles.container}>
                <p>
                    Before you can claim a verified certification, you must accept our
                    Academic Honesty Pledge, which reads:
                </p>
                <p>
                    "I understand that plagiarism means copying someone else's work and
                    presenting the work as if it were my own, without clearly attributing
                    the original author."
                </p>
                <p>
                    "I understand that plagiarism is an act of intellectual dishonesty,
                    and that people usually get kicked out of their learning institution
                    or fired from their jobs if they get caught plagiarizing."
                </p>
                <p>
                    "Aside from using open source libraries such as jQuery and Bootstrap,
                    and short snippets of code which are clearly attributed to their original
                    author, 100% of the code in my projects was written by me, or along with
                    another person going through the Topcoder Academy or freeCodeCamp
                    curriculum, with whom I was pair programming in real time."
                </p>
                <p>
                    "I pledge that I did not plagiarize any of my work. I understand that
                    the Topcoder team will audit my projects to confirm this."
                </p>
                <p>
                    As an organization which grants achievement-based certifications, we
                    take academic honesty very seriously. If you have any questions about
                    this policy, or suspect that someone has violated it, you can email
                    &nbsp;
                    <a href='mailto:support@topcoder.com?subject=Topcoder Academic Honesty Policy'>
                        support@topcoder.com
                    </a> and we will investigate.
                </p>
            </div>
            <hr />
            <div className='button-container'>
                <Button
                    buttonStyle='primary'
                    label="I Agree"
                    onClick={handleConfirm}
                    tabIndex={2}
                    size='lg'
                    disable={loading}
                />
            </div>
        </BaseModal>
    )
}

export default TcAcademyPolicyModal
