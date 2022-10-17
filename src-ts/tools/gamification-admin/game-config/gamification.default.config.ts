import { GamificationConfigModel } from './gamification-config.model'

export const GamificationConfigDefault: GamificationConfigModel = {
  ACCEPTED_BADGE_MIME_TYPES: 'image/svg+xml,image/svg',
  CSV_HEADER: ['tc_handle', 'badge_id'],
  MAX_BADGE_IMAGE_FILE_SIZE: 5000000, // 5mb in bytes
  ORG_ID: '6052dd9b-ea80-494b-b258-edd1331e27a3',
  PAGE_SIZE: 12,
}
