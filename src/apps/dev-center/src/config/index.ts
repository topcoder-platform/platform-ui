/* eslint-disable @typescript-eslint/typedef */
import { EnvironmentConfig } from '~/config'

const { TOPCODER_URL } = EnvironmentConfig

export const API_BASE = `${TOPCODER_URL}/api`
export const WP_CONTENT = `${TOPCODER_URL}/wp-content`
export const BLOG_PAGE = `${TOPCODER_URL}/blog`
export const THRIVE_PAGE = `${TOPCODER_URL}/thrive`
