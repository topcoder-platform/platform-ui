"""Execute SpaceTech aggregation on synthetic events (pip install -r tests/requirements.txt)."""
import re
import unittest
from unittest.mock import patch

from test_handler import _load_handler

try:
    import duckdb
except ImportError:
    duckdb = None


@unittest.skipUnless(duckdb, "Install tests/requirements.txt to execute the SQL regression tests")
class SpaceTechSqlTests(unittest.TestCase):
    def setUp(self):
        self.handler = _load_handler()
        self.db = duckdb.connect()
        self.db.execute("CREATE SCHEMA topcoder_web")
        self.db.execute("""CREATE TABLE topcoder_web.spacetech_events_mv_v2 (
            event_timestamp TIMESTAMP, analytics_user_id VARCHAR, event_name VARCHAR,
            source VARCHAR, medium VARCHAR, campaign VARCHAR, content VARCHAR, country VARCHAR,
            device VARCHAR, user_engagement_time_msec BIGINT, placement VARCHAR, element_id VARCHAR, faq_id VARCHAR
        )""")
        self.params = dict(from_date="2026-11-04", to_date="2026-11-17",
                           source="*", medium="*", campaign="*", content="*")

    def tearDown(self):
        self.db.close()

    def event(self, day, user, event="_page_view", persona="george", source="email", medium="email",
              content="post", campaign=None, engagement=0):
        self.db.execute("INSERT INTO topcoder_web.spacetech_events_mv_v2 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [
            day, user, event, source, medium,
            campaign if campaign is not None else f"customer_spacetech_nov26_{persona}_w02_nasa_crater",
            content, "AU", "Desktop", engagement, "hero", "cta", "faq",
        ])

    def report(self):
        # Only dialect differences are named parameters and DATEADD. GROUP BY,
        # DISTINCT, persona extraction and all metric expressions execute unchanged.
        sql = re.sub(r"(?<!:):([a-z_]+)", r"$\1", self.handler.SPACETECH_SQL)
        sql = sql.replace("DATEADD(day, 1, CAST($to_date AS timestamp))",
                          "(CAST($to_date AS timestamp) + INTERVAL '1 day')")
        result = self.db.execute(sql, self.params)
        rows = [dict(zip([column[0] for column in result.description], row)) for row in result.fetchall()]
        filters = {"from": self.params["from_date"], "to": self.params["to_date"]}
        with patch.object(self.handler, "_execute_query", return_value=rows):
            return self.handler._spacetech_report(filters, None)

    def test_distinct_personas_rates_week_boundaries_and_filters(self):
        # Same person visits different links/sources/days/weeks: totals must deduplicate.
        self.event("2026-11-04", "one")
        self.event("2026-11-08 23:59:59", "one", source="linkedin", medium="social", content="other")
        self.event("2026-11-09", "one")
        self.event("2026-11-09", "two")
        for event in ("form_started", "form_completed", "form_section_reached"):
            self.event("2026-11-04", "one", event=event)
            self.event("2026-11-09", "one", event=event)
        self.event("2026-11-04", "one", event="_user_engagement", engagement=31000)
        # Other personas, uppercase naming, suffixes, and unknown campaigns.
        self.event("2026-11-05", "one", persona="ANITA")
        self.event("2026-11-05", "three", persona="tony")
        self.event("2026-11-05", "four", persona="topcoder")
        self.event("2026-11-05", "five", persona="georgetown", source="george")
        self.event("2026-11-05", "six", campaign="", source="topcoder", medium="anita")
        self.event("2026-11-05", "seven", campaign="other_spacetech_nov26_george")
        self.event("2026-11-05", "eight", campaign="customer_spacetech_nov26_unknown_george")
        # Both edges are excluded despite sharing a week with included dates.
        self.event("2026-11-03 23:59:59", "outside")
        self.event("2026-11-18", "outside")
        report = self.report()
        george = report["personas"][1]
        self.assertEqual((george["pageViews"], george["visitors"], george["starts"], george["submissions"],
                          george["reached"], george["submissionRate"], george["averageEngagementSeconds"]),
                         (4, 2, 2, 2, 1, 100, 7.75))
        self.assertEqual([row["visitors"] for row in report["personas"]], [1, 2, 1, 1])
        self.assertEqual([row["george"]["visitors"] for row in report["personaSeries"]], [1, 2, 0])
        self.assertEqual([row["george"]["submissionRate"] for row in report["personaSeries"]], [100, 50, 0])
        self.assertEqual(report["totals"]["pageViews"], 11)
        self.params.update(source="linkedin", medium="social", content="other")
        report = self.report()
        self.assertEqual(report["personas"][1]["pageViews"], 1)
        self.assertEqual(report["personas"][1]["submissions"], 0)
        self.assertEqual(report["personas"][2]["visitors"], 0)
        self.assertIn("email", report["filterOptions"]["source"])
        self.params["campaign"] = "missing"
        self.assertTrue(all(row["pageViews"] == 0 for row in self.report()["personas"]))

    def test_empty_and_zero_denominators(self):
        report = self.report()
        self.assertEqual(len(report["personas"]), 4)
        self.assertEqual(len(report["personaSeries"]), 3)
        self.event("2026-11-04", "one", event="form_completed")
        self.event("2026-11-04", "one", event="_user_engagement", engagement=10000)
        george = self.report()["personas"][1]
        self.assertEqual(george["submissions"], 1)
        self.assertEqual(george["submissionRate"], 0)
        self.assertEqual(george["averageEngagementSeconds"], 0)
