-- Run as the managed Redshift administrator after deploying the Lambda role.
-- CREATE ROLE is intentionally separate because Redshift does not support
-- CREATE ROLE IF NOT EXISTS. Reapplication may begin at the GRANT statements.

CREATE ROLE analytics_api_reader;

-- Expose only the event fields required by the route report. Keeping this
-- projection separate from event_v2 prevents the Lambda database role from
-- reading device, location, free-text, or other raw event attributes.
CREATE OR REPLACE VIEW topcoder_web.route_analytics_events_v1 AS
SELECT
    event_timestamp,
    event_timestamp::date AS event_date,
    COALESCE(NULLIF(user_id, ''), user_pseudo_id) AS analytics_user_id,
    event_name,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'surface', true), '') AS surface,
    COALESCE(
        NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'page_path', true), ''),
        NULLIF(page_view_page_url_path, '')
    ) AS page_path,
    CASE
        WHEN LOWER(COALESCE(traffic_source_channel_group, '')) LIKE '%email%'
          OR LOWER(COALESCE(traffic_source_medium, '')) IN ('email', 'e-mail', 'newsletter')
            THEN 'email'
        WHEN LOWER(COALESCE(traffic_source_channel_group, '')) LIKE '%paid%'
          OR LOWER(COALESCE(traffic_source_medium, '')) IN (
              'affiliate', 'cpc', 'cpm', 'cpv', 'display', 'paid', 'paid_search', 'ppc'
          )
          OR NULLIF(traffic_source_clid, '') IS NOT NULL
            THEN 'paid'
        WHEN LOWER(COALESCE(traffic_source_channel_group, '')) LIKE '%social%'
          OR LOWER(COALESCE(traffic_source_medium, '')) IN ('social', 'social-media', 'social_media')
            THEN 'social'
        WHEN LOWER(COALESCE(traffic_source_channel_group, '')) LIKE '%organic%'
          OR LOWER(COALESCE(traffic_source_medium, '')) IN ('organic', 'organic_search', 'seo')
          OR LOWER(COALESCE(traffic_source_category, '')) = 'search'
            THEN 'organic'
        ELSE 'other'
    END AS source_group,
    session_id,
    session_number,
    page_view_entrances,
    user_engagement_time_msec,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'placement', true), '') AS placement,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'element_id', true), '') AS element_id,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'element_type', true), '') AS element_type,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'destination_host', true), '') AS destination_host,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'destination_path', true), '') AS destination_path,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'form_id', true), '') AS form_id,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'field_id', true), '') AS field_id,
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'challenge_id', true), '') AS challenge_id
FROM topcoder_web.event_v2;

GRANT USAGE ON SCHEMA topcoder_web TO ROLE analytics_api_reader;
GRANT SELECT ON topcoder_web.product_analytics_events_v1 TO ROLE analytics_api_reader;
GRANT SELECT ON topcoder_web.challenge_funnel_daily_v1 TO ROLE analytics_api_reader;
GRANT SELECT ON topcoder_web.route_analytics_events_v1 TO ROLE analytics_api_reader;
