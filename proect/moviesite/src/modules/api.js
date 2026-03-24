// =============================================
// MODULE: api.js — БЕЗ КЛЮЧЕЙ И РЕГИСТРАЦИИ
// =============================================

// Используем Lorem Picsum для генерации случайных фото
// И поиск через Open-source API для "тем"
export async function searchMovies(query = 'aesthetic', page = 1) {
  // Имитируем поиск: генерируем массив фото с разными размерами
  // Чтобы получить эффект Pinterest (разная высота)
  const results = Array.from({ length: 20 }).map((_, i) => {
    const width = 400;
    const height = Math.floor(Math.random() * (700 - 300 + 1)) + 300; // Случайная высота
    const randomId = Math.floor(Math.random() * 1000);
    
    return {
      id: `${randomId}-${i}`,
      title: `${query} Study #${randomId}`,
      poster_path: `https://picsum.photos/id/${randomId}/${width}/${height}`,
      user: `Author_${randomId}`,
      vote_average: Math.floor(Math.random() * 1000)
    };
  });

  // Возвращаем промис с задержкой (Async/Await), чтобы работали скелетоны (загрузка)
  return new Promise((resolve) => {
    setTimeout(() => resolve({ results, total_pages: 10 }), 600);
  });
}

// Популярное при старте
export const fetchTrending = (page = 1) => searchMovies('Trending', page);

// Поиск по жанру
export const fetchByGenre = (genreId, page = 1) => searchMovies(`Genre-${genreId}`, page);

// Для совместимости с твоим UI.js
export const imgUrl = (path) => path; 
export const fetchGenres = () => Promise.resolve({ genres: [] });

export async function fetchMovieDetails(id) {
    return {
        details: {
            title: "Photo Inspiration",
            overview: "This is a high-quality open-source image from the public collection. Used for layout demonstration in Pinterest style.",
            poster_path: "https://picsum.photos/800/1000",
            genres: [{name: 'Photography'}, {name: 'Design'}]
        },
        credits: { cast: [{name: 'Open Art'}] }
    };
}