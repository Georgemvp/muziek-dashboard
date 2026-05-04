"""
genre_filter.py — Genre whitelist filter voor enrichment workers.

Filtert junk-genres uit verrijkte metadata. Vergelijking is case-insensitief
tegen de whitelist in de SQLite-database (tabel genre_whitelist).

Standaardlijst (~270 genres) wordt automatisch ingezaaid als de tabel leeg is.
"""

import logging

log = logging.getLogger(__name__)

DEFAULT_GENRES: list[str] = [
    # ── Rock ──────────────────────────────────────────────────────────────
    "Rock", "Alternative Rock", "Classic Rock", "Hard Rock", "Art Rock",
    "Noise Rock", "No Wave", "Garage Rock", "Space Rock", "Southern Rock",
    "Heartland Rock", "Blues Rock", "Progressive Rock", "Psychedelic Rock",
    "Surf Rock", "Rockabilly", "Krautrock", "Motorik", "Kosmische",
    # ── Punk / Post-Punk ──────────────────────────────────────────────────
    "Punk", "Post-Punk", "Post-Punk Revival", "New Wave", "Hardcore",
    "Post-Hardcore", "Pop Punk", "Screamo", "Skramz", "Midwest Emo",
    "Crust Punk", "D-beat", "Powerviolence", "Grindcore", "Noise Punk",
    # ── Indie / Grunge / Shoegaze ─────────────────────────────────────────
    "Indie", "Indie Rock", "Indie Pop", "Indie Folk", "Indie Electronic",
    "Grunge", "Shoegaze", "Dream Pop", "Slowcore", "Lo-Fi", "Chillwave",
    # ── Post-Rock / Math ──────────────────────────────────────────────────
    "Post-Rock", "Math Rock", "Math Pop", "Canterbury", "Zeuhl", "RIO",
    # ── Emo / Alternative ─────────────────────────────────────────────────
    "Emo", "Alternative", "Alternative Metal", "Gothic", "Gothic Rock",
    # ── Metal ─────────────────────────────────────────────────────────────
    "Metal", "Heavy Metal", "Black Metal", "Death Metal", "Thrash Metal",
    "Doom Metal", "Stoner", "Sludge", "Power Metal", "Symphonic Metal",
    "Folk Metal", "Viking Metal", "Metalcore", "Deathcore", "Nu-Metal",
    "Post-Metal", "Gothic Metal", "Speed Metal", "Groove Metal",
    "Death-Doom", "Funeral Doom", "Noise Metal", "Mathcore",
    # ── Electronic (experimental) ─────────────────────────────────────────
    "Electronic", "Electronica", "IDM", "Glitch", "Breakcore",
    "Noise", "Experimental", "Avant-Garde", "Musique Concrète",
    "Acousmatic", "Tape Music", "Drone", "Electro-Acoustic",
    # ── House ─────────────────────────────────────────────────────────────
    "House", "Deep House", "Tech House", "Electro House",
    "Progressive House", "Acid House", "Chicago House",
    # ── Techno ────────────────────────────────────────────────────────────
    "Techno", "Minimal Techno", "Dub Techno", "Detroit Techno",
    "Minimal", "Microhouse",
    # ── Trance ────────────────────────────────────────────────────────────
    "Trance", "Progressive Trance", "Psy-Trance",
    # ── Drum and Bass / Jungle ────────────────────────────────────────────
    "Drum and Bass", "Jungle", "Breakbeat",
    # ── UK Dance ──────────────────────────────────────────────────────────
    "UK Garage", "2-Step", "Dubstep", "Post-Dubstep", "Future Garage",
    "Grime", "Bass Music",
    # ── Footwork / Juke / Trap ────────────────────────────────────────────
    "Footwork", "Juke", "Trap", "Trap Music", "Cloud Rap",
    # ── Synthwave / Retro ─────────────────────────────────────────────────
    "Synthwave", "Retrowave", "Outrun", "Vaporwave", "Synthpop",
    "Electro", "EBM", "Industrial", "Darkwave", "Chiptune", "Bitpop",
    "Witch House", "Hauntology", "Seapunk", "PC Music",
    "Hyperpop", "Deconstructed Club",
    # ── Ambient / Downtempo ───────────────────────────────────────────────
    "Ambient", "Dark Ambient", "Black Ambient", "Dungeon Synth",
    "Downtempo", "Chillout", "Lounge", "Trip Hop", "New Age",
    # ── Pop ───────────────────────────────────────────────────────────────
    "Pop", "Art Pop", "Chamber Pop", "Baroque Pop", "Sophisti-Pop",
    "Yacht Rock", "AOR", "Soft Rock", "Power Pop", "Jangle Pop",
    "Twee Pop", "C86", "Sarah Records", "Noise Pop",
    "Psychedelic Pop", "Country Pop",
    # ── Soul / R&B / Funk ────────────────────────────────────────────────
    "Soul", "R&B", "Funk", "Neo-Soul", "Contemporary R&B", "New Jack Swing",
    # ── Gospel ────────────────────────────────────────────────────────────
    "Gospel", "Spiritual", "Sacred Music",
    # ── Blues ─────────────────────────────────────────────────────────────
    "Blues", "Delta Blues", "Chicago Blues", "Electric Blues",
    # ── Country ───────────────────────────────────────────────────────────
    "Country", "Outlaw Country", "Alt-Country", "Americana",
    "Bluegrass", "Western", "Honky Tonk", "Country Rock",
    # ── Folk ──────────────────────────────────────────────────────────────
    "Folk", "Folk Rock", "Neofolk", "Darkfolk", "Celtic",
    "Nordic Folk", "Traditional Folk", "Psychedelic Folk",
    "Balkan", "Klezmer", "Polka",
    # ── Jazz ──────────────────────────────────────────────────────────────
    "Jazz", "Bebop", "Cool Jazz", "Free Jazz", "Smooth Jazz",
    "Fusion", "Modal Jazz", "Hard Bop", "Ragtime", "Big Band", "Swing",
    "Nu-Jazz", "Future Jazz",
    # ── Hip Hop / Rap ─────────────────────────────────────────────────────
    "Hip Hop", "Rap", "Boom Bap", "Gangsta Rap", "Conscious",
    "Drill", "Phonk", "G-Funk", "Chopped and Screwed",
    "East Coast Rap", "West Coast Rap", "Southern Rap",
    # ── Latin ─────────────────────────────────────────────────────────────
    "Latin", "Bossa Nova", "Samba", "Tango", "MPB", "Tropicalia",
    "Cumbia", "Salsa", "Merengue", "Bachata", "Reggaeton", "Bolero",
    "Tejano", "Norteño", "Ranchera", "Corrido", "Cumbia Villera",
    "Trap Latino",
    # ── Caribbean / African ───────────────────────────────────────────────
    "Reggae", "Roots Reggae", "Ska", "Dub", "Dancehall",
    "Zouk", "Soca", "Calypso", "Compas",
    "Afrobeat", "Afrobeats", "Highlife", "Soukous", "Makossa",
    "Mbalax", "Gnawa", "Rai", "Amapiano", "Kwaito", "Afropop",
    # ── Asian ─────────────────────────────────────────────────────────────
    "Bhangra", "Qawwali", "Hindustani", "Hindustani Classical",
    "Carnatic", "Carnatic Classical", "Gamelan",
    "Enka", "City Pop", "J-Pop", "K-Pop", "C-Pop",
    "Mandopop", "Cantopop", "Anime", "Visual Kei",
    # ── Classical ─────────────────────────────────────────────────────────
    "Classical", "Opera", "Chamber", "Orchestral", "Minimalist",
    "Baroque", "Romantic", "Modern Classical", "Contemporary",
    "Neoclassical", "Soundtrack", "Score", "Musical",
    "Electronic Classical",
    # ── Vocal ─────────────────────────────────────────────────────────────
    "A Cappella", "Barbershop", "Choir",
    # ── Cabaret / Chanson / World Vocal ──────────────────────────────────
    "Cabaret", "Chanson", "Fado", "Flamenco",
    # ── Progressive ───────────────────────────────────────────────────────
    "Progressive",
]


