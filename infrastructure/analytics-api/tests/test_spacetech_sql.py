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
        self.db.execute("""CREATE TABLE topcoder_web.spacetech_form_events_v1 (
            event_timestamp TIMESTAMP, visitor_id VARCHAR, session_id VARCHAR, event_name VARCHAR,
            source VARCHAR, medium VARCHAR, campaign VARCHAR, content VARCHAR
        )""")
        self.params = dict(from_date="2026-11-05", to_date="2026-11-17",
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
        self.event("2026-11-04 23:59:59", "before", source="pre-launch")
        self.assertIsNone(self.report()["dataThrough"])
        # Same person visits different links/sources/days/weeks: totals must deduplicate.
        self.event("2026-11-05", "one")
        self.event("2026-11-08 23:59:59", "one", source="linkedin", medium="social", content="other")
        self.event("2026-11-09", "one")
        self.event("2026-11-09", "two")
        for event in ("form_started", "form_completed", "form_section_reached"):
            self.event("2026-11-05", "one", event=event)
            self.event("2026-11-09", "one", event=event)
        self.event("2026-11-05", "one", event="_user_engagement", engagement=31000)
        # Other personas, uppercase naming, suffixes, and unknown campaigns.
        self.event("2026-11-05", "one", persona="ANITA")
        self.event("2026-11-05", "three", persona="tony")
        self.event("2026-11-05", "four", persona="topcoder")
        self.event("2026-11-05", "five", persona="georgetown", source="george")
        self.event("2026-11-05", "six", campaign="", source="topcoder", medium="anita")
        self.event("2026-11-05", "seven", campaign="other_spacetech_nov26_george")
        self.event("2026-11-05", "eight", campaign="customer_spacetech_nov26_unknown_george")
        # The day after the range is excluded despite sharing the final week.
        self.event("2026-11-18", "outside")
        report = self.report()
        self.assertNotIn("pre-launch", report["filterOptions"]["source"])
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
        self.event("2026-11-05", "one", event="form_completed")
        self.event("2026-11-05", "one", event="_user_engagement", engagement=10000)
        george = self.report()["personas"][1]
        self.assertEqual(george["submissions"], 1)
        self.assertEqual(george["submissionRate"], 0)
        self.assertEqual(george["averageEngagementSeconds"], 0)

    def form_event(self, time, visitor, event, session="session", source="email", campaign="campaign"):
        self.db.execute("INSERT INTO topcoder_web.spacetech_form_events_v1 VALUES (?,?,?,?,?,?,?,?)",
                        [time, visitor, session, event, source, "social", campaign, "post"])

    def test_form_status_lifecycle_repeat_attempts_and_private_fields(self):
        self.form_event("2026-11-05 10:00:00", "started", "form_started")
        self.form_event("2026-11-05 11:00:00", "incomplete", "form_started")
        self.form_event("2026-11-05 11:01:00", "incomplete", "form_abandoned")
        # A completion wins even if a pagehide abandonment arrived first.
        self.form_event("2026-11-05 12:00:00", "completed", "form_started")
        self.form_event("2026-11-05 12:01:00", "completed", "form_abandoned")
        self.form_event("2026-11-05 12:02:00", "completed", "form_completed")
        # A later successful attempt must not erase a previous incomplete one.
        self.form_event("2026-11-05 13:00:00", "repeat", "form_started")
        self.form_event("2026-11-05 13:01:00", "repeat", "form_abandoned")
        self.form_event("2026-11-05 14:00:00", "repeat", "form_started")
        self.form_event("2026-11-05 14:01:00", "repeat", "form_completed")
        self.form_event("2026-11-05 15:00:00", "repeat", "form_started")
        # Same visitor, different session: must not suppress the unsubmitted attempt.
        self.form_event("2026-11-05 15:01:00", "repeat", "form_completed", session="other")
        activity = self.report()["formActivity"]
        self.assertEqual(len(activity), 4)
        self.assertEqual(sorted(row["status"] for row in activity),
                         ["Incomplete", "Incomplete", "Started", "Started"])
        self.assertTrue(all(set(row) == {"startedAt", "status", "source", "medium", "campaign"}
                            for row in activity))
        self.assertTrue(all(row["source"] == "email" for row in activity))

    def test_form_status_date_and_attribution_filters_do_not_hide_terminal_events(self):
        # Status is latest observed, even when completion is outside the start date range
        # or its UTM values differ. Starts outside the selected dates remain excluded.
        self.form_event("2026-11-17 23:59:00", "complete", "form_started")
        self.form_event("2026-11-18 00:01:00", "complete", "form_completed", source="changed")
        self.form_event("2026-11-17 23:59:00", "left", "form_started")
        self.form_event("2026-11-18 00:01:00", "left", "form_abandoned", source="changed")
        self.form_event("2026-11-04 23:59:00", "before", "form_started")
        self.form_event("2026-11-18 00:00:00", "after", "form_started")
        self.form_event("2026-11-05 00:00:00", "other-source", "form_started", source="linkedin")
        self.form_event("2026-11-05 00:00:00", "other-campaign", "form_started", campaign="other")
        self.params.update(source="email", medium="social", campaign="campaign", content="post")
        self.assertEqual(self.report()["formActivity"], [{
            "startedAt": "2026-11-17T23:59:00.000Z", "source": "email", "medium": "social",
            "campaign": "campaign", "status": "Incomplete",
        }])
        self.params["source"] = "missing"
        self.assertEqual(self.report()["formActivity"], [])
