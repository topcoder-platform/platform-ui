import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import { EngagementsView } from '../components/EngagementsView'
import { MembersView } from '../components/MembersView'

import styles from './FlexiTalentPage.module.scss'

type FlexiTalentInnerView = 'engagements' | 'members'

/**
 * Flexi-Talent route shell.
 *
 * The shell owns only the local inner-view switcher so Engagements and Members
 * stay mounted while users switch between them, preserving each view's local
 * state until the user leaves the top-level `/flexi-talent` route.
 */
export const FlexiTalentPage: FC = () => {
    const [activeInnerView, setActiveInnerView] = useState<FlexiTalentInnerView>('engagements')

    const handleEngagementsClick = useCallback((): void => {
        setActiveInnerView('engagements')
    }, [])

    const handleMembersClick = useCallback((): void => {
        setActiveInnerView('members')
    }, [])

    const rightHeader = (
        <div className={styles.viewSwitcher} role='tablist' aria-label='Flexi-Talent views'>
            <button
                aria-selected={activeInnerView === 'engagements'}
                className={classNames(
                    styles.viewSwitcherButton,
                    activeInnerView === 'engagements' && styles.viewSwitcherButtonActive,
                )}
                onClick={handleEngagementsClick}
                role='tab'
                type='button'
            >
                Engagements
            </button>
            <button
                aria-selected={activeInnerView === 'members'}
                className={classNames(
                    styles.viewSwitcherButton,
                    activeInnerView === 'members' && styles.viewSwitcherButtonActive,
                )}
                onClick={handleMembersClick}
                role='tab'
                type='button'
            >
                Members
            </button>
        </div>
    )

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h3 className={styles.titleText}>Flexi-Talent</h3>
                </div>
                {rightHeader}
                {/* <div className={styles.headerRight}>
                </div> */}
            </div>
            <p className={styles.subtitle}>
                Monitor Flexi-Talent engagement coverage, assignment status, and Work links in one place.
            </p>
            <div className={styles.viewStack}>
                <section
                    aria-hidden={activeInnerView !== 'engagements'}
                    className={classNames(
                        styles.viewPanel,
                        activeInnerView === 'engagements' ? styles.viewVisible : styles.viewHidden,
                    )}
                >
                    <EngagementsView />
                </section>
                <section
                    aria-hidden={activeInnerView !== 'members'}
                    className={classNames(
                        styles.viewPanel,
                        activeInnerView === 'members' ? styles.viewVisible : styles.viewHidden,
                    )}
                >
                    <MembersView isActive={activeInnerView === 'members'} />
                </section>
            </div>
        </div>
    )
}

export default FlexiTalentPage
