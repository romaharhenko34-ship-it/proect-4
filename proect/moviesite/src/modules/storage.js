// =============================================
// MODULE: storage.js
// localStorage persistence for watchlist & prefs
// =============================================

const WL_KEY = 'cinemascape_watchlist';
const PREFS_KEY = 'cinemascape_prefs';

/** Read watchlist from localStorage */
export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WL_KEY)) || [];
  } catch {
    return [];
  }
}

/** Save full watchlist array */
function saveWatchlist(list) {
  localStorage.setItem(WL_KEY, JSON.stringify(list));
}

/** Add movie to watchlist */
export function addToWatchlist(movie) {
  const list = getWatchlist();
  if (!list.find(m => m.id === movie.id)) {
    list.unshift({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
      genre_ids: movie.genre_ids || [],
      addedAt: Date.now(),
    });
    saveWatchlist(list);
  }
}

/** Remove movie from watchlist by id */
export function removeFromWatchlist(movieId) {
  const list = getWatchlist().filter(m => m.id !== movieId);
  saveWatchlist(list);
}

/** Toggle watchlist entry, returns true if added */
export function toggleWatchlist(movie) {
  const list = getWatchlist();
  const exists = list.find(m => m.id === movie.id);
  if (exists) {
    removeFromWatchlist(movie.id);
    return false;
  } else {
    addToWatchlist(movie);
    return true;
  }
}

/** Check if movie is in watchlist */
export function isInWatchlist(movieId) {
  return !!getWatchlist().find(m => m.id === movieId);
}

/** Clear entire watchlist */
export function clearWatchlist() {
  localStorage.removeItem(WL_KEY);
}

/** Save user preferences */
export function savePrefs(prefs) {
  const current = getPrefs();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
}

/** Get user preferences */
export function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
}
