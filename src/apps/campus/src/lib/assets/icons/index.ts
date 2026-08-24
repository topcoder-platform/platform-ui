import { ReactComponent as IconHelp } from './icon-help.svg'
import { ReactComponent as IconInfo } from './icon-info.svg'
import { ReactComponent as IconMedal1st } from './icon-medal-1st.svg'
import { ReactComponent as IconMedal2nd } from './icon-medal-2nd.svg'
import { ReactComponent as IconMedal3rd } from './icon-medal-3rd.svg'
import { ReactComponent as IconResultFailed } from './icon-result-failed.svg'
import { ReactComponent as IconResultPassed } from './icon-result-passed.svg'
import { ReactComponent as IconStatMembers } from './icon-stat-members.svg'
import { ReactComponent as IconStatPassed } from './icon-stat-passed.svg'
import { ReactComponent as IconStatRegistered } from './icon-stat-registered.svg'
import { ReactComponent as IconStatSubmitted } from './icon-stat-submitted.svg'
import { ReactComponent as IconStatWins } from './icon-stat-wins.svg'

export {
    IconHelp,
    IconInfo,
    IconMedal1st,
    IconMedal2nd,
    IconMedal3rd,
    IconResultFailed,
    IconResultPassed,
    IconStatMembers,
    IconStatPassed,
    IconStatRegistered,
    IconStatSubmitted,
    IconStatWins,
}

/**
 * Medal badges shown for the top three placements.
 */
export const placementIcons: { [placement: number]: typeof IconMedal1st } = {
    1: IconMedal1st,
    2: IconMedal2nd,
    3: IconMedal3rd,
}

/**
 * Ordinal labels for the top three placements.
 */
export const placementLabels: { [placement: number]: string } = {
    1: '1st place',
    2: '2nd place',
    3: '3rd place',
}
