// =============================================
// MODULE: ui.js
// DOM manipulation & rendering helpers
// =============================================

import { imgUrl } from './api.js';
import { isInWatchlist, toggleWatchlist } from './storage.js';

// DOM references (queried once)
export const $ = id => document.getElementById(id);
export const $$ = sel => document.querySelectorAll(sel);

/** Show skeleton loading grid */
export function showSkeleton() {
  $('skeletonGrid').classList.remove('hidden');
  $('moviesGrid').style.opacity = '0';
}

/** Hide skeleton, show real grid */
export function hideSkeleton() {
  $('skeletonGrid').classList.add('hidden');
  $('moviesGrid').style.opacity = '1';
  $('moviesGrid').style.transition = 'opacity 0.4s';
}

/** Render array of movie objects into a target grid element */
export function renderMovies(movies, container, append = false, onCardClick) {
  if (!append) container.innerHTML = '';

  movies.forEach((movie, i) => {
    const card = createMovieCard(movie, i, onCardClick);
    container.appendChild(card);
  });
}

/** Create a single movie card DOM node */
function createMovieCard(movie, index, onClick) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.style.animationDelay = `${Math.min(index * 0.06, 0.5)}s`;
  card.dataset.id = movie.id;

  const poster = imgUrl(movie.poster_path, 'w342');
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const inWl = isInWatchlist(movie.id);

  card.innerHTML = `
    <div class="card-poster">
      ${poster
        ? `<img src="${poster}" alt="${escHtml(movie.title)}" loading="lazy" />`
        : `<div class="card-no-img"><i class="fa-solid fa-film"></i></div>`
      }
      <div class="card-rating">
        <i class="fa-solid fa-star"></i> ${rating}
      </div>
      <div class="card-overlay">
        <div class="card-overlay-actions">
          <button class="card-btn info-btn" title="Details">
            <i class="fa-solid fa-circle-info"></i> Info
          </button>
          <button class="card-btn wl-btn ${inWl ? 'active' : ''}" title="${inWl ? 'Remove' : 'Add to Watchlist'}">
            <i class="fa-solid ${inWl ? 'fa-bookmark' : 'fa-plus'}"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-title">${escHtml(movie.title)}</div>
      <div class="card-year">${year}</div>
    </div>
  `;

  // Event: open detail modal
  card.querySelector('.info-btn').addEventListener('click', e => {
    e.stopPropagation();
    onClick && onClick(movie);
  });

  // Event: card body click also opens modal
  card.querySelector('.card-body').addEventListener('click', () => {
    onClick && onClick(movie);
  });

  // Event: toggle watchlist
  card.querySelector('.wl-btn').addEventListener('click', e => {
    e.stopPropagation();
    const added = toggleWatchlist(movie);
    const btn = card.querySelector('.wl-btn');
    const icon = btn.querySelector('i');
    btn.classList.toggle('active', added);
    icon.className = `fa-solid ${added ? 'fa-bookmark' : 'fa-plus'}`;
    showToast(
      added ? `Added to Watchlist` : `Removed from Watchlist`,
      added ? 'success' : 'remove',
      added ? 'fa-bookmark' : 'fa-trash'
    );
    // Dispatch custom event for badge update
    document.dispatchEvent(new CustomEvent('watchlistChanged'));
  });

  return card;
}

/** Render hero section with a featured movie */
export function renderHero(movie, onWlClick) {
  const backdrop = imgUrl(movie.backdrop_path, 'original');
  const poster = imgUrl(movie.poster_path, 'w780');
  const year = movie.release_date?.slice(0,4) || '';
  const rating = movie.vote_average?.toFixed(1) || '';
  const genre = movie.genres?.[0]?.name || '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m` : '';

  if (backdrop || poster) {
    $('heroBackdrop').style.backgroundImage = `url(${backdrop || poster})`;
  }

  $('heroMeta').innerHTML = `
    ${genre ? `<span class="genre-pill">${genre}</span>` : ''}
    ${year ? `<span class="year">${year}</span>` : ''}
    ${runtime ? `<span class="runtime"><i class="fa-regular fa-clock" style="margin-right:0.3rem"></i>${runtime}</span>` : ''}
    ${rating ? `<span class="rating"><i class="fa-solid fa-star"></i> ${rating}</span>` : ''}
  `;
  $('heroTitle').textContent = movie.title;
  $('heroDesc').textContent = movie.overview || '';

  const inWl = isInWatchlist(movie.id);
  const wlBtn = $('heroWl');
  wlBtn.innerHTML = `<i class="fa-solid ${inWl ? 'fa-bookmark' : 'fa-plus'}"></i> ${inWl ? 'In Watchlist' : 'Watchlist'}`;
  wlBtn.className = `btn-wl${inWl ? ' in-wl' : ''}`;

  wlBtn.onclick = () => {
    const added = toggleWatchlist(movie);
    wlBtn.innerHTML = `<i class="fa-solid ${added ? 'fa-bookmark' : 'fa-plus'}"></i> ${added ? 'In Watchlist' : 'Watchlist'}`;
    wlBtn.className = `btn-wl${added ? ' in-wl' : ''}`;
    showToast(added ? 'Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : 'remove', added ? 'fa-bookmark' : 'fa-trash');
    document.dispatchEvent(new CustomEvent('watchlistChanged'));
  };
}

/** Render genre buttons */
export function renderGenres(genres, onSelect) {
  const list = $('genreList');
  list.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'genre-btn active';
  allBtn.textContent = 'All';
  allBtn.dataset.id = '';
  allBtn.addEventListener('click', () => {
    $$('.genre-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    onSelect(null, 'Trending Now');
  });
  list.appendChild(allBtn);

  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = 'genre-btn';
    btn.textContent = genre.name;
    btn.dataset.id = genre.id;
    btn.addEventListener('click', () => {
      $$('.genre-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(genre.id, genre.name);
    });
    list.appendChild(btn);
  });
}

/** Show/hide pages */
export function switchView(name) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`view-${name}`).classList.add('active');
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
}

