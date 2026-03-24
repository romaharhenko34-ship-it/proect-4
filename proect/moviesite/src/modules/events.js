// =============================================
// MODULE: events.js
// Centralised event handling
// =============================================

import { $, $$, closeModal, switchView, showToast, updateBadge } from './ui.js';
import { getWatchlist, clearWatchlist } from './storage.js';

/** Bind all global event listeners */
export function bindEvents({
  onTabSwitch,
  onSearch,
  onSearchClear,
  onSort,
  onLoadMore,
  onClearWatchlist,
  onCardClick,
}) {
  // ── Tab switching ──────────────────────────
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => onTabSwitch(btn.dataset.tab));
  });

  // ── Search input (keyup + validation) ──────
  const input = $('searchInput');
  input.addEventListener('input', e => {
    const val = e.target.value;
    $('searchClear').classList.toggle('hidden', val.length === 0);
    onSearch(val);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      $('searchClear').classList.add('hidden');
      onSearchClear();
    }
  });

  // ── Search clear button ────────────────────
  $('searchClear').addEventListener('click', () => {
    input.value = '';
    $('searchClear').classList.add('hidden');
    onSearchClear();
  });

  // ── Sort select ────────────────────────────
  $('sortSelect').addEventListener('change', e => onSort(e.target.value));

  // ── Load More ─────────────────────────────
  $('loadMore').addEventListener('click', onLoadMore);

  // ── Clear Watchlist ────────────────────────
  $('clearWl').addEventListener('click', () => {
    if (getWatchlist().length === 0) return;
    clearWatchlist();
    onClearWatchlist();
    showToast('Watchlist cleared', 'remove', 'fa-trash');
    document.dispatchEvent(new CustomEvent('watchlistChanged'));
  });

  // ── Modal close ────────────────────────────
  $('modalClose').addEventListener('click', closeModal);
  $('modalOverlay').addEventListener('click', e => {
    if (e.target === $('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ── Watchlist badge sync ───────────────────
  document.addEventListener('watchlistChanged', () => {
    updateBadge(getWatchlist().length);
  });

  // ── Navbar scroll style ───────────────────
  window.addEventListener('scroll', () => {
    $('navbar').classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ── Window resize ─────────────────────────
  window.addEventListener('resize', () => {
    document.dispatchEvent(new CustomEvent('windowResize', {
      detail: { width: window.innerWidth, height: window.innerHeight }
    }));
  });
}
