import { find, isFunction } from 'lodash'

import { MockTabs } from '../../mock-datas'
import { SelectOption } from '../models'

export const fetchTabs = async (type: string, tabsLength: number = 1): Promise<SelectOption[]> => {
    const tabs = (find(MockTabs, t => t.name.includes(type)) ?? MockTabs[0]).tabs
    return Promise.resolve(
        isFunction(tabs) ? tabs(tabsLength) as SelectOption[] : tabs as SelectOption[],
    )
}
