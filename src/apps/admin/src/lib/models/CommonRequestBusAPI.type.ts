import { RequestBusAPI } from './RequestBusAPI.model'
import { RequestBusAPIAVScan } from './RequestBusAPIAVScan.model'
import { RequestBusAPIReprocess } from './RequestBusAPIReprocess.model'

/**
 * Common type for bus api request
 */
export type CommonRequestBusAPI = RequestBusAPI
| RequestBusAPIAVScan
| RequestBusAPIReprocess
