/**
 * portrait.js - Portrait display, shiny toggle, and form selection UI
 */

import {
	formatPokemonName,
	formatPokemonNameWithCapitalization
} from '../models/pokemon.js';
import * as StorageManager from '../store/storageManager.js';
import { appState } from '../store/appState.js';

let portrait;
let portraitUpload;
let shinyToggleBtn;
let pokemonFormSelector;

/**
 * Initialize portrait UI module
 */
export const initPortrait = (deps) => {
	portrait = deps.portrait;
	portraitUpload = deps.portraitUpload;
	shinyToggleBtn = deps.shinyToggleBtn;
	pokemonFormSelector = deps.pokemonFormSelector;

	setupPortraitEventListeners();
};

/**
 * Setup portrait event listeners
 */
const setupPortraitEventListeners = () => {
	if (shinyToggleBtn) {
		shinyToggleBtn.addEventListener('click', toggleShiny);
	}
	if (portraitUpload) {
		portraitUpload.addEventListener('change', handleImageUpload);
	}
};

/**
 * Set image with fallback
 */
const setImageWithFallback = (imgElement, src, fallbackSrc = '#') => {
	if (!src || src === '#') {
		imgElement.style.display = 'none';
		return;
	}
	imgElement.style.display = 'block';
	imgElement.src = src;
	imgElement.onerror = () => {
		if (fallbackSrc) {
			imgElement.src = fallbackSrc;
		} else {
			imgElement.style.display = 'none';
		}
	};
};

/**
 * Toggle shiny sprite
 */
const toggleShiny = () => {
	const pokemonData = appState.getState('pokemonData');
	if (!pokemonData) return;

	const artwork = pokemonData.sprites.other['official-artwork'];
	if (!artwork || !artwork.front_shiny) return;

	const isShiny = appState.getState('isShiny');
	appState.setState('isShiny', !isShiny);

	const portraitSrc = !isShiny ? artwork.front_shiny : artwork.front_default;
	setImageWithFallback(portrait, portraitSrc);
};

/**
 * Handle image upload
 */
const handleImageUpload = async (event) => {
	const file = event.target.files[0];
	if (file) {
		try {
			const blobUrl = URL.createObjectURL(file);
			setImageWithFallback(portrait, blobUrl);
			shinyToggleBtn.style.display = 'none';
			await StorageManager.savePortrait('custom_portrait', file);
		} catch (error) {
			console.error('Failed to save portrait:', error);
		}
	}
};

/**
 * Update portrait and forms selector
 */
export const updatePortraitAndForms = () => {
	pokemonFormSelector.innerHTML = '';

	const pokemonData = appState.getState('pokemonData');
	const varieties = appState.getState('varieties');

	const artwork = pokemonData.sprites.other['official-artwork'];
	const portraitSrc = artwork?.front_default || pokemonData.sprites.front_default || '';
	setImageWithFallback(portrait, portraitSrc);
	shinyToggleBtn.style.display = artwork?.front_shiny ? 'block' : 'none';

	const speciesData = appState.getState('speciesData');
	const baseForm = varieties.find((v) => v.is_default);
	const otherForms = varieties.filter((v) => !v.is_default);
	const allForms = [baseForm, ...otherForms].filter(Boolean);

	if (allForms.length > 1) {
		const formSelect = document.createElement('select');
		formSelect.addEventListener('change', (e) => {
			window.__fetchAndDisplayPokemon?.(e.target.value);
		});

		allForms.forEach((form) => {
			const option = document.createElement('option');
			option.value = form.pokemon.url;
			let prettyName = formatPokemonName(form.pokemon.name
				.replace(speciesData.name, ''))
				.trim();
			option.textContent =
				prettyName === '' ?
				'Base' :
				formatPokemonNameWithCapitalization(prettyName);

			if (form.pokemon.name === pokemonData.name) {
				option.selected = true;
			}
			formSelect.appendChild(option);
		});
		pokemonFormSelector.appendChild(formSelect);
	}
};

/**
 * Setup keyboard shortcut for shiny toggle
 */
export const setupShinyShortcut = () => {
	document.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			toggleShiny();
		}
	});
};

/**
 * Setup keyboard shortcut for portrait reset
 */
export const setupPortraitResetShortcut = () => {
	document.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
			e.preventDefault();
			updatePortraitAndForms();
		}
	});
};
