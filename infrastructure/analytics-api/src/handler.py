"""Read-only Topcoder campaign and site analytics HTTP API.

API Gateway verifies the current Topcoder Auth0 access token before invoking
this Lambda. The handler independently requires the exact ``analytics`` role,
validates every filter, and executes fixed parameterized queries against the
Topcoder AWS Clickstream reporting views.
"""

from __future__ import annotations

import json
import os
import re
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any

import boto3


MAX_DATE_RANGE_DAYS = 366
MAX_RESULT_ROWS = 2_000
MAX_QUERY_ATTEMPTS = 2
REPORT_CACHE_SECONDS = 60
FILTER_CACHE_SECONDS = 300
SAFE_FILTER_PATTERN = re.compile(r"^[A-Za-z0-9._~-]{1,100}$")
NO_FILTER_PARAMETER = "*"

_redshift_data = boto3.client("redshift-data")
_cache: dict[str, tuple[float, dict[str, Any]]] = {}


FILTERS_SQL = """
WITH recent_events AS (
    SELECT event_date, utm_campaign, utm_campaign_id, utm_source, utm_medium, surface
    FROM topcoder_web.product_analytics_events_v1
    WHERE event_date >= DATEADD(day, -365, CURRENT_DATE)
),
option_rows AS (
    SELECT 'campaign'::varchar AS row_type, utm_campaign::varchar AS value, COUNT(*)::bigint AS usage_count
    FROM recent_events
    WHERE utm_campaign IS NOT NULL
    GROUP BY utm_campaign
    UNION ALL
    SELECT 'campaign_id', utm_campaign_id, COUNT(*)::bigint
    FROM recent_events
    WHERE utm_campaign_id IS NOT NULL
    GROUP BY utm_campaign_id
    UNION ALL
    SELECT 'source', utm_source, COUNT(*)::bigint
    FROM recent_events
    WHERE utm_source IS NOT NULL
    GROUP BY utm_source
    UNION ALL
    SELECT 'medium', utm_medium, COUNT(*)::bigint
    FROM recent_events
    WHERE utm_medium IS NOT NULL
    GROUP BY utm_medium
    UNION ALL
    SELECT 'surface', surface, COUNT(*)::bigint
    FROM recent_events
    WHERE surface IS NOT NULL
    GROUP BY surface
),
ranked_options AS (
    SELECT
        row_type,
        value,
        usage_count,
        ROW_NUMBER() OVER (
            PARTITION BY row_type
            ORDER BY usage_count DESC, value
        ) AS option_rank
    FROM option_rows
)
SELECT 'meta' AS row_type,
       CAST(MIN(event_date) AS varchar(10)) AS value,
       CAST(MAX(event_date) AS varchar(10)) AS secondary_value,
       COUNT(*)::bigint AS usage_count
FROM recent_events
UNION ALL
SELECT row_type, value, NULL, usage_count
FROM ranked_options
WHERE option_rank <= 200
ORDER BY row_type, usage_count DESC, value
"""


