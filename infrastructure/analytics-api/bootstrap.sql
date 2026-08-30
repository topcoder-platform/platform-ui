-- Run as the managed Redshift administrator after deploying the Lambda role.
-- CREATE ROLE is intentionally separate because Redshift does not support
-- CREATE ROLE IF NOT EXISTS. Reapplication may begin at the GRANT statements.

CREATE ROLE analytics_api_reader;

GRANT USAGE ON SCHEMA topcoder_web TO ROLE analytics_api_reader;
GRANT SELECT ON topcoder_web.product_analytics_events_v1 TO ROLE analytics_api_reader;
GRANT SELECT ON topcoder_web.challenge_funnel_daily_v1 TO ROLE analytics_api_reader;
