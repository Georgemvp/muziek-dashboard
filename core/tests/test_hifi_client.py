"""
Unit tests voor core/hifi_client.py — HTTP responses worden gemockt met unittest.mock.
"""
from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch, call


def _make_response(json_data=None, status_code=200, content=b""):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    resp.raise_for_status = MagicMock()
    resp.iter_content = MagicMock(return_value=iter([content] if content else [b"FLACDATA"]))
    return resp


class TestGetStatus(unittest.TestCase):
    def test_connected(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            resp = _make_response({"ok": True})
            with patch("requests.get", return_value=resp):
                result = hifi.get_status()
        self.assertTrue(result["connected"])
        self.assertEqual(result["instance"], "http://hifi.test")

    def test_disconnected_all_instances(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://hifi1.test", "http://hifi2.test"]):
            with patch("requests.get", side_effect=ConnectionError("refused")):
                result = hifi.get_status()
        self.assertFalse(result["connected"])

    def test_no_instances_configured(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", []):
            result = hifi.get_status()
        self.assertFalse(result["connected"])


class TestSearch(unittest.TestCase):
    def test_search_returns_tracks(self):
        import core.hifi_client as hifi
        search_results = {
            "results": [
                {"id": "1", "title": "Song A", "artist": "Artist X",
                 "album": "Album Y", "duration": 240, "format": "flac"},
                {"id": "2", "title": "Song B", "artist": "Artist X",
                 "album": "Album Y", "duration": 180, "format": "flac"},
            ]
        }
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            resp = _make_response(search_results)
            with patch("requests.get", return_value=resp):
                tracks = hifi.search("Artist X Song A")
        self.assertEqual(len(tracks), 2)
        self.assertEqual(tracks[0].track_id, "1")
        self.assertEqual(tracks[0].title, "Song A")
        self.assertEqual(tracks[0].artist, "Artist X")
        self.assertEqual(tracks[0].instance, "http://hifi.test")

    def test_search_with_artist_param(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            resp = _make_response({"results": []})
            with patch("requests.get", return_value=resp) as mock_get:
                hifi.search("Song A", artist="Artist X")
        called_url = mock_get.call_args[0][0]
        self.assertIn("artist=Artist+X", called_url)

    def test_search_falls_back_to_next_instance(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://dead.test", "http://live.test"]):
            dead_resp = _make_response(status_code=503)
            dead_resp.raise_for_status.side_effect = Exception("503")
            live_resp = _make_response({"results": [
                {"id": "1", "title": "T", "artist": "A"}
            ]})

            def side_effect(url, **kwargs):
                if "dead" in url:
                    raise ConnectionError("refused")
                return live_resp

            with patch("requests.get", side_effect=side_effect):
                tracks = hifi.search("T")
        self.assertEqual(len(tracks), 1)
        self.assertEqual(tracks[0].instance, "http://live.test")

    def test_search_returns_empty_on_all_failures(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            with patch("requests.get", side_effect=ConnectionError("refused")):
                tracks = hifi.search("query")
        self.assertEqual(tracks, [])

    def test_search_handles_list_response(self):
        import core.hifi_client as hifi
        api_list = [{"id": "5", "title": "T", "artist": "A"}]
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            resp = _make_response(api_list)
            resp.json.return_value = api_list
            with patch("requests.get", return_value=resp):
                tracks = hifi.search("T")
        self.assertEqual(len(tracks), 1)


class TestGetStreamUrl(unittest.TestCase):
    def test_returns_stream_url_from_metadata(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            resp = _make_response({"stream_url": "http://hifi.test/stream/abc123"})
            with patch("requests.get", return_value=resp):
                url = hifi.get_stream_url("abc123", instance="http://hifi.test")
        self.assertEqual(url, "http://hifi.test/stream/abc123")

    def test_falls_back_to_constructed_url(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
            with patch("requests.get", side_effect=ConnectionError()):
                url = hifi.get_stream_url("xyz", instance="http://hifi.test")
        self.assertEqual(url, "http://hifi.test/api/stream/xyz")

    def test_no_instances_raises(self):
        import core.hifi_client as hifi
        with patch.object(hifi, "INSTANCES", []):
            with self.assertRaises(RuntimeError):
                hifi.get_stream_url("abc")


class TestDownload(unittest.TestCase):
    def test_download_writes_file(self):
        import core.hifi_client as hifi
        from core.hifi_client import Track
        track = Track(track_id="1", title="My Song", artist="My Artist",
                      album="My Album", format="flac", instance="http://hifi.test")

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
                meta_resp = _make_response({"stream_url": "http://hifi.test/stream/1"})
                dl_resp   = _make_response(content=b"\x66\x4c\x61\x43")  # fLaC magic bytes
                dl_resp.iter_content.return_value = iter([b"\x66\x4c\x61\x43"])

                with patch("requests.get", side_effect=[meta_resp, dl_resp]):
                    path = hifi.download(track, tmpdir)

            self.assertTrue(Path(path).exists())
            self.assertTrue(path.endswith(".flac"))
            self.assertIn("My Artist", path)
            self.assertIn("My Song", path)

    def test_download_raises_on_http_error(self):
        import core.hifi_client as hifi
        from core.hifi_client import Track
        track = Track(track_id="1", title="T", artist="A", instance="http://hifi.test")

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
                meta_resp  = _make_response({"stream_url": "http://hifi.test/stream/1"})
                error_resp = _make_response(status_code=404)
                error_resp.raise_for_status.side_effect = Exception("404")

                with patch("requests.get", side_effect=[meta_resp, error_resp]):
                    with self.assertRaises(RuntimeError):
                        hifi.download(track, tmpdir)

    def test_download_filename_sanitized(self):
        import core.hifi_client as hifi
        from core.hifi_client import Track
        track = Track(track_id="99", title="My/Song:With<Bad>Chars",
                      artist="Art/ist\\X", instance="http://hifi.test")

        with tempfile.TemporaryDirectory() as tmpdir:
            with patch.object(hifi, "INSTANCES", ["http://hifi.test"]):
                meta_resp = _make_response({"stream_url": "http://hifi.test/stream/99"})
                dl_resp   = _make_response()
                dl_resp.iter_content.return_value = iter([b"data"])

                with patch("requests.get", side_effect=[meta_resp, dl_resp]):
                    path = hifi.download(track, tmpdir)

            filename = Path(path).name
            # Geen schadelijke tekens in bestandsnaam
            for c in "/\\:*?\"<>|":
                self.assertNotIn(c, filename)


if __name__ == "__main__":
    unittest.main()