CAMPAIGN_SQL = """
WITH filtered_funnel AS (
    SELECT *
    FROM topcoder_web.challenge_funnel_daily_v1
    WHERE cohort_date BETWEEN CAST(:from_date AS date) AND CAST(:to_date AS date)
      AND (:campaign = '*' OR utm_campaign = :campaign)
      AND (:campaign_id = '*' OR utm_campaign_id = :campaign_id)
      AND (:source = '*' OR utm_source = :source)
      AND (:medium = '*' OR utm_medium = :medium)
),
filtered_clicks AS (
    SELECT
        event_date,
        page_path,
        placement,
        element_id,
        element_type,
        destination_host,
        destination_path,
        CAST(FLOOR(click_x_percent / 10.0) * 10 AS integer) AS click_x_bucket,
        CAST(FLOOR(click_y_percent / 10.0) * 10 AS integer) AS click_y_bucket,
        analytics_user_id
    FROM topcoder_web.product_analytics_events_v1
    WHERE event_name = 'ui_click'
      AND event_date BETWEEN CAST(:from_date AS date) AND CAST(:to_date AS date)
      AND (:campaign = '*' OR utm_campaign = :campaign)
      AND (:campaign_id = '*' OR utm_campaign_id = :campaign_id)
      AND (:source = '*' OR utm_source = :source)
      AND (:medium = '*' OR utm_medium = :medium)
),
summary_row AS (
    SELECT
        CAST(MAX(cohort_date) AS varchar(10)) AS data_through,
        COALESCE(SUM(landing_users), 0)::bigint AS landing_users,
        COALESCE(SUM(landing_clickers), 0)::bigint AS landing_clickers,
        COALESCE(SUM(registered_after_click), 0)::bigint AS registrations,
        COALESCE(SUM(submitted_after_registration), 0)::bigint AS submissions
    FROM filtered_funnel
),
daily_rows AS (
    SELECT
        cohort_date,
        SUM(landing_users)::bigint AS landing_users,
        SUM(landing_clickers)::bigint AS landing_clickers,
        SUM(registered_after_click)::bigint AS registrations,
        SUM(submitted_after_registration)::bigint AS submissions
    FROM filtered_funnel
    GROUP BY cohort_date
),
campaign_rows AS (
    SELECT
        utm_campaign,
        utm_campaign_id,
        utm_source,
        utm_medium,
        SUM(landing_users)::bigint AS landing_users,
        SUM(landing_clickers)::bigint AS landing_clickers,
        SUM(registered_after_click)::bigint AS registrations,
        SUM(submitted_after_registration)::bigint AS submissions
    FROM filtered_funnel
    GROUP BY utm_campaign, utm_campaign_id, utm_source, utm_medium
    ORDER BY landing_users DESC, utm_campaign
    LIMIT 100
),
landing_rows AS (
    SELECT
        landing_page_path,
        SUM(landing_users)::bigint AS landing_users,
        SUM(landing_clickers)::bigint AS landing_clickers,
        SUM(registered_after_click)::bigint AS registrations,
        SUM(submitted_after_registration)::bigint AS submissions
    FROM filtered_funnel
    GROUP BY landing_page_path
    ORDER BY landing_users DESC, landing_page_path
    LIMIT 50
),
click_rows AS (
    SELECT
        page_path,
        placement,
        element_id,
        element_type,
        destination_host,
        destination_path,
        click_x_bucket,
        click_y_bucket,
        COUNT(*)::bigint AS click_count,
        COUNT(DISTINCT analytics_user_id)::bigint AS click_users
    FROM filtered_clicks
    GROUP BY
        page_path,
        placement,
        element_id,
        element_type,
        destination_host,
        destination_path,
        click_x_bucket,
        click_y_bucket
    ORDER BY click_count DESC, page_path
    LIMIT 100
)
SELECT
    'summary'::varchar AS row_type,
    NULL::varchar AS date_value,
    data_through::varchar AS dimension_1,
    NULL::varchar AS dimension_2,
    NULL::varchar AS dimension_3,
    NULL::varchar AS dimension_4,
    NULL::varchar AS dimension_5,
    NULL::varchar AS dimension_6,
    NULL::varchar AS dimension_7,
    landing_users::double precision AS metric_1,
    landing_clickers::double precision AS metric_2,
    registrations::double precision AS metric_3,
    submissions::double precision AS metric_4,
    NULL::double precision AS metric_5,
    NULL::double precision AS metric_6,
    NULL::double precision AS metric_7,
    NULL::double precision AS metric_8
FROM summary_row
UNION ALL
SELECT
    'daily',
    CAST(cohort_date AS varchar(10)),
    NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    landing_users, landing_clickers, registrations, submissions,
    NULL, NULL, NULL, NULL
FROM daily_rows
UNION ALL
SELECT
    'campaign',
    NULL,
    utm_campaign,
    utm_campaign_id,
    utm_source,
    utm_medium,
    NULL, NULL, NULL,
    landing_users, landing_clickers, registrations, submissions,
    NULL, NULL, NULL, NULL
FROM campaign_rows
UNION ALL
SELECT
    'landing_page',
    NULL,
    landing_page_path,
    NULL, NULL, NULL, NULL, NULL, NULL,
    landing_users, landing_clickers, registrations, submissions,
    NULL, NULL, NULL, NULL
FROM landing_rows
UNION ALL
SELECT
    'click_location',
    NULL,
    page_path,
    placement,
    element_id,
    element_type,
    destination_host,
    destination_path,
    COALESCE(CAST(click_x_bucket AS varchar), '') || ':' ||
        COALESCE(CAST(click_y_bucket AS varchar), ''),
    click_count, click_users, NULL, NULL, NULL, NULL, NULL, NULL
FROM click_rows
ORDER BY row_type, date_value, metric_1 DESC
"""