def seed_default_genres() -> None:
    """Seed de database met DEFAULT_GENRES als de genre_whitelist tabel leeg is."""
    from core import database as db  # noqa: PLC0415
    existing = db.get_genre_whitelist()
    if not existing:
        log.info("genre_filter: seeding %d standaard genres", len(DEFAULT_GENRES))
        db.set_genre_whitelist([{"genre": g, "enabled": True} for g in DEFAULT_GENRES])


def get_whitelist_set() -> set[str]:
    """
    Geeft een set van ingeschakelde genres terug (lowercase), geladen uit de database.
    Gooit een lege set als de tabel leeg is (filter werkt dan als pass-through).
    """
    from core import database as db  # noqa: PLC0415
    rows = db.get_genre_whitelist()
    return {r["genre"].lower() for r in rows if r.get("enabled", True)}


def filter_genres(
    genre_list: list[str],
    whitelist: set[str] | None = None,
) -> list[str]:
    """
    Filter genres die niet in de whitelist staan (case-insensitive matching).

    Parameters
    ----------
    genre_list : genres om te filteren
    whitelist  : optionele pre-geladen set (lowercase); als None wordt de DB bevraagd

    Returns
    -------
    Gefilterde lijst — alleen genres die in de whitelist staan.
    Als de whitelist leeg is (niet geconfigureerd) worden alle genres doorgelaten.
    """
    if whitelist is None:
        whitelist = get_whitelist_set()
    if not whitelist:
        return genre_list  # lege whitelist = geen filter
    return [g for g in genre_list if g and g.strip().lower() in whitelist]
