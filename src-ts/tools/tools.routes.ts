import { PlatformRoute } from '../lib'

import { workRoutes } from './work'

const toolRoutes: Array<PlatformRoute> = [
    // NOTE: these will be displayed in the order they are defined in this array
    // TODO: support ordering
    ...workRoutes,
]

export default toolRoutes
