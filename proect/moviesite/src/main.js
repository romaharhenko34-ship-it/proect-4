// =============================================
// main.js — Entry Point (Vite module)
// Imports and orchestrates all modules
// =============================================

import {
  fetchTrending,
  fetchByGenre,
  fetchGenres,
  fetchMovieDetails,
  searchMovies,
} from './modules/api.js';

import {
  getWatchlist,
  clearWatchlist,
  savePrefs,
  getPrefs,
} from './modules/storage.js';

import {
  $, renderMovies, renderHero, renderGenres,
  renderModal, switchView, showSkeleton, hideSkeleton,
  showToast, updateBadge, closeModal,
} from './modules/ui.js';

import { validateSearch, debounce } from './modules/validation.js';
import { bindEvents } from './modules/events.js';

// =============================================
// STATE
// =============================================
const state = {
  movies: [],
  currentPage: 1,
  totalPages: 1,
  activeGenre: null,
  activeGenreName: 'Trending Now',
  sortBy: 'popularity',
  searchQuery: '',
  isLoading: false,
};

// =============================================
// INIT
// =============================================
async function init() {
  const prefs = getPrefs();

  // Restore saved sort preference
  if (prefs.sort) {
    state.sortBy = prefs.sort;
    $('sortSelect').value = prefs.sort;
  }

  // Update watchlist badge on load
  updateBadge(getWatchlist().length);

  // Bind all events
  bindEvents({
    onTabSwitch: handleTabSwitch,
    onSearch: debounce(handleSearch, 450),
    onSearchClear: handleSearchClear,
    onSort: handleSort,
    onLoadMore: handleLoadMore,
    onClearWatchlist: renderWatchlist,
    onCardClick: openMovieDetail,
  });

  // Expose for inline HTML onclick
  window.switchTab = handleTabSwitch;

  // Load genres
  try {
    const { genres } = await fetchGenres();
    renderGenres(genres, handleGenreSelect);
  } catch (e) {
    console.warn('Failed to load genres', e);
  }

  // Load initial movies + hero
  await loadMovies(true);
}

// =============================================
// LOAD MOVIES (async/await API call)
// =============================================
async function loadMovies(reset = false) {
  if (state.isLoading) return;
  state.isLoading = true;

  if (reset) {
    state.currentPage = 1;
    showSkeleton();
  }

  try {
    let data;
    if (state.searchQuery) {
      data = await searchMovies(state.searchQuery, state.currentPage);
    } else if (state.activeGenre) {
      data = await fetchByGenre(state.activeGenre, state.currentPage);
    } else {
      data = await fetchTrending(state.currentPage);
    }

    state.totalPages = data.total_pages || 1;
    const sorted = sortMovies(data.results || [], state.sortBy);

    if (reset) {
      state.movies = sorted;
      renderMovies(sorted, $('moviesGrid'), false, openMovieDetail);
      hideSkeleton();
      $('sectionTitle').textContent = state.searchQuery
        ? `Results for "${state.searchQuery}"`
        : state.activeGenreName;

      // Set hero to first movie
      if (sorted.length > 0) await loadHero(sorted[0]);
    } else {
      state.movies = [...state.movies, ...sorted];
      renderMovies(sorted, $('moviesGrid'), true, openMovieDetail);
    }

    // Toggle load more button
    $('loadMore').disabled = state.currentPage >= state.totalPages;
    $('loadMore').classList.toggle('hidden', state.currentPage >= state.totalPages);

  } catch (err) {
    console.error('Failed to load movies:', err);
    showToast('Failed to load movies. Please try again.', 'info', 'fa-triangle-exclamation');
    hideSkeleton();
  } finally {
    state.isLoading = false;
  }
}

// =============================================
// LOAD HERO (fetch full movie details)
// =============================================
async function loadHero(movie) {
  try {
    const { details } = await fetchMovieDetails(movie.id);
    renderHero(details, () => {});
  } catch {
    renderHero(movie, () => {});
  }
}

// =============================================
// OPEN MOVIE DETAIL MODAL
// =============================================
async function openMovieDetail(movie) {
  try {
    const { details, credits } = await fetchMovieDetails(movie.id);
    renderModal(details, credits);
  } catch {
    renderModal(movie, null);
    showToast('Could not load full details', 'info', 'fa-circle-info');
  }
}

// =============================================
// SORT HELPER
// =============================================
function sortMovies(movies, by) {
  return [...movies].sort((a, b) => {
    switch (by) {
      case 'rating':    return (b.vote_average || 0) - (a.vote_average || 0);
      case 'year':      return (b.release_date || '').localeCompare(a.release_date || '');
      case 'title':     return (a.title || '').localeCompare(b.title || '');
      default:          return (b.popularity || 0) - (a.popularity || 0);
    }
  });
}

// =============================================
// EVENT HANDLERS
// =============================================
function handleTabSwitch(tab) {
  switchView(tab);
  if (tab === 'watchlist') renderWatchlist();
}

async function handleGenreSelect(genreId, name) {
  state.activeGenre = genreId;
  state.activeGenreName = name;
  state.searchQuery = '';
  $('searchInput').value = '';
  $('searchClear').classList.add('hidden');
  switchView('discover');
  await loadMovies(true);
}

async function resetGenreButtons() {
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.genre-btn')?.classList.add('active');
}

async function handleSearch(value) {
  const result = validateSearch(value);
  if (!result.valid) {
    if (value.length === 0) return handleSearchClear();
    return;
  }
  state.searchQuery = result.value;
  state.activeGenre = null;
  await resetGenreButtons();
  await loadMovies(true);
}

async function handleSearchClear() {
  state.searchQuery = '';
  state.activeGenre = null;
  state.activeGenreName = 'Trending Now';
  await resetGenreButtons();
  await loadMovies(true);
}

function handleSort(value) {
  state.sortBy = value;
  savePrefs({ sort: value });
  const sorted = sortMovies(state.movies, value);
  renderMovies(sorted, $('moviesGrid'), false, openMovieDetail);
}

async function handleLoadMore() {
  if (state.currentPage >= state.totalPages) return;
  state.currentPage++;
  await loadMovies(false);
}

function renderWatchlist() {
  const list = getWatchlist();
  updateBadge(list.length);
  if (list.length === 0) {
    $('watchlistGrid').innerHTML = '';
    $('wlEmpty').classList.remove('hidden');
  } else {
    $('wlEmpty').classList.add('hidden');
    renderMovies(list, $('watchlistGrid'), false, openMovieDetail);
  }
}

// =============================================
// BOOT
// =============================================
document.addEventListener('DOMContentLoaded', init);
