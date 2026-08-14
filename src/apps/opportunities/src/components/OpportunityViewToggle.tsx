/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import { FC } from 'react'

import { OpportunityView } from '../models'

import { ReactComponent as GridActiveIcon } from '../assets/view-grid-active.svg'
import { ReactComponent as GridInactiveIcon } from '../assets/view-grid-inactive.svg'
import { ReactComponent as ListActiveIcon } from '../assets/view-list-active.svg'
import { ReactComponent as ListInactiveIcon } from '../assets/view-list-inactive.svg'
import styles from './OpportunityViewToggle.module.scss'

interface OpportunityViewToggleProps {
    onChange: (view: OpportunityView) => void
    value: OpportunityView
}

/**
 * Renders the Figma list/grid selector shared by all Opportunities domains.
 *
 * @param props controlled view value and change callback.
 * @returns accessible pair of icon buttons with the authored active treatment.
 * @throws Does not throw.
 */
export const OpportunityViewToggle: FC<OpportunityViewToggleProps> = props => {
    const isList = props.value === 'list'
    const ListIcon = isList ? ListActiveIcon : ListInactiveIcon
    const GridIcon = isList ? GridInactiveIcon : GridActiveIcon

    return (
        <div aria-label='View layout' className={styles.toggle} role='group'>
            <button
                aria-label='List view'
                aria-pressed={isList}
                className={isList ? styles.active : undefined}
                onClick={() => props.onChange('list')}
                type='button'
            >
                <ListIcon aria-hidden='true' />
            </button>
            <button
                aria-label='Grid view'
                aria-pressed={!isList}
                className={!isList ? styles.active : undefined}
                onClick={() => props.onChange('grid')}
                type='button'
            >
                <GridIcon aria-hidden='true' />
            </button>
        </div>
    )
}
