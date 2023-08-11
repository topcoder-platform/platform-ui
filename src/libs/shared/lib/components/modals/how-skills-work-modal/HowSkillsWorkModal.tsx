import { FC } from 'react'

import { BaseModal, IconOutline } from '~/libs/ui'

import styles from './HowSkillsWorkModal.module.scss'

interface HowSkillsWorkModalProps {
    onClose: () => void
    isTalentSearch?: boolean
    iseSelfView?: boolean
}

const HowSkillsWorkModal: FC<HowSkillsWorkModalProps> = (props: HowSkillsWorkModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        title='How Skills Work'
        size='lg'
    >
        {!!props.iseSelfView && (
            <div className={styles.container}>
                <p className='body-large-bold'>
                    Topcoder Proven Skills
                </p>
                <p className={styles.checkIconRow}>
                    Look for the proven
                    <IconOutline.CheckCircleIcon />
                    next to skills.
                </p>
                <p>Here’s how it works:</p>
                <ul>
                    <li>You perform specific Topcoder opportunities</li>
                    <li>Each opportunity has associated skills (ex: javascript, HTML)</li>
                    <li>
                        You can prove you are proficient in these skills
                        by completing opportunities on the platform
                    </li>
                    <li>Topcoder tracks and labels these skills, displaying what skills have been proven</li>
                    <li>The more opportunities you complete the higher you rate for associated skills</li>
                </ul>
                <p>
                    You can also self-select skills that have not yet been proven.
                    These will display as skills without a checkmark.
                </p>
            </div>
        )}

        {!props.iseSelfView && props.isTalentSearch && (
            <div className={styles.container}>
                <p className='body-large-bold'>
                    Topcoder Skill Matching
                </p>
                <p>Topcoder identifies experts that will best match the skills you are searching for.</p>
                <p className={styles.checkIconRow}>
                    Look for the proven
                    <IconOutline.CheckCircleIcon />
                    next to skills.
                </p>
                <p>Here’s how it works:</p>
                <ul>
                    <li>Experts perform specific Topcoder opportunities</li>
                    <li>Each task has associated skills (ex: javascript, HTML)</li>
                    <li>
                        Experts prove they are proficient in these skills
                        by completing opportunities on the platform
                    </li>
                    <li>Topcoder tracks and labels these skills, displaying what skills have been proven</li>
                    <li>The more opportunities our experts complete the higher they rate for associated skills</li>
                </ul>
                <p>
                    Experts can also self-proclaim skills that have not yet been proven.
                    These will display as skills without a checkmark.
                </p>
            </div>
        )}

        {!props.iseSelfView && !props.isTalentSearch && (
            <div className={styles.container}>
                <p className='body-large-bold'>
                    Topcoder Proven Skills
                </p>
                <p>Our experts work hard to prove their skills through Topcoder opportunities.</p>
                <p className={styles.checkIconRow}>
                    Look for the proven
                    <IconOutline.CheckCircleIcon />
                    next to skills.
                </p>
                <p>Here’s how it works:</p>
                <ul>
                    <li>Experts perform specific Topcoder opportunities</li>
                    <li>Each opportunity has associated skills (ex: javascript, HTML)</li>
                    <li>
                        Experts prove they are proficient in these skills
                        by completing opportunities on the platform
                    </li>
                    <li>Topcoder tracks and labels these skills, displaying what skills have been proven</li>
                    <li>The more opportunities our experts complete the higher they rate for associated skills</li>
                </ul>
                <p>
                    Experts can also self-select skills that have not yet been proven.
                    These will display as skills without a checkmark.
                </p>
            </div>
        )}
    </BaseModal>
)

export default HowSkillsWorkModal