GENERAL_SQL = """
WITH filtered_events AS (
    SELECT *
    FROM topcoder_web.product_analytics_events_v1
    WHERE event_date BETWEEN CAST(:from_date AS date) AND CAST(:to_date AS date)
      AND (:surface = '*' OR surface = :surface)
),
summary_row AS (
    SELECT
        CAST(MAX(event_date) AS varchar(10)) AS data_through,
        COUNT(CASE WHEN event_name = '_page_view' THEN 1 END)::bigint AS page_views,
        COUNT(DISTINCT CASE WHEN event_name = '_page_view' THEN analytics_user_id END)::bigint AS visitors,
        COUNT(CASE WHEN event_name = 'ui_click' THEN 1 END)::bigint AS clicks,
        COUNT(DISTINCT CASE WHEN event_name = 'ui_click' THEN analytics_user_id END)::bigint AS clickers
    FROM filtered_events
),
daily_rows AS (
    SELECT
        event_date,
        COUNT(CASE WHEN event_name = '_page_view' THEN 1 END)::bigint AS page_views,
        COUNT(DISTINCT CASE WHEN event_name = '_page_view' THEN analytics_user_id END)::bigint AS visitors,
        COUNT(CASE WHEN event_name = 'ui_click' THEN 1 END)::bigint AS clicks,
        COUNT(DISTINCT CASE WHEN event_name = 'ui_click' THEN analytics_user_id END)::bigint AS clickers
    FROM filtered_events
    GROUP BY event_date
),
page_rows AS (
    SELECT
        surface,
        page_path,
        COUNT(*)::bigint AS page_views,
        COUNT(DISTINCT analytics_user_id)::bigint AS visitors
    FROM filtered_events
    WHERE event_name = '_page_view' AND page_path IS NOT NULL
    GROUP BY surface, page_path
    ORDER BY page_views DESC, page_path
    LIMIT 50
),
source_rows AS (
    SELECT
        utm_source,
        COUNT(*)::bigint AS page_views,
        COUNT(DISTINCT analytics_user_id)::bigint AS visitors
    FROM filtered_events
    WHERE event_name = '_page_view'
    GROUP BY utm_source
    ORDER BY page_views DESC, utm_source
    LIMIT 25
),
surface_rows AS (
    SELECT
        surface,
        COUNT(CASE WHEN event_name = '_page_view' THEN 1 END)::bigint AS page_views,
        COUNT(DISTINCT CASE
            WHEN event_name = '_page_view' THEN analytics_user_id
        END)::bigint AS visitors,
        COUNT(CASE WHEN event_name = 'ui_click' THEN 1 END)::bigint AS clicks
    FROM filtered_events
    WHERE surface IS NOT NULL
    GROUP BY surface
    ORDER BY page_views DESC, surface
    LIMIT 25
)
SELECT
    'summary'::varchar AS row_type,
    NULL::varchar AS date_value,
    data_through::varchar AS dimension_1,
    NULL::varchar AS dimension_2,
    NULL::varchar AS dimension_3,
    NULL::varchar AS dimension_4,
    page_views::double precision AS metric_1,
    visitors::double precision AS metric_2,
    clicks::double precision AS metric_3,
    clickers::double precision AS metric_4
FROM summary_row
UNION ALL
SELECT
    'daily',
    CAST(event_date AS varchar(10)),
    NULL, NULL, NULL, NULL,
    page_views, visitors, clicks, clickers
FROM daily_rows
UNION ALL
SELECT
    'page',
    NULL,
    surface,
    page_path,
    NULL, NULL,
    page_views, visitors, NULL, NULL
FROM page_rows
UNION ALL
SELECT
    'source',
    NULL,
    utm_source,
    NULL, NULL, NULL,
    page_views, visitors, NULL, NULL
FROM source_rows
UNION ALL
SELECT
    'surface',
    NULL,
    surface,
    NULL, NULL, NULL,
    page_views, visitors, clicks, NULL
FROM surface_rows
ORDER BY row_type, date_value, metric_1 DESC
"""


class QueryFailure(RuntimeError):
    """Raised when Redshift rejects or aborts a reporting query."""


