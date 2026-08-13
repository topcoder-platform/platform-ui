import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import { ChallengeOpportunity } from '../models'

import styles from './ChallengeSidebar.module.scss'

interface ChallengeSidebarProps {
    challenge: ChallengeOpportunity
    onContactTeam: () => void
    onShowTerms: () => void
}

interface SidebarCardProps {
    children: ReactNode
    icon: ReactNode
    title: string
}

/**
 * Renders one reusable challenge right-rail card.
 *
 * @param props card icon, title, and body content.
 * @returns a styled sidebar section.
 * @throws Does not throw.
 */
const SidebarCard: FC<SidebarCardProps> = props => (
    <section className={styles.card}>
        <h3>
            {props.icon}
            {props.title}
        </h3>
        {props.children}
    </section>
)

/**
 * Renders the challenge-details support column, including Review App, learning,
 * submission guidance, challenge terms, source files, and team contact.
 *
 * @param props challenge context and modal actions.
 * @returns Figma right rail cards.
 * @throws Does not throw.
 */
export const ChallengeSidebar: FC<ChallengeSidebarProps> = props => (
    <aside className={styles.sidebar}>
        <section className={styles.promo}>
            <div className={styles.promoArt} aria-hidden='true'>AI</div>
            <h3>Join the AI Exponential league</h3>
            <p>Advance your skills and compete in AI-focused opportunities.</p>
            <Link to='/thrive'>Explore the league</Link>
        </section>
        <SidebarCard icon={<IconOutline.ClipboardCheckIcon />} title='Review App'>
            <p>See your review status and feedback for this competition.</p>
            <Link to={`/review/active-challenges/${props.challenge.id}/challenge-details`}>
                View Review App
                <IconOutline.ArrowRightIcon />
            </Link>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.BookOpenIcon />} title='Educational Materials'>
            <p>Read educational material in Topcoder Thrive.</p>
            <Link to='/thrive/search'>Topcoder Challenge Explained</Link>
            <Link to='/thrive/tracks'>How to Compete in Design Challenges</Link>
            <Link to='/thrive/search'>How to Approach the Checkpoint Feed</Link>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.DocumentTextIcon />} title='Submission Format'>
            <ol>
                <li>Review the requirements and package your source files.</li>
                <li>Include the requested documentation and declarations.</li>
                <li>Upload one ZIP file before the active phase closes.</li>
            </ol>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.ColorSwatchIcon />} title='Fonts, Stock Photos, and Icons'>
            <p>Declare any third-party assets and include their licensing details.</p>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.ShieldCheckIcon />} title='Screening'>
            <p>Submissions are screened for viruses, requirements, and policy compliance.</p>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.ScaleIcon />} title='Challenge Terms'>
            <button onClick={props.onShowTerms} type='button'>Review challenge terms</button>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.FolderOpenIcon />} title='Source Files'>
            <p>Any available source files are linked from the Requirements content.</p>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.UploadIcon />} title='Submission Limit'>
            <p>Unlimited unless the challenge specification says otherwise.</p>
        </SidebarCard>
        <SidebarCard icon={<IconOutline.QuestionMarkCircleIcon />} title='Need help?'>
            <p>If you are having technical difficulties, contact the challenge team.</p>
            <button onClick={props.onContactTeam} type='button'>Contact the team</button>
        </SidebarCard>
    </aside>
)
