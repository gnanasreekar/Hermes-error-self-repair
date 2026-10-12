"""Offline tests for the read-only error-tracker API."""
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from dashboard import plugin_api


class ErrorTrackerApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.home = Path(self.temp_dir.name)

    def tearDown(self):
        self.temp_dir.cleanup()

    def call_api(self):
        with patch.dict(os.environ, {"HERMES_HOME": str(self.home)}):
            return plugin_api.get_errors()

    def test_recent_errors_are_newest_first(self):
        logs = self.home / "logs"
        logs.mkdir()
        (logs / "errors.log").write_text("older error\n\nnewer error\n", encoding="utf-8")

        result = self.call_api()

        self.assertEqual([item["line"] for item in result["errors"]], ["newer error", "older error"])
        self.assertEqual(result["recoveries"], [])

    def test_recovery_records_are_parsed_newest_first(self):
        cron = self.home / "cron"
        cron.mkdir()
        records = [
            {"job_id": "test-1", "name": "example-job", "previous_next_run_at": "t1", "rearmed_at": "t2"},
            {"job_id": "test-2", "name": "another-example", "previous_next_run_at": "t3", "rearmed_at": "t4"},
        ]
        (cron / "persisted_error_recoveries.jsonl").write_text(
            "\n".join(json.dumps(record) for record in records) + "\nnot-json\n",
            encoding="utf-8",
        )

        result = self.call_api()

        self.assertEqual([item["timestamp"] for item in result["recoveries"]], ["t4", "t2"])
        self.assertEqual(result["recoveries"][0]["event"], "Scheduled job re-armed: another-example")
        self.assertIn("Previous next-run time: t3", result["recoveries"][0]["details"])

    def test_missing_files_return_empty_lists(self):
        self.assertEqual(self.call_api(), {"errors": [], "recoveries": []})

    def test_router_exposes_plugin_scoped_endpoint(self):
        paths = {getattr(route, "path", None) for route in plugin_api.router.routes}
        self.assertIn("/errors", paths)


if __name__ == "__main__":
    unittest.main()
