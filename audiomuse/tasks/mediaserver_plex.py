# tasks/mediaserver_plex.py

import requests
import logging
import os
from datetime import datetime, timezone
import config

from tasks.mediaserver_helper import detect_path_format

logger = logging.getLogger(__name__)

REQUESTS_TIMEOUT = 300

# ##############################################################################
# PLEX IMPLEMENTATION
# ##############################################################################

# Module-level cache for music section ID and machine identifier
_music_section_id_cache = None
_machine_identifier_cache = None


def _plex_base_url(user_creds=None):
    """Returns the Plex base URL, stripping trailing slash."""
    url = (user_creds.get('url') if user_creds and user_creds.get('url')
           else getattr(config, 'PLEX_URL', ''))
    return url.rstrip('/')


def _plex_token(user_creds=None):
    """Returns the Plex token from user_creds or config."""
    return (user_creds.get('token') if user_creds and user_creds.get('token')
            else getattr(config, 'PLEX_TOKEN', ''))


def _plex_headers(user_creds=None):
    """Returns request headers with Accept: application/json and X-Plex-Token."""
    return {
        'Accept': 'application/json',
        'X-Plex-Token': _plex_token(user_creds),
    }


def _get_music_section_id(user_creds=None):
    """
    Finds and caches the music library section ID from /library/sections.
    Returns None if no music section is found.
    """
    global _music_section_id_cache
    if _music_section_id_cache is not None:
        return _music_section_id_cache

    url = f"{_plex_base_url(user_creds)}/library/sections"
    try:
        r = requests.get(url, headers=_plex_headers(user_creds), timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        sections = data.get('MediaContainer', {}).get('Directory', [])
        for section in sections:
            if section.get('type') == 'artist':  # Plex music library type is 'artist'
                _music_section_id_cache = section.get('key')
                logger.info(f"Found Plex music section ID: {_music_section_id_cache} ('{section.get('title')}')")
                return _music_section_id_cache
        logger.warning("No music library section found in Plex. Available sections: "
                       + str([s.get('title') for s in sections]))
        return None
    except Exception as e:
        logger.error(f"Plex _get_music_section_id failed: {e}", exc_info=True)
        return None


def _get_machine_identifier(user_creds=None):
    """
    Fetches and caches the Plex server machineIdentifier from the root endpoint.
    Required for building playlist URIs.
    """
    global _machine_identifier_cache
    if _machine_identifier_cache is not None:
        return _machine_identifier_cache

    url = f"{_plex_base_url(user_creds)}/"
    try:
        r = requests.get(url, headers=_plex_headers(user_creds), timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        machine_id = data.get('MediaContainer', {}).get('machineIdentifier')
        if machine_id:
            _machine_identifier_cache = machine_id
            logger.info(f"Found Plex machineIdentifier: {machine_id}")
        else:
            logger.warning("machineIdentifier not found in Plex root response.")
        return machine_id
    except Exception as e:
        logger.error(f"Plex _get_machine_identifier failed: {e}", exc_info=True)
        return None


def _timestamp_to_iso(timestamp):
    """Converts a Unix timestamp (int) to an ISO 8601 datetime string."""
    if not timestamp:
        return None
    try:
        return datetime.fromtimestamp(int(timestamp), tz=timezone.utc).isoformat()
    except (ValueError, TypeError, OSError):
        return None


def _extract_track(item):
    """
    Normalises a raw Plex track metadata dict into the standard AudioMuse track dict.
    Keys: Id, Name, AlbumArtist, Album, Year, FilePath, ArtistId, Container, IndexNumber
    """
    media = item.get('Media', [])
    part = media[0].get('Part', []) if media else []
    file_path = part[0].get('file') if part else None
    container = media[0].get('container') if media else None

    return {
        'Id':           str(item.get('ratingKey', '')),
        'Name':         item.get('title', 'Unknown'),
        'AlbumArtist':  item.get('grandparentTitle', 'Unknown Artist'),
        'Album':        item.get('parentTitle', 'Unknown Album'),
        'Year':         item.get('year') or item.get('parentYear'),
        'FilePath':     file_path,
        'ArtistId':     str(item.get('grandparentRatingKey', '')) or None,
        'Container':    container,
        'IndexNumber':  item.get('index'),
    }


# ##############################################################################
# PUBLIC API — mirrors mediaserver_jellyfin.py interface
# ##############################################################################

def get_all_songs(user_creds=None):
    """
    Fetches all tracks from the Plex music library.
    GET /library/sections/{id}/all?type=10
    """
    section_id = _get_music_section_id(user_creds)
    if not section_id:
        logger.error("Plex get_all_songs: no music section found.")
        return []

    url = f"{_plex_base_url(user_creds)}/library/sections/{section_id}/all"
    params = {'type': 10}
    all_tracks = []
    offset = 0
    page_size = 500

    while True:
        params.update({'X-Plex-Container-Start': offset, 'X-Plex-Container-Size': page_size})
        try:
            r = requests.get(url, headers=_plex_headers(user_creds), params=params, timeout=REQUESTS_TIMEOUT)
            r.raise_for_status()
            container = r.json().get('MediaContainer', {})
            items = container.get('Metadata', [])
            if not items:
                break
            for item in items:
                all_tracks.append(_extract_track(item))
            offset += len(items)
            if len(items) < page_size:
                break
        except Exception as e:
            logger.error(f"Plex get_all_songs failed at offset {offset}: {e}", exc_info=True)
            break

    logger.info(f"Plex get_all_songs: fetched {len(all_tracks)} tracks.")
    return all_tracks


def get_recent_albums(limit):
    """
    Fetches recently added albums from the Plex music library.
    GET /library/sections/{id}/recentlyAdded?type=9
    """
    section_id = _get_music_section_id()
    if not section_id:
        logger.error("Plex get_recent_albums: no music section found.")
        return []

    fetch_all = (limit == 0)
    size = limit if not fetch_all else 200
    url = f"{_plex_base_url()}/library/sections/{section_id}/recentlyAdded"
    params = {
        'type': 9,
        'X-Plex-Container-Start': 0,
        'X-Plex-Container-Size': size,
    }
    all_albums = []
    offset = 0

    while True:
        params['X-Plex-Container-Start'] = offset
        try:
            r = requests.get(url, headers=_plex_headers(), params=params, timeout=REQUESTS_TIMEOUT)
            r.raise_for_status()
            container = r.json().get('MediaContainer', {})
            items = container.get('Metadata', [])
            if not items:
                break
            for item in items:
                all_albums.append({
                    'Id':          str(item.get('ratingKey', '')),
                    'Name':        item.get('title', 'Unknown'),
                    'DateCreated': _timestamp_to_iso(item.get('addedAt')),
                    'AlbumArtist': item.get('parentTitle') or item.get('grandparentTitle', ''),
                })
            offset += len(items)
            if not fetch_all or len(items) < size:
                break
        except Exception as e:
            logger.error(f"Plex get_recent_albums failed: {e}", exc_info=True)
            break

    if not fetch_all:
        return all_albums[:limit]
    return all_albums


def get_tracks_from_album(album_id, user_creds=None):
    """
    Fetches all tracks for a given album ID.
    GET /library/metadata/{album_id}/children
    """
    url = f"{_plex_base_url(user_creds)}/library/metadata/{album_id}/children"
    try:
        r = requests.get(url, headers=_plex_headers(user_creds), timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        items = r.json().get('MediaContainer', {}).get('Metadata', [])
        tracks = []
        for item in items:
            # Only include audio tracks (type 10)
            if item.get('type') not in ('track', None):
                continue
            track = _extract_track(item)
            tracks.append(track)
        return tracks
    except Exception as e:
        logger.error(f"Plex get_tracks_from_album failed for album {album_id}: {e}", exc_info=True)
        return []


def download_track(temp_dir, item):
    """
    Downloads a track from Plex using the Part.key path.
    GET {PLEX_URL}{part_key}?X-Plex-Token={token}
    Saves as {ratingKey}.{container} in temp_dir.
    """
    try:
        track_id = item.get('Id', 'unknown')
        container = item.get('Container', 'tmp') or 'tmp'
        file_extension = f".{container.strip().replace('/', '').replace(chr(92), '')}"

        # Build download URL: prefer FilePath-based part key if available.
        # Plex typically exposes the stream at /library/parts/{part_id}/...
        # We reconstruct it from the FilePath or fall back to the metadata endpoint.
        plex_url = _plex_base_url()
        token = _plex_token()

        # Try to get the download URL via the parts endpoint if we have FilePath
        file_path = item.get('FilePath')
        if file_path:
            # Fetch metadata to find the Part key for streaming
            meta_url = f"{plex_url}/library/metadata/{track_id}"
            meta_r = requests.get(meta_url, headers=_plex_headers(), timeout=REQUESTS_TIMEOUT)
            meta_r.raise_for_status()
            meta_items = meta_r.json().get('MediaContainer', {}).get('Metadata', [])
            part_key = None
            if meta_items:
                media = meta_items[0].get('Media', [])
                parts = media[0].get('Part', []) if media else []
                part_key = parts[0].get('key') if parts else None

            if part_key:
                download_url = f"{plex_url}{part_key}?X-Plex-Token={token}"
            else:
                download_url = f"{plex_url}/library/metadata/{track_id}/download?X-Plex-Token={token}"
        else:
            download_url = f"{plex_url}/library/metadata/{track_id}/download?X-Plex-Token={token}"

        local_filename = os.path.join(temp_dir, f"{track_id}{file_extension}")

        with requests.get(download_url, stream=True, timeout=REQUESTS_TIMEOUT) as r:
            r.raise_for_status()
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

        logger.info(f"Plex downloaded '{item.get('Name', 'Unknown')}' to '{local_filename}'")
        return local_filename

    except Exception as e:
        logger.error(f"Plex download_track failed for {item.get('Name', 'Unknown')}: {e}", exc_info=True)
        return None


def search_albums(query, user_creds=None):
    """
    Searches Plex for albums matching the query.
    GET /hubs/search?query={q}&limit=10  — filters on album-type results.
    """
    url = f"{_plex_base_url(user_creds)}/hubs/search"
    params = {'query': query, 'limit': 50}
    try:
        r = requests.get(url, headers=_plex_headers(user_creds), params=params, timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        hubs = r.json().get('MediaContainer', {}).get('Hub', [])
        results = []
        for hub in hubs:
            # Hub type 'album' or items with type 9
            if hub.get('type') not in ('album',):
                continue
            for item in hub.get('Metadata', []):
                results.append({
                    'id':          str(item.get('ratingKey', '')),
                    'name':        item.get('title'),
                    'artist':      item.get('parentTitle') or item.get('grandparentTitle'),
                    'year':        item.get('year') or item.get('parentYear'),
                    'track_count': item.get('leafCount'),
                })
                if len(results) >= 10:
                    break
            if len(results) >= 10:
                break
        return results
    except Exception as e:
        logger.error(f"Plex search_albums failed for query '{query}': {e}", exc_info=True)
        return []


def get_all_playlists():
    """
    Fetches all audio playlists from Plex.
    GET /playlists?type=audio
    """
    url = f"{_plex_base_url()}/playlists"
    params = {'type': 'audio'}
    try:
        r = requests.get(url, headers=_plex_headers(), params=params, timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        items = r.json().get('MediaContainer', {}).get('Metadata', [])
        return [
            {
                'Id':   str(item.get('ratingKey', '')),
                'Name': item.get('title', ''),
            }
            for item in items
        ]
    except Exception as e:
        logger.error(f"Plex get_all_playlists failed: {e}", exc_info=True)
        return []


def get_playlist_by_name(playlist_name):
    """Finds a Plex playlist by exact name match."""
    try:
        playlists = get_all_playlists()
        for pl in playlists:
            if pl.get('Name') == playlist_name:
                return pl
        return None
    except Exception as e:
        logger.error(f"Plex get_playlist_by_name failed for '{playlist_name}': {e}", exc_info=True)
        return None


def create_playlist(base_name, item_ids):
    """
    Creates a new audio playlist on Plex.
    POST /playlists with title, type=audio, uri=server://{machineId}/.../{ids}
    """
    machine_id = _get_machine_identifier()
    if not machine_id:
        logger.error("Plex create_playlist: could not retrieve machineIdentifier.")
        return None

    ids_str = ','.join(str(i) for i in item_ids)
    uri = f"server://{machine_id}/com.plexapp.plugins.library/library/metadata/{ids_str}"

    url = f"{_plex_base_url()}/playlists"
    params = {
        'title': base_name,
        'type': 'audio',
        'uri': uri,
    }
    try:
        r = requests.post(url, headers=_plex_headers(), params=params, timeout=REQUESTS_TIMEOUT)
        if r.ok:
            logger.info(f"✅ Created Plex playlist '{base_name}'")
            playlists = r.json().get('MediaContainer', {}).get('Metadata', [])
            return playlists[0] if playlists else None
        else:
            logger.error(f"Plex create_playlist failed with status {r.status_code}: {r.text}")
            return None
    except Exception as e:
        logger.error(f"Plex create_playlist '{base_name}' failed: {e}", exc_info=True)
        return None


def delete_playlist(playlist_id):
    """
    Deletes a Plex playlist by ID.
    DELETE /playlists/{playlist_id}
    """
    url = f"{_plex_base_url()}/playlists/{playlist_id}"
    try:
        r = requests.delete(url, headers=_plex_headers(), timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Plex delete_playlist failed for ID {playlist_id}: {e}", exc_info=True)
        return False


def create_instant_playlist(playlist_name, item_ids, user_creds=None):
    """
    Creates an instant playlist (with _instant suffix) on Plex.
    Same mechanism as create_playlist but uses user_creds if provided.
    """
    machine_id = _get_machine_identifier(user_creds)
    if not machine_id:
        logger.error("Plex create_instant_playlist: could not retrieve machineIdentifier.")
        return None

    final_name = f"{playlist_name.strip()}_instant"
    ids_str = ','.join(str(i) for i in item_ids)
    uri = f"server://{machine_id}/com.plexapp.plugins.library/library/metadata/{ids_str}"

    url = f"{_plex_base_url(user_creds)}/playlists"
    params = {
        'title': final_name,
        'type': 'audio',
        'uri': uri,
    }
    try:
        r = requests.post(url, headers=_plex_headers(user_creds), params=params, timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        playlists = r.json().get('MediaContainer', {}).get('Metadata', [])
        logger.info(f"✅ Created Plex instant playlist '{final_name}'")
        return playlists[0] if playlists else None
    except Exception as e:
        logger.error(f"Plex create_instant_playlist '{playlist_name}' failed: {e}", exc_info=True)
        return None


def get_top_played_songs(limit, user_creds=None):
    """
    Fetches the top N most-played tracks from the Plex music library,
    sorted by viewCount descending.
    GET /library/sections/{id}/all?type=10&sort=viewCount:desc
    """
    section_id = _get_music_section_id(user_creds)
    if not section_id:
        logger.error("Plex get_top_played_songs: no music section found.")
        return []

    url = f"{_plex_base_url(user_creds)}/library/sections/{section_id}/all"
    params = {
        'type': 10,
        'sort': 'viewCount:desc',
        'X-Plex-Container-Start': 0,
        'X-Plex-Container-Size': limit if limit > 0 else 500,
    }
    try:
        r = requests.get(url, headers=_plex_headers(user_creds), params=params, timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        items = r.json().get('MediaContainer', {}).get('Metadata', [])
        tracks = [_extract_track(item) for item in items]
        if limit > 0:
            tracks = tracks[:limit]
        return tracks
    except Exception as e:
        logger.error(f"Plex get_top_played_songs failed: {e}", exc_info=True)
        return []


def get_last_played_time(item_id, user_creds=None):
    """
    Fetches the lastViewedAt timestamp for a specific track and returns it
    as an ISO 8601 datetime string.
    GET /library/metadata/{item_id}
    """
    url = f"{_plex_base_url(user_creds)}/library/metadata/{item_id}"
    try:
        r = requests.get(url, headers=_plex_headers(user_creds), timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()
        items = r.json().get('MediaContainer', {}).get('Metadata', [])
        if not items:
            return None
        last_viewed_at = items[0].get('lastViewedAt')
        return _timestamp_to_iso(last_viewed_at)
    except Exception as e:
        logger.error(f"Plex get_last_played_time failed for item {item_id}: {e}", exc_info=True)
        return None


def test_connection(user_creds=None):
    """
    Tests connectivity to the Plex server.
    GETs the root endpoint, then fetches a sample of tracks and detects path format.
    """
    try:
        url = f"{_plex_base_url(user_creds)}/"
        r = requests.get(url, headers=_plex_headers(user_creds), timeout=REQUESTS_TIMEOUT)
        r.raise_for_status()

        # Reset caches so section ID is re-fetched with the provided creds
        global _music_section_id_cache, _machine_identifier_cache
        _music_section_id_cache = None
        _machine_identifier_cache = None

        section_id = _get_music_section_id(user_creds)
        if not section_id:
            return {
                'ok': False,
                'error': 'No music library section found on Plex server.',
                'sample_count': 0,
                'path_format': 'none',
                'warnings': [],
            }

        # Fetch a small sample of tracks
        sample_url = f"{_plex_base_url(user_creds)}/library/sections/{section_id}/all"
        params = {
            'type': 10,
            'X-Plex-Container-Start': 0,
            'X-Plex-Container-Size': 100,
        }
        sr = requests.get(sample_url, headers=_plex_headers(user_creds), params=params, timeout=REQUESTS_TIMEOUT)
        sr.raise_for_status()
        items = sr.json().get('MediaContainer', {}).get('Metadata', [])

        sample = [
            {
                'Id':          str(item.get('ratingKey', '')),
                'Path':        ((item.get('Media') or [{}])[0].get('Part') or [{}])[0].get('file'),
                'Name':        item.get('title', 'Unknown'),
                'AlbumArtist': item.get('grandparentTitle', 'Unknown Artist'),
            }
            for item in items
        ]

        path_format = detect_path_format(sample)
        return {
            'ok': True,
            'error': None,
            'sample_count': len(sample),
            'path_format': path_format,
            'warnings': [],
        }
    except Exception as e:
        logger.warning(f"Plex test_connection failed: {e}")
        return {
            'ok': False,
            'error': str(e),
            'sample_count': 0,
            'path_format': 'none',
            'warnings': [],
        }


def get_recent_music_items(limit):
    """
    Combines recently added albums + recent standalone tracks for comprehensive
    music discovery. Returns a unified list compatible with the analysis workflow.
    """
    albums = get_recent_albums(limit)

    # Also fetch recent tracks to catch any not properly organised in albums
    section_id = _get_music_section_id()
    standalone_tracks = []
    if section_id:
        standalone_limit = min(limit, 100) if limit > 0 else 100
        track_url = f"{_plex_base_url()}/library/sections/{section_id}/recentlyAdded"
        params = {
            'type': 10,
            'X-Plex-Container-Start': 0,
            'X-Plex-Container-Size': standalone_limit,
        }
        try:
            r = requests.get(track_url, headers=_plex_headers(), params=params, timeout=REQUESTS_TIMEOUT)
            r.raise_for_status()
            items = r.json().get('MediaContainer', {}).get('Metadata', [])
            # Only include tracks that don't belong to an album already in our list
            known_album_ids = {a['Id'] for a in albums}
            for item in items:
                parent_id = str(item.get('parentRatingKey', ''))
                if parent_id and parent_id not in known_album_ids:
                    track = _extract_track(item)
                    standalone_tracks.append(track)
        except Exception as e:
            logger.error(f"Plex get_recent_music_items (tracks) failed: {e}", exc_info=True)

    # Wrap standalone tracks as pseudo-albums for workflow compatibility
    pseudo_albums = []
    for track in standalone_tracks:
        pseudo_albums.append({
            'Id':            f"standalone_{track['Id']}",
            'Name':          f"Standalone: {track.get('Name', 'Unknown')}",
            'Type':          'PseudoAlbum',
            'StandaloneTrack': track,
            'DateCreated':   _timestamp_to_iso(None),
            'AlbumArtist':   track.get('AlbumArtist', 'Unknown Artist'),
        })

    all_items = albums + pseudo_albums

    if albums and pseudo_albums:
        all_items.sort(key=lambda x: x.get('DateCreated') or '', reverse=True)

    if limit > 0:
        all_items = all_items[:limit]

    if pseudo_albums:
        logger.info(f"Plex get_recent_music_items: {len(albums)} albums + "
                    f"{len(pseudo_albums)} standalone tracks = {len(all_items)} total.")

    return all_items
