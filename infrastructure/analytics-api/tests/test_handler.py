"""Unit tests for the role-gated analytics Lambda contract."""

from __future__ import annotations

import importlib.util
import json
import os
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


HANDLER_PATH = Path(__file__).parents[1] / "src" / "handler.py"


class _FakeBoto3(types.ModuleType):
    """Minimal boto3 module used while importing the dependency-free handler."""

    def __init__(self) -> None:
        super().__init__("boto3")
        self.redshift = Mock()

    def client(self, service: str) -> Mock:
        """Return the fake Redshift Data API client.

        Args:
            service: Requested AWS service name.

        Returns:
            Shared mock client.

        Raises:
            AssertionError when the handler requests an unexpected service.
        """

        if service != "redshift-data":
            raise AssertionError(f"Unexpected AWS client: {service}")
        return self.redshift


def _load_handler() -> types.ModuleType:
    """Import the Lambda handler with a fake boto3 module.

    Returns:
        Fresh handler module.

    Raises:
        RuntimeError when the module cannot be loaded from disk.
    """

    fake_boto3 = _FakeBoto3()
    sys.modules["boto3"] = fake_boto3
    specification = importlib.util.spec_from_file_location("analytics_handler", HANDLER_PATH)
    if specification is None or specification.loader is None:
        raise RuntimeError("Unable to load analytics handler")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    return module


