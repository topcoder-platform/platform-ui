import { FC } from 'react'

import { ActiveMemberActivity, ActiveMembersDashboard } from '../../lib/services'

import { formatDashboardMonth } from './dashboard.utils'
import styles from './ActiveMembersDetails.module.scss'

const activityLabels: Record<ActiveMemberActivity['activity'], string> = {
    'challenge-registration': 'Challenge registration',
    'engagement-acceptance': 'Engagement accepted',
    'engagement-application': 'Engagement application',
    payment: 'Payment received',
}

/**
 * Shows monthly unique-member totals followed by all member activities, newest first.
 * @param props Active-members response for the selected UTC reporting range.
 * @returns Accessible monthly activity tables, including explicit empty months.
 * @throws Does not throw for a valid dashboard response.
 */
export const ActiveMembersDetails: FC<{ response: ActiveMembersDashboard }> = props => (
    <section aria-label='Monthly member activity' className={styles.details}>
        <h2>Member Activity</h2>
        {[...props.response.months].reverse()
            .map(month => (
                <section className={styles.month} key={month.month}>
                    <h3>
                        {formatDashboardMonth(month.month)}
                        {' — '}
                        {month.totalUniqueMembers.toLocaleString('en-US')}
                        {' active members'}
                    </h3>
                    {month.activities.length ? (
                        <div className={styles.tableScroll}>
                            <table>
                                <caption className={styles.caption}>
                                    {formatDashboardMonth(month.month)}
                                    {' member activity, newest first'}
                                </caption>
                                <thead>
                                    <tr>
                                        <th scope='col'>Date (UTC)</th>
                                        <th scope='col'>Member</th>
                                        <th scope='col'>Activity</th>
                                        <th scope='col'>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {month.activities.map(activity => (
                                        <tr key={activity.id}>
                                            <td>
                                                <time dateTime={activity.date}>
                                                    {activity.date.slice(0, 19)
                                                        .replace('T', ' ')}
                                                </time>
                                            </td>
                                            <td>{activity.handle}</td>
                                            <td>{activityLabels[activity.activity]}</td>
                                            <td>{activity.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p>No member activity for this month.</p>}
                </section>
            ))}
    </section>
)
