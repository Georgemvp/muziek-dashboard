// ── Queue Management Module ────────────────────────────────────────────────
// Beheert de afspeelwachtrij met state, persistentie en helper-functies

const STORAGE_PREFIX = 'muziek-';
const QUEUE_KEY = `${STORAGE_PREFIX}queue`;
const QUEUE_INDEX_KEY = `${STORAGE_PREFIX}queue-index`;
const SHUFFLE_KEY = `${STORAGE_PREFIX}shuffle`;
const RECENT_KEY = `${STORAGE_PREFIX}recent-tracks`;

export class QueueManager {
  constructor() {
    this.queue = [];
    this.queueIndex = -1;
    this.shuffleEnabled = this.loadShuffle();
    this.shuffledIndices = []; // Originele volgorde wanneer shuffle aan staat
    this.listeners = new Set();
  }

  // ── Shuffle management ────────────────────────────────────────────────────
  toggleShuffle() {
    this.shuffleEnabled = !this.shuffleEnabled;
    localStorage.setItem(SHUFFLE_KEY, JSON.stringify(this.shuffleEnabled));

    if (this.shuffleEnabled && this.queue.length > 0) {
      // Maak shuffled volgorde
      this.shuffledIndices = this.queue.map((_, i) => i);
      this.shuffledIndices = this._fisherYatesShuffle(this.shuffledIndices);
    } else {
      this.shuffledIndices = [];
    }

    this._notifyListeners('shuffle-changed');
    return this.shuffleEnabled;
  }

  getShuffleEnabled() {
    return this.shuffleEnabled;
  }

  _fisherYatesShuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Queue operations ──────────────────────────────────────────────────────
  setQueue(tracks, startIndex = 0) {
    this.queue = tracks;
    this.queueIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    if (this.shuffleEnabled) {
      this.shuffledIndices = this._fisherYatesShuffle(
        this.queue.map((_, i) => i)
      );
    } else {
      this.shuffledIndices = [];
    }

    this._notifyListeners('queue-changed');
  }

  getQueue() {
    return this.queue;
  }

  getCurrentIndex() {
    return this.queueIndex;
  }

  setCurrentIndex(index) {
    this.queueIndex = Math.max(0, Math.min(index, this.queue.length - 1));
    this._notifyListeners('index-changed');
  }

  getCurrentTrack() {
    if (this.queueIndex < 0 || this.queueIndex >= this.queue.length) {
      return null;
    }
    return this.queue[this.queueIndex];
  }

  // Geeft de volgende track index (rekening houdend met shuffle)
  getNextIndex() {
    if (this.queue.length === 0) return -1;

    if (this.shuffleEnabled && this.shuffledIndices.length > 0) {
      const currentShuffledPos = this.shuffledIndices.indexOf(this.queueIndex);
      const nextShuffledPos = currentShuffledPos + 1;
      if (nextShuffledPos < this.shuffledIndices.length) {
        return this.shuffledIndices[nextShuffledPos];
      }
      return -1; // End of shuffled queue
    }

    return this.queueIndex + 1 < this.queue.length ? this.queueIndex + 1 : -1;
  }

  // Geeft de vorige track index (rekening houdend met shuffle)
  getPrevIndex() {
    if (this.queue.length === 0) return -1;

    if (this.shuffleEnabled && this.shuffledIndices.length > 0) {
      const currentShuffledPos = this.shuffledIndices.indexOf(this.queueIndex);
      return currentShuffledPos > 0 ? this.shuffledIndices[currentShuffledPos - 1] : -1;
    }

    return this.queueIndex > 0 ? this.queueIndex - 1 : -1;
  }

  // Verplaats track in wachtrij (via drag-drop)
  moveTrack(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;

    const [track] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, track);

    // Pas queue index aan als nodig
    if (this.queueIndex === fromIndex) {
      this.queueIndex = toIndex;
    } else if (fromIndex < this.queueIndex && toIndex >= this.queueIndex) {
      this.queueIndex--;
    } else if (fromIndex > this.queueIndex && toIndex <= this.queueIndex) {
      this.queueIndex++;
    }

    this._notifyListeners('queue-changed');
  }

  // Verwijder track uit wachtrij
  removeTrack(index) {
    if (index < 0 || index >= this.queue.length) return;

    this.queue.splice(index, 1);

    // Pas queue index aan
    if (index === this.queueIndex) {
      this.queueIndex = Math.min(this.queueIndex, this.queue.length - 1);
    } else if (index < this.queueIndex) {
      this.queueIndex--;
    }

    this._notifyListeners('queue-changed');
  }

  // Wis gehele wachtrij
  clearQueue() {
    this.queue = [];
    this.queueIndex = -1;
    this.shuffledIndices = [];
    this._notifyListeners('queue-changed');
  }

  // Voeg track(s) toe aan einde van wachtrij
  addToQueue(tracks) {
    if (!Array.isArray(tracks)) {
      tracks = [tracks];
    }
    this.queue.push(...tracks);
    this._notifyListeners('queue-changed');
  }

  // ── Recent tracks management ──────────────────────────────────────────────
  addToRecent(track) {
    const recent = this.loadRecent();

    // Verwijder duplicaten van hetzelfde nummer
    const filtered = recent.filter(t => t.ratingKey !== track.ratingKey);

    // Voeg huidigen toe aan het begin met timestamp
    const withTime = {
      ...track,
      playedAt: new Date().toISOString(),
    };

    filtered.unshift(withTime);

    // Bewaar alleen de eerste 50
    const limited = filtered.slice(0, 50);

    localStorage.setItem(RECENT_KEY, JSON.stringify(limited));
    this._notifyListeners('recent-changed');
  }

  getRecent() {
    return this.loadRecent();
  }

  clearRecent() {
    localStorage.removeItem(RECENT_KEY);
    this._notifyListeners('recent-changed');
  }

  loadRecent() {
    try {
      const data = localStorage.getItem(RECENT_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // ── Listeners ──────────────────────────────────────────────────────────────
  onQueueChanged(listener) {
    this.listeners.add({ event: 'queue-changed', listener });
  }

  onShuffleChanged(listener) {
    this.listeners.add({ event: 'shuffle-changed', listener });
  }

  onRecentChanged(listener) {
    this.listeners.add({ event: 'recent-changed', listener });
  }

  _notifyListeners(event) {
    this.listeners.forEach(({ event: e, listener }) => {
      if (e === event) listener();
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  loadShuffle() {
    try {
      const data = localStorage.getItem(SHUFFLE_KEY);
      return data ? JSON.parse(data) : false;
    } catch {
      return false;
    }
  }
}

export const queueManager = new QueueManager();
