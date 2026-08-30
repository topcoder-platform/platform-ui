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
    ) -> dict[str, object]:
        """Build one API Gateway v2 event.

        Args:
            route_key: API Gateway route key.
            roles: Namespaced role claim value.
            query: Optional query string parameters.

        Returns:
            Synthetic API Gateway event.

        Raises:
            Does not raise.
        """

        claims = {}
        if roles is not None:
            claims["https://topcoder-dev.com/roles"] = roles
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

    def test_campaign_sql_uses_redshift_coordinate_concatenation(self) -> None:
        """Click-coordinate buckets use Redshift-compatible two-operand concatenation."""

        self.assertNotIn("CONCAT(", self.module.CAMPAIGN_SQL)
        self.assertIn("|| ':' ||", self.module.CAMPAIGN_SQL)

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
                "dimension_7": "40:60",
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
        self.assertEqual(40, body["clickLocations"][0]["xBucket"])
        self.assertEqual(60, body["clickLocations"][0]["yBucket"])

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
