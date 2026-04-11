/**
 * search.js - Search and autocomplete UI management
 */

import { getPokemonSpriteUrl, formatPokemonNameWithCapitalization } from '../models/pokemon.js';
import { loadPokemonSearchIndex } from '../api/pokeapi.js';
import { appState } from '../store/appState.js';

let pokemonSearchIndex = [];
let activeSuggestionIndex = -1;

// DOM references
let searchInput;
let suggestionsContainer;
let searchErrorContainer;

/**
 * Initialize search UI module
 */
export const initSearch = (deps, selectCallback) => {
	searchInput = deps.searchInput;
	suggestionsContainer = deps.suggestionsContainer;
	searchErrorContainer = deps.searchErrorContainer;

	setupSearchEventListeners(selectCallback);
};

/**
 * Debounce utility
 */
const debounce = (func, wait, immediate = false) => {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			timeout = null;
			if (!immediate) func.apply(this, args);
		};

		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) func.apply(this, args);
	};
};

/**
 * Display search error message
 */
export const displaySearchError = (message) => {
	if (searchErrorContainer) {
		searchErrorContainer.innerHTML = `<div style="color: #f44336; font-size: 0.9rem; margin-top: 5px; padding: 5px; background-color: rgba(244, 67, 54, 0.1); border-radius: 4px;">${message}</div>`;
	}
};

/**
 * Clear search error message
 */
export const clearSearchError = () => {
	if (searchErrorContainer) {
		searchErrorContainer.innerHTML = '';
	}
};

/**
 * Hide search suggestions
 */
const hideSearchSuggestions = () => {
	activeSuggestionIndex = -1;
	if (suggestionsContainer) {
		suggestionsContainer.classList.add('hidden');
		suggestionsContainer.innerHTML = '';
	}
};

/**
 * Set active suggestion (for keyboard navigation)
 */
const setActiveSuggestion = (index) => {
	if (!suggestionsContainer) return;
	const items = suggestionsContainer.querySelectorAll('.search-suggestion-item');
	if (!items.length) return;

	activeSuggestionIndex = Math.max(-1, Math.min(index, items.length - 1));

	items.forEach((item, idx) => {
		item.classList.toggle('active', idx === activeSuggestionIndex);
	});

	if (activeSuggestionIndex >= 0) {
		items[activeSuggestionIndex].scrollIntoView({
			block: 'nearest'
		});
	}
};

/**
 * Create a single suggestion item
 */
const createSuggestionItem = (pokemon, index, selectCallback) => {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'search-suggestion-item';
	button.dataset.index = index;

	const sprite = document.createElement('img');
	sprite.src = getPokemonSpriteUrl(pokemon.url);
	sprite.alt = pokemon.name;
	sprite.loading = 'lazy';

	const label = document.createElement('span');
	label.className = 'suggestion-label';
	label.textContent = formatPokemonNameWithCapitalization(pokemon.name);

	button.append(sprite, label);

	button.addEventListener('click', () => {
		searchInput.value = pokemon.name;
		hideSearchSuggestions();
		selectCallback(pokemon.name);
	});

	return button;
};

/**
 * Show search suggestions based on query
 */
const showSearchSuggestions = (query, selectCallback) => {
	if (!query || !pokemonSearchIndex.length || !suggestionsContainer) {
		hideSearchSuggestions();
		return;
	}

	const normalized = query.trim().toLowerCase();
	if (!normalized) {
		hideSearchSuggestions();
		return;
	}

	const matches = pokemonSearchIndex.filter((pokemon) =>
		pokemon.name.includes(normalized)
	);
	if (!matches.length) {
		hideSearchSuggestions();
		return;
	}

	const visibleMatches = matches.slice(0, 20);
	const fragment = document.createDocumentFragment();
	visibleMatches.forEach((pokemon, index) => {
		fragment.appendChild(createSuggestionItem(pokemon, index, selectCallback));
	});
	suggestionsContainer.innerHTML = '';
	suggestionsContainer.appendChild(fragment);
	suggestionsContainer.classList.remove('hidden');
	activeSuggestionIndex = -1;
};

/**
 * Debounced search function
 */
const debouncedPokemonSearch = debounce((speciesName, selectCallback) => {
	selectCallback(speciesName);
}, 300);

/**
 * Setup event listeners for search
 */
const setupSearchEventListeners = async (selectCallback) => {
	// Load search index on first interaction
	const ensureSearchIndexLoaded = async () => {
		if (pokemonSearchIndex.length === 0) {
			pokemonSearchIndex = await loadPokemonSearchIndex();
		}
	};

	// Keyboard navigation and search submission
	searchInput.addEventListener('keydown', (e) => {
		if (!suggestionsContainer.classList.contains('hidden')) {
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					setActiveSuggestion(activeSuggestionIndex + 1);
					return;
				case 'ArrowUp':
					e.preventDefault();
					setActiveSuggestion(activeSuggestionIndex - 1);
					return;
				case 'Escape':
					e.preventDefault();
					hideSearchSuggestions();
					return;
				case 'Enter':
					if (activeSuggestionIndex >= 0) {
						e.preventDefault();
						const activeItem = suggestionsContainer.querySelector('.search-suggestion-item.active');
						activeItem?.click();
						return;
					}
					break;
			}
		}

		if (e.key === 'Enter') {
			debouncedPokemonSearch(searchInput.value.toLowerCase(), selectCallback);
		}
	});

	// Input search
	searchInput.addEventListener('input', async () => {
		clearSearchError();
		await ensureSearchIndexLoaded();
		showSearchSuggestions(searchInput.value.toLowerCase(), selectCallback);
	});

	// Focus search
	searchInput.addEventListener('focus', async () => {
		if (searchInput.value.trim()) {
			await ensureSearchIndexLoaded();
			showSearchSuggestions(searchInput.value.toLowerCase(), selectCallback);
		}
	});
};

/**
 * Setup search button listener (called from main.js)
 */
export const setupSearchButton = (searchButton, selectPokemon) => {
	if (!searchButton) return;

	const debouncedSearch = debounce((speciesName) => {
		selectPokemon(speciesName);
	}, 300);

	searchButton.addEventListener('click', () => {
		debouncedSearch(searchInput.value.toLowerCase());
	});
};

/**
 * Setup keyboard shortcut (called from main.js)
 */
export const setupSearchShortcut = (searchInput_ref) => {
	document.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === '/') {
			e.preventDefault();
			searchInput_ref.focus();
		}
	});
};

/**
 * Close suggestions on outside click (called from main.js)
 */
export const setupSearchOutsideClick = (searchInput_ref) => {
	window.addEventListener('click', (event) => {
		if (
			suggestionsContainer &&
			!suggestionsContainer.classList.contains('hidden') &&
			!suggestionsContainer.contains(event.target) &&
			event.target !== searchInput_ref
		) {
			hideSearchSuggestions();
		}
	});
};
