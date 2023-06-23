import { get } from 'lodash'

/* eslint-disable @typescript-eslint/typedef */
import { EnvironmentConfig } from '~/config'

const { ENV } = EnvironmentConfig

export const ACCEPTED_BADGE_MIME_TYPES = 'image/svg+xml,image/svg'
export const CSV_HEADER = ['tc_handle', 'badge_id']
export const MAX_BADGE_IMAGE_FILE_SIZE = 5000000 // 5mb in bytes
export const PAGE_SIZE = 12

export const ORG_ID = get({
    prod: 'e111f8df-6ac8-44d1-b4da-bb916f5e3425',
}, ENV, '6052dd9b-ea80-494b-b258-edd1331e27a3')
