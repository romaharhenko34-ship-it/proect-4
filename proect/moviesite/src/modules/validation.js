// =============================================
// MODULE: validation.js
// Form validation logic
// =============================================

/** Validate search input */
export function validateSearch(value) {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Please enter a search term.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Search must be at least 2 characters.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Search query is too long.' };
  }
  // Sanitize: only allow letters, numbers, spaces, hyphens
  if (/[<>{}[\]\\|^`]/.test(trimmed)) {
    return { valid: false, error: 'Invalid characters in search.' };
  }
  return { valid: true, value: trimmed };
}

/** Debounce a function call */
export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