class QueryTimeout(RuntimeError):
    """Raised when a reporting query cannot finish inside the HTTP deadline."""


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Authorize and serve one analytics endpoint.

    Args:
        event: API Gateway HTTP API v2 proxy event.
        context: Lambda invocation context used to bound query wait time.

    Returns:
        An API Gateway proxy response containing a JSON analytics document.

    Raises:
        No exceptions escape; failures are converted to sanitized HTTP errors.
    """

    request_id = _request_id(event, context)
    try:
        route_key = str(event.get("routeKey", ""))
        if route_key.startswith("OPTIONS "):
            return _preflight_response()

        if not _has_required_role(event):
            return _response(403, {"message": "Analytics access is not permitted", "requestId": request_id})

        query = event.get("queryStringParameters") or {}

        if route_key == "GET /v1/analytics/filters":
            return _response(200, _cached_report("filters", FILTER_CACHE_SECONDS, _filters_report, context))
        if route_key == "GET /v1/analytics/campaign":
            filters = _campaign_filters(query)
            cache_key = f"campaign:{json.dumps(filters, sort_keys=True)}"
            report = _cached_report(
                cache_key,
                REPORT_CACHE_SECONDS,
                lambda: _campaign_report(filters, context),
                context,
            )
            return _response(200, report)
        if route_key == "GET /v1/analytics/general":
            filters = _general_filters(query)
            cache_key = f"general:{json.dumps(filters, sort_keys=True)}"
            report = _cached_report(
                cache_key,
                REPORT_CACHE_SECONDS,
                lambda: _general_report(filters, context),
                context,
            )
            return _response(200, report)

        return _response(404, {"message": "Analytics route not found", "requestId": request_id})
    except ValueError as error:
        return _response(400, {"message": str(error), "requestId": request_id})
    except QueryTimeout:
        return _response(504, {"message": "Analytics data is still being prepared. Please retry.", "requestId": request_id})
    except QueryFailure:
        _log_error(request_id, "redshift-query-failed")
        return _response(502, {"message": "Analytics data could not be loaded", "requestId": request_id})
    except Exception:
        _log_error(request_id, "unhandled-analytics-error")
        return _response(500, {"message": "Analytics data could not be loaded", "requestId": request_id})


def _cached_report(
    key: str,
    lifetime_seconds: int,
    loader: Any,
    context: Any,
) -> dict[str, Any]:
    """Return a short-lived cached report or invoke its loader.

    Args:
        key: Stable cache key containing only validated filters.
        lifetime_seconds: Maximum age of a cached response.
        loader: Zero-argument callable that loads the response.
        context: Lambda context retained for a uniform loader signature.

    Returns:
        Cached or newly loaded analytics report.

    Raises:
        Propagates loader failures so the handler can sanitize them.
    """

    del context
    now = time.monotonic()
    cached = _cache.get(key)
    if cached and cached[0] > now:
        return cached[1]
    result = loader()
    if len(_cache) >= 50:
        _cache.clear()
    _cache[key] = (now + lifetime_seconds, result)
    return result


def _filters_report() -> dict[str, Any]:
    """Load bounded campaign and surface filter options.

    Returns:
        Filter option arrays and available event-date bounds.

    Raises:
        QueryFailure or QueryTimeout when Redshift cannot return data.
    """

    rows = _execute_query(FILTERS_SQL, [], None)
    options: dict[str, list[str]] = {
        "campaigns": [],
        "campaignIds": [],
        "sources": [],
        "mediums": [],
        "surfaces": [],
    }
    min_date = None
    max_date = None
    key_by_row_type = {
        "campaign": "campaigns",
        "campaign_id": "campaignIds",
        "source": "sources",
        "medium": "mediums",
        "surface": "surfaces",
    }
    for row in rows:
        row_type = row.get("row_type")
        if row_type == "meta":
            min_date = row.get("value")
            max_date = row.get("secondary_value")
            continue
        option_key = key_by_row_type.get(str(row_type))
        value = row.get("value")
        if option_key and isinstance(value, str) and value:
            options[option_key].append(value)

    return {
        **options,
        "generatedAt": _now_iso(),
        "minDate": min_date,
        "maxDate": max_date,
        "dataThrough": max_date,
    }


def _campaign_report(filters: dict[str, str], context: Any) -> dict[str, Any]:
    """Load and shape the ordered campaign funnel report.

    Args:
        filters: Validated date and UTM filter values.
        context: Lambda context used to respect the remaining deadline.

    Returns:
        Funnel totals, daily series, campaign/landing breakdowns, and click locations.

    Raises:
        QueryFailure or QueryTimeout when Redshift cannot return data.
    """

    rows = _execute_query(CAMPAIGN_SQL, _sql_parameters(filters), context)
    summary = next((row for row in rows if row.get("row_type") == "summary"), {})
    totals = {
        "landingUsers": _integer(summary.get("metric_1")),
        "landingClickers": _integer(summary.get("metric_2")),
        "registrations": _integer(summary.get("metric_3")),
        "submissions": _integer(summary.get("metric_4")),
    }
    totals.update({
        "clickThroughPercent": _percentage(totals["landingClickers"], totals["landingUsers"]),
        "clickToRegistrationPercent": _percentage(totals["registrations"], totals["landingClickers"]),
        "registrationToSubmissionPercent": _percentage(totals["submissions"], totals["registrations"]),
        "landingToSubmissionPercent": _percentage(totals["submissions"], totals["landingUsers"]),
    })

    return {
        "generatedAt": _now_iso(),
        "dataThrough": summary.get("dimension_1"),
        "filters": filters,
        "totals": totals,
        "series": [
            {
                "date": row.get("date_value"),
                "landingUsers": _integer(row.get("metric_1")),
                "landingClickers": _integer(row.get("metric_2")),
                "registrations": _integer(row.get("metric_3")),
                "submissions": _integer(row.get("metric_4")),
            }
            for row in rows if row.get("row_type") == "daily"
        ],
        "campaigns": [
            {
                "campaign": row.get("dimension_1") or "Direct",
                "campaignId": row.get("dimension_2"),
                "source": row.get("dimension_3") or "Direct",
                "medium": row.get("dimension_4") or "None",
                "landingUsers": _integer(row.get("metric_1")),
                "landingClickers": _integer(row.get("metric_2")),
                "registrations": _integer(row.get("metric_3")),
                "submissions": _integer(row.get("metric_4")),
            }
            for row in rows if row.get("row_type") == "campaign"
        ],
        "landingPages": [
            {
                "path": row.get("dimension_1") or "Unknown",
                "landingUsers": _integer(row.get("metric_1")),
                "landingClickers": _integer(row.get("metric_2")),
                "registrations": _integer(row.get("metric_3")),
                "submissions": _integer(row.get("metric_4")),
            }
            for row in rows if row.get("row_type") == "landing_page"
        ],
        "clickLocations": [
            _click_location(row)
            for row in rows if row.get("row_type") == "click_location"
        ],
    }


def _general_report(filters: dict[str, str], context: Any) -> dict[str, Any]:
    """Load and shape general Topcoder site engagement analytics.

    Args:
        filters: Validated date and optional surface filter values.
        context: Lambda context used to respect the remaining deadline.

    Returns:
        General totals, daily series, pages, traffic sources, and surfaces.

    Raises:
        QueryFailure or QueryTimeout when Redshift cannot return data.
    """

    rows = _execute_query(GENERAL_SQL, _sql_parameters(filters), context)
    summary = next((row for row in rows if row.get("row_type") == "summary"), {})
    return {
        "generatedAt": _now_iso(),
        "dataThrough": summary.get("dimension_1"),
        "filters": filters,
        "totals": {
            "pageViews": _integer(summary.get("metric_1")),
            "visitors": _integer(summary.get("metric_2")),
            "clicks": _integer(summary.get("metric_3")),
            "clickers": _integer(summary.get("metric_4")),
        },
        "series": [
            {
                "date": row.get("date_value"),
                "pageViews": _integer(row.get("metric_1")),
                "visitors": _integer(row.get("metric_2")),
                "clicks": _integer(row.get("metric_3")),
                "clickers": _integer(row.get("metric_4")),
            }
            for row in rows if row.get("row_type") == "daily"
        ],
        "pages": [
            {
                "surface": row.get("dimension_1") or "Unknown",
                "path": row.get("dimension_2") or "Unknown",
                "pageViews": _integer(row.get("metric_1")),
                "visitors": _integer(row.get("metric_2")),
            }
            for row in rows if row.get("row_type") == "page"
        ],
        "sources": [
            {
                "source": row.get("dimension_1") or "Direct",
                "pageViews": _integer(row.get("metric_1")),
                "visitors": _integer(row.get("metric_2")),
            }
            for row in rows if row.get("row_type") == "source"
        ],
        "surfaces": [
            {
                "surface": row.get("dimension_1") or "Unknown",
                "pageViews": _integer(row.get("metric_1")),
                "visitors": _integer(row.get("metric_2")),
                "clicks": _integer(row.get("metric_3")),
            }
            for row in rows if row.get("row_type") == "surface"
        ],
    }


def _click_location(row: dict[str, Any]) -> dict[str, Any]:
    """Convert one normalized Redshift click-location row to the wire contract.

    Args:
        row: Query result row with safe, aggregate click dimensions.

    Returns:
        Camel-cased click-location object with separate coarse coordinates.

    Raises:
        Does not raise; malformed buckets become null coordinates.
    """

    bucket = str(row.get("dimension_7") or ":").split(":", 1)
    return {
        "pagePath": row.get("dimension_1") or "Unknown",
        "placement": row.get("dimension_2"),
        "elementId": row.get("dimension_3"),
        "elementType": row.get("dimension_4"),
        "destinationHost": row.get("dimension_5"),
        "destinationPath": row.get("dimension_6"),
        "xBucket": _optional_integer(bucket[0]),
        "yBucket": _optional_integer(bucket[1] if len(bucket) > 1 else ""),
        "clicks": _integer(row.get("metric_1")),
        "clickers": _integer(row.get("metric_2")),
    }


def _campaign_filters(query: dict[str, Any]) -> dict[str, str]:
    """Validate campaign report dates and UTM dimensions.

    Args:
        query: Untrusted API Gateway query string values.

    Returns:
        Complete normalized filter dictionary.

    Raises:
        ValueError for malformed dates, excessive ranges, or unsafe dimensions.
    """

    date_filters = _date_filters(query)
    return {
        **date_filters,
        "campaign": _safe_filter(query.get("campaign"), "campaign"),
        "campaignId": _safe_filter(query.get("campaignId"), "campaign ID"),
        "source": _safe_filter(query.get("source"), "source"),
        "medium": _safe_filter(query.get("medium"), "medium"),
    }


def _general_filters(query: dict[str, Any]) -> dict[str, str]:
    """Validate general report dates and surface.

    Args:
        query: Untrusted API Gateway query string values.

    Returns:
        Complete normalized filter dictionary.

    Raises:
        ValueError for malformed dates, excessive ranges, or unsafe surface.
    """

    return {
        **_date_filters(query),
        "surface": _safe_filter(query.get("surface"), "surface"),
    }


def _date_filters(query: dict[str, Any]) -> dict[str, str]:
    """Parse an inclusive UTC date range with a safe 30-day default.

    Args:
        query: Untrusted query values containing optional ``from`` and ``to``.

    Returns:
        ISO date strings under ``from`` and ``to``.

    Raises:
        ValueError when dates are invalid, reversed, future, or over 366 days.
    """

    today = datetime.now(timezone.utc).date()
    to_date = _parse_date(query.get("to"), "to") if query.get("to") else today
    from_date = _parse_date(query.get("from"), "from") if query.get("from") else to_date - timedelta(days=29)
    if from_date > to_date:
        raise ValueError("The from date must not be after the to date")
    if to_date > today:
        raise ValueError("The to date must not be in the future")
    if (to_date - from_date).days + 1 > MAX_DATE_RANGE_DAYS:
        raise ValueError(f"Analytics date ranges cannot exceed {MAX_DATE_RANGE_DAYS} days")
    return {"from": from_date.isoformat(), "to": to_date.isoformat()}


def _parse_date(value: Any, label: str) -> date:
    """Parse one strict ISO calendar date.

    Args:
        value: Untrusted candidate date.
        label: Field label used in the validation message.

    Returns:
        Parsed date.

    Raises:
        ValueError when the candidate is not exactly YYYY-MM-DD.
    """

    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        raise ValueError(f"The {label} date must use YYYY-MM-DD")
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"The {label} date must be valid") from error


def _safe_filter(value: Any, label: str) -> str:
    """Validate one optional UTM or surface token.

    Args:
        value: Untrusted query value.
        label: Human-readable field label.

    Returns:
        Empty string for no filter or the unchanged safe token.

    Raises:
        ValueError when the value is not a bounded marketing token.
    """

    if value in (None, ""):
        return ""
    if not isinstance(value, str) or not SAFE_FILTER_PATTERN.fullmatch(value):
        raise ValueError(f"The {label} filter contains unsupported characters")
    return value


def _sql_parameters(filters: dict[str, str]) -> list[dict[str, str]]:
    """Map wire filters to Redshift Data API named parameters.

    Args:
        filters: Validated campaign or general filter dictionary.

    Returns:
        Data API parameter objects for keys referenced by the SQL template. Empty optional filters use
        a non-empty sentinel that cannot pass public filter validation because Data API rejects empty values.

    Raises:
        Does not raise.
    """

    names = {
        "from": "from_date",
        "to": "to_date",
        "campaign": "campaign",
        "campaignId": "campaign_id",
        "source": "source",
        "medium": "medium",
        "surface": "surface",
    }
    return [
        {"name": names[key], "value": value or NO_FILTER_PARAMETER}
        for key, value in filters.items()
        if key in names
    ]


def _execute_query(
    sql: str,
    parameters: list[dict[str, str]],
    context: Any,
) -> list[dict[str, Any]]:
    """Execute a fixed parameterized query with one bounded provider retry.

    Args:
        sql: Server-owned SQL template.
        parameters: Validated Data API named parameters.
        context: Lambda context or null for the cached filter loader.

    Returns:
        Query rows keyed by Redshift column name.

    Raises:
        QueryFailure after repeated provider failure or excess output and
        QueryTimeout when the shared deadline expires.
    """

    request: dict[str, Any] = {
        "Database": os.environ["REDSHIFT_DATABASE"],
        "Sql": sql,
        "StatementName": "topcoder-analytics-read",
        "WithEvent": False,
        "WorkgroupName": os.environ["REDSHIFT_WORKGROUP"],
    }
    if parameters:
        request["Parameters"] = parameters
    deadline = time.monotonic() + _query_wait_seconds(context)
    for attempt in range(MAX_QUERY_ATTEMPTS):
        statement_id = _redshift_data.execute_statement(**request)["Id"]
        delay = 0.2
        while time.monotonic() < deadline:
            status = _redshift_data.describe_statement(Id=statement_id)
            if status["Status"] == "FINISHED":
                return _statement_rows(statement_id)
            if status["Status"] in {"FAILED", "ABORTED"}:
                if attempt + 1 < MAX_QUERY_ATTEMPTS:
                    break
                raise QueryFailure("Redshift reporting query failed")
            time.sleep(delay)
            delay = min(delay * 1.5, 1.0)
        else:
            try:
                _redshift_data.cancel_statement(Id=statement_id)
            except Exception:
                pass
            raise QueryTimeout("Redshift reporting query timed out")

    raise QueryFailure("Redshift reporting query failed")


def _query_wait_seconds(context: Any) -> float:
    """Calculate a provider wait that leaves time for a sanitized HTTP response.

    Args:
        context: Lambda invocation context, or null in direct unit calls.

    Returns:
        Wait duration between one and 24 seconds.

    Raises:
        Does not raise.
    """

    if context and hasattr(context, "get_remaining_time_in_millis"):
        return max(1.0, min(24.0, (context.get_remaining_time_in_millis() / 1_000) - 2.0))
    return 24.0


def _statement_rows(statement_id: str) -> list[dict[str, Any]]:
    """Page through one Data API result without exceeding the response contract.

    Args:
        statement_id: Completed Data API statement identifier.

    Returns:
        Decoded query rows.

    Raises:
        QueryFailure when the query returns more than the allowed row bound.
    """

    rows: list[dict[str, Any]] = []
    next_token = None
    while True:
        request = {"Id": statement_id}
        if next_token:
            request["NextToken"] = next_token
        page = _redshift_data.get_statement_result(**request)
        columns = [column["name"] for column in page.get("ColumnMetadata", [])]
        rows.extend({name: _field_value(field) for name, field in zip(columns, record)}
                    for record in page.get("Records", []))
        if len(rows) > MAX_RESULT_ROWS:
            raise QueryFailure("Analytics query exceeded the result row bound")
        next_token = page.get("NextToken")
        if not next_token:
            return rows


def _field_value(field: dict[str, Any]) -> Any:
    """Decode one Redshift Data API union field.

    Args:
        field: Data API field object.

    Returns:
        Native scalar value or null.

    Raises:
        Does not raise for supported Data API field shapes.
    """

    if field.get("isNull"):
        return None
    for key in ("stringValue", "longValue", "doubleValue", "booleanValue", "blobValue"):
        if key in field:
            return field[key]
    return None


def _has_required_role(event: dict[str, Any]) -> bool:
    """Require the exact role from supported API Gateway-verified Topcoder claims.

    Args:
        event: API Gateway event containing JWT authorizer claims.

    Returns:
        True only when the normalized role set contains the required role.

    Raises:
        Does not raise; malformed claims deny access.
    """

    claims = (((event.get("requestContext") or {}).get("authorizer") or {}).get("jwt") or {}).get("claims") or {}
    if not isinstance(claims, dict):
        return False

    configured_claim = os.environ.get("HUMAN_ROLE_CLAIM", "https://topcoder-dev.com/roles")
    claim_names = [configured_claim]
    claim_names.extend(
        key for key in claims
        if isinstance(key, str)
        and key != configured_claim
        and (key == "roles" or key.endswith("/roles"))
    )
    roles: list[str] = []
    for claim_name in claim_names:
        roles.extend(_role_values(claims.get(claim_name)))
    required = os.environ.get("REQUIRED_ROLE", "analytics").strip()
    return required in {role.strip() for role in roles}


def _role_values(raw_roles: Any) -> list[str]:
    """Normalize one verified JWT role-claim representation.

    Args:
        raw_roles: List or string claim supplied by the API Gateway JWT authorizer.

    Returns:
        String role values, preserving their original case for exact matching.

    Raises:
        Does not raise; malformed claim values produce an empty list.
    """

    if isinstance(raw_roles, list):
        return [role for role in raw_roles if isinstance(role, str)]
    if isinstance(raw_roles, str):
        try:
            parsed = json.loads(raw_roles)
            if isinstance(parsed, list):
                return [role for role in parsed if isinstance(role, str)]
            if isinstance(parsed, str):
                return [parsed]
        except json.JSONDecodeError:
            return [
                part.strip("[]\"'")
                for part in re.split(r"[\s,]+", raw_roles)
                if part.strip("[]\"'")
            ]
    return []


def _preflight_response() -> dict[str, Any]:
    """Build the empty response used by the shared API's analytics preflight route.

    Returns:
        HTTP API v2 response; the shared CloudFront response policy adds the
        environment's public CORS headers.

    Raises:
        Does not raise.
    """

    return {
        "statusCode": 204,
        "headers": {
            "Cache-Control": "no-store",
            "Vary": "Origin",
        },
        "body": "",
    }


def _response(status_code: int, body: dict[str, Any]) -> dict[str, Any]:
    """Build a private JSON API Gateway proxy response.

    Args:
        status_code: HTTP response status.
        body: JSON-serializable response document.

    Returns:
        HTTP API v2 Lambda proxy response.

    Raises:
        Does not raise for the service-owned response shapes.
    """

    return {
        "statusCode": status_code,
        "headers": {
            "Cache-Control": "private, no-store",
            "Content-Type": "application/json; charset=utf-8",
            "Referrer-Policy": "no-referrer",
            "Vary": "Authorization, Origin",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
        },
        "body": json.dumps(body, separators=(",", ":")),
    }


def _request_id(event: dict[str, Any], context: Any) -> str:
    """Resolve a provider-generated request identifier.

    Args:
        event: API Gateway event.
        context: Lambda context fallback.

    Returns:
        Request identifier suitable for support correlation.

    Raises:
        Does not raise.
    """

    gateway_id = (event.get("requestContext") or {}).get("requestId")
    lambda_id = getattr(context, "aws_request_id", None)
    return str(gateway_id or lambda_id or "unknown")[:128]


def _log_error(request_id: str, error_type: str) -> None:
    """Write a bounded diagnostic without tokens, filters, or SQL.

    Args:
        request_id: Provider-generated correlation identifier.
        error_type: Service-owned error category.

    Returns:
        Nothing after writing one structured log line.

    Raises:
        Does not raise.
    """

    print(json.dumps({"level": "error", "requestId": request_id, "type": error_type}))


def _integer(value: Any) -> int:
    """Convert a numeric aggregate to a non-negative integer.

    Args:
        value: Data API numeric field.

    Returns:
        Non-negative integer, defaulting to zero.

    Raises:
        Does not raise for malformed provider values.
    """

    try:
        return max(0, int(float(value or 0)))
    except (TypeError, ValueError):
        return 0


def _optional_integer(value: Any) -> int | None:
    """Convert an optional coarse coordinate to an integer.

    Args:
        value: Data API string or number.

    Returns:
        Integer coordinate or null when absent/malformed.

    Raises:
        Does not raise.
    """

    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _percentage(numerator: int, denominator: int) -> float:
    """Calculate a bounded conversion percentage.

    Args:
        numerator: Successful later-stage count.
        denominator: Eligible earlier-stage count.

    Returns:
        Percentage rounded to two decimals, or zero for an empty denominator.

    Raises:
        Does not raise.
    """

    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def _now_iso() -> str:
    """Return the current UTC timestamp for response freshness metadata.

    Returns:
        ISO-8601 timestamp ending in ``Z``.

    Raises:
        Does not raise.
    """

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