class AnalyticsHandlerTests(unittest.TestCase):
    """Covers authorization, filter validation, and wire-shape transformations."""

    @classmethod
    def setUpClass(cls) -> None:
        """Load the handler once with deterministic runtime configuration."""

        os.environ.update({
            "HUMAN_ROLE_CLAIM": "https://topcoder-dev.com/roles",
            "REDSHIFT_DATABASE": "topcoder_web_dev",
            "REDSHIFT_WORKGROUP": "clickstream-topcoder-web-dev",
            "REQUIRED_ROLE": "analytics",
        })
        cls.module = _load_handler()

    def setUp(self) -> None:
        """Clear the warm Lambda cache before each test."""

        self.module._cache.clear()

    def _event(
        self,
        route_key: str,
        roles: object = None,
        query: dict[str, str] | None = None,
        role_claim: str = "https://topcoder-dev.com/roles",
    ) -> dict[str, object]:
        """Build one API Gateway v2 event.

        Args:
            route_key: API Gateway route key.
            roles: Namespaced role claim value.
            query: Optional query string parameters.
            role_claim: Verified JWT claim name containing the roles.

        Returns:
            Synthetic API Gateway event.

        Raises:
            Does not raise.
        """

        claims = {}
        if roles is not None:
            claims[role_claim] = roles
        return {
            "queryStringParameters": query,
            "requestContext": {
                "authorizer": {"jwt": {"claims": claims}},
                "requestId": "request-123",
            },
            "routeKey": route_key,
        }

    def test_denies_missing_or_wrong_role_without_querying(self) -> None:
        """A verified token still needs the exact analytics role."""

        with patch.object(self.module, "_execute_query") as execute:
            missing = self.module.handler(self._event("GET /v1/analytics/filters"), None)
            wrong = self.module.handler(
                self._event("GET /v1/analytics/filters", json.dumps(["administrator"])),
                None,
            )
            wrong_case = self.module.handler(
                self._event("GET /v1/analytics/filters", json.dumps(["Analytics"])),
                None,
            )

        self.assertEqual(403, missing["statusCode"])
        self.assertEqual(403, wrong["statusCode"])
        self.assertEqual(403, wrong_case["statusCode"])
        execute.assert_not_called()

    def test_accepts_json_array_role_claim_and_returns_private_filters(self) -> None:
        """The API Gateway string form of an array role claim is supported."""

        rows = [
            {"row_type": "meta", "value": "2026-08-01", "secondary_value": "2026-08-30"},
            {"row_type": "campaign", "value": "launch", "usage_count": 4},
            {"row_type": "source", "value": "newsletter", "usage_count": 4},
        ]
        with patch.object(self.module, "_execute_query", return_value=rows):
            response = self.module.handler(
                self._event("GET /v1/analytics/filters", json.dumps(["analytics"])),
                None,
            )

        body = json.loads(response["body"])
        self.assertEqual(200, response["statusCode"])
        self.assertEqual("private, no-store", response["headers"]["Cache-Control"])
        self.assertEqual(["launch"], body["campaigns"])
        self.assertEqual("2026-08-30", body["dataThrough"])

    def test_accepts_verified_topcoder_role_claim_variants(self) -> None:
        """V2/V3 Topcoder role namespaces and API Gateway string forms authorize identically."""

        variants = [
            ("https://topcoder.com/roles", ["analytics"]),
            ("roles", "analytics"),
            ("roles", "[analytics]"),
        ]
        with patch.object(self.module, "_execute_query", return_value=[]):
            for claim_name, roles in variants:
                with self.subTest(claim_name=claim_name, roles=roles):
                    self.module._cache.clear()
                    response = self.module.handler(
                        self._event(
                            "GET /v1/analytics/filters",
                            roles,
                            role_claim=claim_name,
                        ),
                        None,
                    )
                    self.assertEqual(200, response["statusCode"])

    def test_async_timeout_returns_a_private_pending_poll_response(self) -> None:
        """Opted-in clients receive a reusable token instead of an HTTP failure."""

        query_token = "a" * 64
        with patch.object(
            self.module,
            "_execute_query",
            side_effect=self.module.QueryTimeout(query_token),
        ):
            pending = self.module.handler(
                self._event(
                    "GET /v1/analytics/filters",
                    ["analytics"],
                    {"async": "true"},
                ),
                None,
            )
            legacy = self.module.handler(
                self._event("GET /v1/analytics/filters", ["analytics"]),
                None,
            )

        body = json.loads(pending["body"])
        self.assertEqual(202, pending["statusCode"])
        self.assertEqual("1", pending["headers"]["Retry-After"])
        self.assertEqual("pending", body["status"])
        self.assertEqual(query_token, body["queryToken"])
        self.assertEqual(1_000, body["retryAfterMs"])
        self.assertEqual(504, legacy["statusCode"])

    def test_rejects_invalid_async_options_and_resume_tokens(self) -> None:
        """Only opted-in clients can send a bounded server-issued query token."""

        cases = [
            {"async": "false"},
            {"async": "true", "queryToken": "not-a-token"},
            {"queryToken": "a" * 64},
        ]
        with patch.object(self.module, "_execute_query") as execute:
            responses = [
                self.module.handler(
                    self._event("GET /v1/analytics/filters", ["analytics"], query),
                    None,
                )
                for query in cases
            ]

        self.assertTrue(all(response["statusCode"] == 400 for response in responses))
        execute.assert_not_called()

    def test_shared_api_preflight_does_not_require_a_role(self) -> None:
        """The public OPTIONS route returns no data and never queries Redshift."""

        with patch.object(self.module, "_execute_query") as execute:
            response = self.module.handler(
                self._event("OPTIONS /v1/analytics/{proxy+}"),
                None,
            )

        self.assertEqual(204, response["statusCode"])
        self.assertEqual("", response["body"])
        execute.assert_not_called()

    def test_rejects_invalid_or_excessive_date_ranges(self) -> None:
        """Malformed and unbounded reporting requests fail before Redshift."""

        with patch.object(self.module, "_execute_query") as execute:
            invalid = self.module.handler(
                self._event(
                    "GET /v1/analytics/general",
                    ["analytics"],
                    {"from": "2026-99-01", "to": "2026-08-30"},
                ),
                None,
            )
            excessive = self.module.handler(
                self._event(
                    "GET /v1/analytics/general",
                    ["analytics"],
                    {"from": "2025-01-01", "to": "2026-01-02"},
                ),
                None,
            )

        self.assertEqual(400, invalid["statusCode"])
        self.assertEqual(400, excessive["statusCode"])
        execute.assert_not_called()

    def test_rejects_unsafe_utm_values_before_querying(self) -> None:
        """UTM values cannot alter fixed SQL templates."""

        with patch.object(self.module, "_execute_query") as execute:
            response = self.module.handler(
                self._event(
                    "GET /v1/analytics/campaign",
                    ["analytics"],
                    {"campaign": "launch' OR 1=1 --"},
                ),
                None,
            )

        self.assertEqual(400, response["statusCode"])
        execute.assert_not_called()

    def test_unset_filters_use_nonempty_data_api_parameters(self) -> None:
        """Optional filters use an unreachable sentinel because Data API rejects empty values."""

        parameters = self.module._sql_parameters({
            "from": "2026-08-01",
            "to": "2026-08-30",
            "campaign": "",
            "source": "newsletter",
        })
        values = {parameter["name"]: parameter["value"] for parameter in parameters}

        self.assertEqual("*", values["campaign"])
        self.assertEqual("newsletter", values["source"])
        self.assertTrue(all(parameter["value"] for parameter in parameters))
        self.assertIsNone(self.module.SAFE_FILTER_PATTERN.fullmatch(self.module.NO_FILTER_PARAMETER))
        self.assertIn(":campaign = '*' OR", self.module.CAMPAIGN_SQL)
        self.assertIn(":surface = '*' OR", self.module.GENERAL_SQL)

    def test_retries_one_failed_redshift_statement(self) -> None:
        """A transient failed statement is retried once inside the request deadline."""

        context = Mock()
        context.get_remaining_time_in_millis.return_value = 28_000
        with (
            patch.object(
                self.module._redshift_data,
                "execute_statement",
                side_effect=[{"Id": "failed"}, {"Id": "finished"}],
            ) as execute,
            patch.object(
                self.module._redshift_data,
                "describe_statement",
                side_effect=[{"Status": "FAILED"}, {"Status": "FINISHED"}],
            ),
            patch.object(
                self.module._redshift_data,
                "get_statement_result",
                return_value={
                    "ColumnMetadata": [{"name": "value"}],
                    "Records": [[{"stringValue": "recovered"}]],
                },
            ),
        ):
            rows = self.module._execute_query("SELECT 1", [], context)

        self.assertEqual([{"value": "recovered"}], rows)
        self.assertEqual(2, execute.call_count)
        self.assertNotEqual(
            execute.call_args_list[0].kwargs["ClientToken"],
            execute.call_args_list[1].kwargs["ClientToken"],
        )

    def test_stops_after_bounded_redshift_retries(self) -> None:
        """Repeated failed statements surface an error after two attempts."""

        context = Mock()
        context.get_remaining_time_in_millis.return_value = 28_000
        with (
            patch.object(
                self.module._redshift_data,
                "execute_statement",
                side_effect=[{"Id": "failed-1"}, {"Id": "failed-2"}],
            ) as execute,
            patch.object(
                self.module._redshift_data,
                "describe_statement",
                side_effect=[{"Status": "FAILED"}, {"Status": "FAILED"}],
            ),
            self.assertRaises(self.module.QueryFailure),
        ):
            self.module._execute_query("SELECT 1", [], context)

        self.assertEqual(2, execute.call_count)

    def test_timeout_token_resumes_across_an_idempotency_window_boundary(self) -> None:
        """A pending response pins its statement even when the clock enters a new token window."""

        context = Mock()
        context.get_remaining_time_in_millis.return_value = 28_000
        with (
            patch.object(self.module, "_query_wait_seconds", return_value=0),
            patch.object(
                self.module._redshift_data,
                "execute_statement",
                return_value={"Id": "still-running"},
            ) as execute,
            patch.object(self.module._redshift_data, "cancel_statement") as cancel,
        ):
            with (
                patch.object(
                    self.module.time,
                    "time",
                    return_value=self.module.QUERY_TOKEN_WINDOW_SECONDS - 1,
                ),
                self.assertRaises(self.module.QueryTimeout) as initial_timeout,
            ):
                self.module._execute_query("SELECT 1", [], context)
            query_token = str(initial_timeout.exception)
            with (
                patch.object(
                    self.module.time,
                    "time",
                    return_value=self.module.QUERY_TOKEN_WINDOW_SECONDS + 1,
                ),
                self.assertRaises(self.module.QueryTimeout) as resumed_timeout,
            ):
                self.module._execute_query("SELECT 1", [], context, query_token)

        self.assertEqual(query_token, str(resumed_timeout.exception))
        self.assertRegex(query_token, r"^[0-9a-f]{64}$")
        self.assertEqual(2, execute.call_count)
        self.assertEqual(
            execute.call_args_list[0].kwargs["ClientToken"],
            execute.call_args_list[1].kwargs["ClientToken"],
        )
        cancel.assert_not_called()

    def test_resume_token_cannot_be_reused_for_another_query(self) -> None:
        """A server token is bound to the fixed SQL and validated parameter set."""

        with patch.object(self.module.time, "time", return_value=1_000):
            query_token = self.module._query_client_token("SELECT 1", [], 0)
            with self.assertRaisesRegex(ValueError, "invalid or expired"):
                self.module._query_token_attempt("SELECT 2", [], query_token)

    def test_query_client_token_is_scoped_by_query_attempt_and_time_window(self) -> None:
        """Idempotency tokens reuse only the same query attempt inside one bounded window."""

        parameters = [{"name": "from_date", "value": "2026-08-01"}]
        with patch.object(self.module.time, "time", return_value=1_000):
            original = self.module._query_client_token("SELECT 1", parameters, 0)
            same_query = self.module._query_client_token("SELECT 1", parameters, 0)
            new_attempt = self.module._query_client_token("SELECT 1", parameters, 1)
        with patch.object(
            self.module.time,
            "time",
            return_value=1_000 + self.module.QUERY_TOKEN_WINDOW_SECONDS,
        ):
            next_window = self.module._query_client_token("SELECT 1", parameters, 0)

        self.assertRegex(original, r"^[0-9a-f]{64}$")
        self.assertEqual(original, same_query)
        self.assertNotEqual(original, new_attempt)
        self.assertNotEqual(original, next_window)

    def test_shapes_campaign_funnel_and_click_location(self) -> None:
        """Campaign rows become totals, conversion rates, series, and safe click dimensions."""

        rows = [
            {
                "row_type": "summary",
                "dimension_1": "2026-08-29",
                "metric_1": 100,
                "metric_2": 40,
                "metric_3": 10,
                "metric_4": 5,
            },
            {
                "row_type": "daily",
                "date_value": "2026-08-29",
                "metric_1": 100,
                "metric_2": 40,
                "metric_3": 10,
                "metric_4": 5,
            },
            {
                "row_type": "click_location",
                "dimension_1": "/challenges",
                "dimension_2": "main",
                "dimension_3": "register",
                "dimension_4": "button",
                "dimension_5": "www.topcoder-dev.com",
                "dimension_6": "/challenges/123",
                "metric_1": 8,
                "metric_2": 6,
            },
        ]
        with patch.object(self.module, "_execute_query", return_value=rows):
            response = self.module.handler(
                self._event(
                    "GET /v1/analytics/campaign",
                    ["analytics"],
                    {"from": "2026-08-01", "to": "2026-08-30"},
                ),
                None,
            )

        body = json.loads(response["body"])
        self.assertEqual(200, response["statusCode"])
        self.assertEqual(40.0, body["totals"]["clickThroughPercent"])
        self.assertEqual(50.0, body["totals"]["registrationToSubmissionPercent"])
        self.assertNotIn("xBucket", body["clickLocations"][0])
        self.assertNotIn("yBucket", body["clickLocations"][0])

    def test_campaign_query_groups_clicks_by_semantic_item(self) -> None:
        """Campaign click rankings do not split one item by viewport position."""

        self.assertNotIn("click_x_bucket", self.module.CAMPAIGN_SQL)
        self.assertNotIn("click_y_bucket", self.module.CAMPAIGN_SQL)

    def test_shapes_general_report(self) -> None:
        """General rows retain page, source, and surface dimensions."""

        rows = [
            {
                "row_type": "summary",
                "dimension_1": "2026-08-30",
                "metric_1": 30,
                "metric_2": 20,
                "metric_3": 10,
                "metric_4": 8,
            },
            {
                "row_type": "page",
                "dimension_1": "topcoder_website",
                "dimension_2": "/challenges",
                "metric_1": 12,
                "metric_2": 9,
            },
        ]
        with patch.object(self.module, "_execute_query", return_value=rows):
            response = self.module.handler(
                self._event(
                    "GET /v1/analytics/general",
                    ["analytics"],
                    {"from": "2026-08-01", "to": "2026-08-30"},
                ),
                None,
            )

        body = json.loads(response["body"])
        self.assertEqual(30, body["totals"]["pageViews"])
        self.assertEqual("/challenges", body["pages"][0]["path"])


if __name__ == "__main__":
    unittest.main()
