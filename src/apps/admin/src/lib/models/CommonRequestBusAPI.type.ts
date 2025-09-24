import { RequestBusAPI } from './RequestBusAPI.model'
import { RequestBusAPIAVScan } from './RequestBusAPIAVScan.model'

/**
 * Common type for bus api request
 */
export type CommonRequestBusAPI = RequestBusAPI | RequestBusAPIAVScan