/** Render modal with full movie details */
export function renderModal(movie, credits) {
  const poster = imgUrl(movie.poster_path, 'w342');
  const backdrop = imgUrl(movie.backdrop_path, 'w1280');
  const year = movie.release_date?.slice(0,4) || '';
  const rating = movie.vote_average?.toFixed(1) || 'N/A';
  const votes = movie.vote_count ? `${(movie.vote_count/1000).toFixed(1)}k votes` : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime/60)}h ${movie.runtime%60}m` : '';
  const genres = (movie.genres || []).map(g => g.name);
  const cast = (credits?.cast || []).slice(0, 8).map(c => c.name);
  const inWl = isInWatchlist(movie.id);

  if (backdrop) $('modalBackdrop').style.backgroundImage = `url(${backdrop})`;
  $('modalPoster').innerHTML = poster
    ? `<img src="${poster}" alt="${escHtml(movie.title)}" />`
    : `<div class="no-poster"><i class="fa-solid fa-film"></i></div>`;

  $('modalMeta').innerHTML = [
    ...genres.slice(0,3).map(g => `<span class="mpill genre">${g}</span>`),
    year ? `<span class="mpill year">${year}</span>` : '',
  ].join('');

  $('modalTitle').textContent = movie.title;

  $('modalStats').innerHTML = `
    ${rating !== 'N/A' ? `<div class="mstat rating"><i class="fa-solid fa-star"></i> ${rating}</div>` : ''}
    ${votes ? `<div class="mstat votes"><i class="fa-regular fa-eye"></i> ${votes}</div>` : ''}
    ${runtime ? `<div class="mstat runtime"><i class="fa-regular fa-clock"></i> ${runtime}</div>` : ''}
  `;

  $('modalDesc').textContent = movie.overview || 'No description available.';

  $('modalCast').innerHTML = cast.length
    ? `<h4>Cast</h4><div class="cast-list">${cast.map(n => `<span class="cast-chip">${n}</span>`).join('')}</div>`
    : '';

  const wlBtn = document.createElement('button');
  wlBtn.className = `btn-wl${inWl ? ' in-wl' : ''}`;
  wlBtn.innerHTML = `<i class="fa-solid ${inWl ? 'fa-bookmark' : 'fa-plus'}"></i> ${inWl ? 'In Watchlist' : 'Watchlist'}`;
  wlBtn.addEventListener('click', () => {
    const added = toggleWatchlist(movie);
    wlBtn.innerHTML = `<i class="fa-solid ${added ? 'fa-bookmark' : 'fa-plus'}"></i> ${added ? 'In Watchlist' : 'Watchlist'}`;
    wlBtn.className = `btn-wl${added ? ' in-wl' : ''}`;
    showToast(added ? 'Added to Watchlist' : 'Removed from Watchlist', added ? 'success' : 'remove', added ? 'fa-bookmark' : 'fa-trash');
    document.dispatchEvent(new CustomEvent('watchlistChanged'));
  });

  const trailerBtn = document.createElement('button');
  trailerBtn.className = 'btn-watch';
  trailerBtn.innerHTML = `<i class="fa-brands fa-youtube"></i> Trailer`;
  trailerBtn.addEventListener('click', () => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + year + ' trailer')}`, '_blank');
  });

  $('modalActions').innerHTML = '';
  $('modalActions').append(trailerBtn, wlBtn);

  openModal();
}

export function openModal() {
  $('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  $('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/** Show a toast notification */
export function showToast(msg, type = 'info', icon = 'fa-circle-check') {
  const container = $('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 2800);
}

/** Escape HTML for safe insertion */
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Update watchlist badge count */
export function updateBadge(count) {
  const badge = $('wlBadge');
  badge.textContent = count;
  badge.classList.add('pop');
  setTimeout(() => badge.classList.remove('pop'), 300);
}
