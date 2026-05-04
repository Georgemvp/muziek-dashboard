"""
Unit tests voor core/soulseek_client.py — HTTP responses worden gemockt met unittest.mock.
"""
from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch


def _make_response(json_data, status_code=200):
    """Helper: bouw een nep-requests.Response object."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data
    resp.raise_for_status = MagicMock()
    return resp


class TestGetStatus(unittest.TestCase):
    def test_connected(self):
        import core.soulseek_client as slsk
        resp = _make_response({"version": "1.0"})
        with patch("requests.get", return_value=resp):
            result = slsk.get_status()
        self.assertTrue(result["connected"])
        self.assertEqual(result["version"], "1.0")

    def test_disconnected(self):
        import core.soulseek_client as slsk
        with patch("requests.get", side_effect=ConnectionError("refused")):
            result = slsk.get_status()
        self.assertFalse(result["connected"])
        self.assertIn("refused", result["reason"])


class TestRankResults(unittest.TestCase):
    def setUp(self):
        import core.soulseek_client as slsk
        self.slsk = slsk

    def _peer(self, username, upload_speed=0, queue_length=0, free_slot=False, files=None):
        return {
            "username": username,
            "uploadSpeed": upload_speed,
            "queueLength": queue_length,
            "hasFreeUploadSlot": free_slot,
            "files": files or [],
        }

    def _file(self, filename, size=10_000_000, bitrate=None):
        return {"filename": filename, "size": size, "bitRate": bitrate}

    def test_flac_ranked_above_mp3(self):
        peers = [
            self._peer("user_mp3", files=[self._file("track.mp3", bitrate=320)]),
            self._peer("user_flac", files=[self._file("track.flac")]),
        ]
        results = self.slsk._rank_results(peers)
        self.assertTrue(results[0].score > results[1].score)
        self.assertEqual(results[0].username, "user_flac")

    def test_mp3_below_320_filtered(self):
        peers = [self._peer("u", files=[self._file("track.mp3", bitrate=128)])]
        results = self.slsk._rank_results(peers)
        self.assertEqual(results, [])

    def test_free_slot_bonus(self):
        peers = [
            self._peer("slow", upload_speed=0, free_slot=False,
                       files=[self._file("track.flac")]),
            self._peer("fast", upload_speed=0, free_slot=True,
                       files=[self._file("track.flac")]),
        ]
        results = self.slsk._rank_results(peers)
        self.assertEqual(results[0].username, "fast")

    def test_upload_speed_bonus(self):
        peers = [
            self._peer("slow", upload_speed=100_000, files=[self._file("a.flac")]),
            self._peer("fast", upload_speed=2_000_000, files=[self._file("b.flac")]),
        ]
        results = self.slsk._rank_results(peers)
        self.assertEqual(results[0].username, "fast")

    def test_queue_length_penalty(self):
        peers = [
            self._peer("busy", queue_length=20, files=[self._file("a.flac")]),
            self._peer("free", queue_length=0, files=[self._file("b.flac")]),
        ]
        results = self.slsk._rank_results(peers)
        self.assertEqual(results[0].username, "free")

    def test_peer_reuse_bonus(self):
        import core.soulseek_client as slsk
        slsk._successful_peers["trusted"] = 3
        peers = [
            self._peer("new_peer", files=[self._file("a.flac")]),
            self._peer("trusted",  files=[self._file("b.flac")]),
        ]
        results = slsk._rank_results(peers)
        self.assertEqual(results[0].username, "trusted")
        slsk._successful_peers.clear()

    def test_unknown_format_filtered(self):
        peers = [self._peer("u", files=[self._file("track.wav")])]
        results = self.slsk._rank_results(peers)
        self.assertEqual(results, [])


class TestSearch(unittest.TestCase):
    def setUp(self):
        import core.soulseek_client as slsk
        self.slsk = slsk

    def _search_response(self, state="Completed", responses=None):
        return _make_response({
            "state": state,
            "responses": responses or [],
        })

    def test_search_returns_ranked_results(self):
        start_resp  = _make_response({})
        search_data = {
            "state": "Completed",
            "responses": [{
                "username": "peer1",
                "uploadSpeed": 500_000,
                "queueLength": 0,
                "hasFreeUploadSlot": True,
                "files": [{"filename": "artist - album.flac", "size": 50_000_000}],
            }],
        }
        poll_resp = _make_response(search_data)
        with patch("requests.post", return_value=start_resp), \
             patch("requests.get", return_value=poll_resp):
            results = self.slsk.search("artist album", timeout=5)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].username, "peer1")
        self.assertGreater(results[0].score, 1000)

    def test_search_start_failure_returns_empty(self):
        with patch("requests.post", side_effect=ConnectionError("refused")):
            results = self.slsk.search("query")
        self.assertEqual(results, [])

    def test_search_poll_failure_returns_empty(self):
        start_resp = _make_response({})
        with patch("requests.post", return_value=start_resp), \
             patch("requests.get", side_effect=ConnectionError("refused")), \
             patch("time.sleep"):
            results = self.slsk.search("query", timeout=1)
        self.assertEqual(results, [])


class TestDownload(unittest.TestCase):
    def test_download_returns_transfer_id(self):
        import core.soulseek_client as slsk
        from core.soulseek_client import SearchResult
        file = SearchResult(username="peer1", filename="/music/artist/track.flac",
                            size=50_000_000, score=1200.0)
        resp = _make_response([])
        with patch("requests.post", return_value=resp):
            transfer_id = slsk.download(file)
        self.assertEqual(transfer_id, "peer1|/music/artist/track.flac")

    def test_download_raises_on_http_error(self):
        import core.soulseek_client as slsk
        from core.soulseek_client import SearchResult
        file = SearchResult(username="peer1", filename="/music/track.flac",
                            size=1000, score=1000.0)
        resp = _make_response({}, status_code=401)
        resp.raise_for_status.side_effect = Exception("401 Unauthorized")
        with patch("requests.post", return_value=resp), self.assertRaises(RuntimeError):
            slsk.download(file)


class TestGetDownloadStatus(unittest.TestCase):
    def test_found_and_completed(self):
        import core.soulseek_client as slsk
        slsk._successful_peers.clear()
        transfer_id = "peer1|/music/track.flac"
        api_data = [{
            "files": [{
                "filename": "/music/track.flac",
                "state": "Completed, Succeeded",
                "size": 50_000_000,
                "bytesTransferred": 50_000_000,
                "localFilename": "/data/downloads/track.flac",
            }]
        }]
        resp = _make_response(api_data)
        with patch("requests.get", return_value=resp):
            status = slsk.get_download_status(transfer_id)
        self.assertEqual(status.state, "Completed, Succeeded")
        self.assertEqual(status.size, 50_000_000)
        # Peer-reuse counter moet zijn bijgewerkt
        self.assertEqual(slsk._successful_peers.get("peer1"), 1)
        slsk._successful_peers.clear()

    def test_not_found(self):
        import core.soulseek_client as slsk
        resp = _make_response([])
        with patch("requests.get", return_value=resp):
            status = slsk.get_download_status("peer1|/missing.flac")
        self.assertEqual(status.state, "NotFound")

    def test_api_error(self):
        import core.soulseek_client as slsk
        with patch("requests.get", side_effect=ConnectionError("refused")):
            status = slsk.get_download_status("peer1|/track.flac")
        self.assertEqual(status.state, "Error")


class TestGetCompletedPath(unittest.TestCase):
    def test_returns_local_path(self):
        import core.soulseek_client as slsk
        api_data = [{
            "files": [{
                "filename": "/remote/track.flac",
                "localFilename": "/data/downloads/track.flac",
            }]
        }]
        resp = _make_response(api_data)
        with patch("requests.get", return_value=resp):
            path = slsk.get_completed_path("peer1|/remote/track.flac")
        self.assertEqual(path, "/data/downloads/track.flac")

    def test_returns_empty_on_error(self):
        import core.soulseek_client as slsk
        with patch("requests.get", side_effect=ConnectionError()):
            path = slsk.get_completed_path("peer1|/track.flac")
        self.assertEqual(path, "")


if __name__ == "__main__":
    unittest.main()
