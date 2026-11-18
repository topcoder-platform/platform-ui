-- Apply before deploying the PM-6712 form-status Lambda change.
-- Additive and safe to reapply; grants no access to answers or raw events.
CREATE OR REPLACE VIEW topcoder_web.spacetech_form_events_v1 AS
SELECT DISTINCT
    event_timestamp,
    user_pseudo_id AS visitor_id,
    session_id,
    event_name,
    traffic_source_source AS source,
    traffic_source_medium AS medium,
    traffic_source_campaign AS campaign,
    traffic_source_content AS content
FROM topcoder_web.event_v2
WHERE COALESCE(
    NULLIF(JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'page_path', true), ''),
    page_view_page_url_path
) IN ('/space-tech', '/space-tech/')
AND JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'surface', true) = 'topcoder_website'
AND JSON_EXTRACT_PATH_TEXT(custom_parameters_json_str, 'form_id', true) = 'topcoder:space_tech_challenge'
AND event_name IN ('form_started', 'form_completed', 'form_abandoned');

GRANT SELECT ON topcoder_web.spacetech_form_events_v1 TO ROLE analytics_api_reader;
