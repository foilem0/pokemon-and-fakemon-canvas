/**
 * main.js - Application entry point and orchestrator
 * Wires together all modules and coordinates the application flow
 */

import * as StorageManager from './store/storageManager.js';
import { appState } from './store/appState.js';
import * as PokeAPI from './api/pokeapi.js';
import {
	formatPokemonName,
	formatPokemonNameWithCapitalization,
	COLOR_MAP,
	POKEMON_TYPES
} from './models/pokemon.js';
import { POKEMON_STATS } from './models/stats.js';
import { initSearch, displaySearchError, clearSearchError, setupSearchButton, setupSearchShortcut, setupSearchOutsideClick } from './ui/search.js';
import { initStatPanel, updateFinalStats, resetStatAffectors, updateBST, updateStatDisplay } from './ui/statPanel.js';
import { initEvolutionPanel, updateEvolutionChain, displayEvolutionItemSprite, getFormattedEvolutionCondition } from './ui/evolutionPanel.js';
import { initPortrait, updatePortraitAndForms, setupShinyShortcut, setupPortraitResetShortcut } from './ui/portrait.js';

// DOM elements for info panel
let nationalDexNumber, pokemonGenus, pokemonHeight, pokemonWeight, genderSlider, maleRatio, femaleRatio, genderRatioBar;
let evolutionCondition, eggGroup1, eggGroup2, pokemonColor;
let ability1, ability2, hiddenAbility;
let flavorText;
let primaryTypeSelector, secondaryTypeSelector, primaryTypeDisplay, secondaryTypeDisplay, typeContainer;
let themeToggleBtn, infoButton, infoPopup, popupCloseButton;
let pokemonName;

/**
 * Initialize the application
 */
const init = async () => {
	// Initialize storage
	await StorageManager.init();

	// Cache all DOM elements
	cacheAllDOMElements();

	// Apply saved theme
	applySavedTheme();

	// Initialize all UI modules
	initSearch({
		searchInput: document.getElementById('pokemon-search-input'),
		suggestionsContainer: document.getElementById('search-suggestions-container'),
		searchErrorContainer: document.getElementById('search-error-container')
	}, selectPokemon);

	initStatPanel({
		statContainer: document.getElementById('stat-container'),
		hexagonContainer: document.getElementById('stats-hexagon-container'),
		natureSelect: document.getElementById('nature-select'),
		levelInput: document.getElementById('level-input'),
		affectorStatContainer: document.getElementById('affector-stat-container'),
		statAffectorToggle: document.getElementById('stat-affector-toggle'),
		statAffectorClose: document.getElementById('stat-affector-close')
	});

	initEvolutionPanel({
		evolutionContainer: document.getElementById('evolution-container')
	});

	initPortrait({
		portrait: document.getElementById('pokemon-portrait'),
		portraitUpload: document.getElementById('portrait-upload'),
		shinyToggleBtn: document.getElementById('shiny-toggle-button'),
		pokemonFormSelector: document.getElementById('form-buttons-container')
	});

	// Setup type dropdowns
	populateTypeDropdowns();

	// Load search index
	await PokeAPI.loadPokemonSearchIndex();

	// Setup all event listeners
	setupEventListeners();

	// Subscribe to state changes
	subscribeToStateChanges();
};

/**
 * Cache all DOM elements
 */
const cacheAllDOMElements = () => {
	// Info panel elements
	nationalDexNumber = document.getElementById('national-dex-number');
	pokemonGenus = document.getElementById('pokemon-genus');
	pokemonHeight = document.getElementById('pokemon-height');
	pokemonWeight = document.getElementById('pokemon-weight');
	genderSlider = document.getElementById('gender-slider');
	maleRatio = document.getElementById('male-ratio');
	femaleRatio = document.getElementById('female-ratio');
	genderRatioBar = document.getElementById('gender-ratio');
	evolutionCondition = document.getElementById('evolution-condition');
	eggGroup1 = document.getElementById('egg-group-1');
	eggGroup2 = document.getElementById('egg-group-2');
	pokemonColor = document.getElementById('pokemon-color');

	// Ability elements
	ability1 = document.getElementById('ability1');
	ability2 = document.getElementById('ability2');
	hiddenAbility = document.getElementById('ability-hidden');

	// Flavor text
	flavorText = document.getElementById('flavor-text');

	// Type elements
	primaryTypeSelector = document.getElementById('type1-select');
	secondaryTypeSelector = document.getElementById('type2-select');
	primaryTypeDisplay = document.getElementById('type-box-1');
	secondaryTypeDisplay = document.getElementById('type-box-2');
	typeContainer = document.querySelector('.type-container');

	// Theme and info
	themeToggleBtn = document.getElementById('theme-toggle');
	infoButton = document.getElementById('information-button');
	infoPopup = document.getElementById('info-popup');
	popupCloseButton = document.getElementById('popup-close-button');

	// Pokémon name
	pokemonName = document.getElementById('pokemon-name');
};

/**
 * Apply saved theme from localStorage
 */
const applySavedTheme = () => {
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme) {
		document.documentElement.setAttribute('data-theme', savedTheme);
	}
};

/**
 * Toggle theme
 */
const toggleTheme = () => {
	const currentTheme = document.documentElement.getAttribute('data-theme');
	const newTheme = currentTheme === 'light' ? 'dark' : 'light';
	document.documentElement.setAttribute('data-theme', newTheme);
	appState.setTheme(newTheme);
};

/**
 * Populate type dropdowns
 */
const populateTypeDropdowns = () => {
	[primaryTypeSelector, secondaryTypeSelector].forEach(selectElement => {
		const initialOptionValue = selectElement.id === 'type1-select' ? '' : 'none';
		while (selectElement.children.length > 1 || (selectElement.children.length === 1 && selectElement.children[0].value !== initialOptionValue)) {
			selectElement.removeChild(selectElement.lastChild);
		}

		POKEMON_TYPES.forEach(type => {
			const option = document.createElement('option');
			option.value = type.value;
			option.textContent = type.name;
			selectElement.appendChild(option);
		});
	});
};

/**
 * Update type display
 */
const updateTypeDisplay = (selectedType, typeNumber) => {
	const targetTypeBox = typeNumber === 1 ? primaryTypeDisplay : secondaryTypeDisplay;
	targetTypeBox.className = 'type-box';

	if (selectedType === 'none' || selectedType === '') {
		targetTypeBox.classList.add('type-none');
	} else {
		targetTypeBox.classList.add(`type-${selectedType}`);
	}
};

/**
 * Update types display
 */
const updateTypes = () => {
	const pokemonData = appState.getState('pokemonData');
	const types = pokemonData.types;

	typeContainer.classList.remove('single-type');
	primaryTypeDisplay.classList.remove('hidden');
	secondaryTypeDisplay.classList.remove('hidden');

	if (types[0]) {
		primaryTypeSelector.value = types[0].type.name;
		updateTypeDisplay(types[0].type.name, 1);
	} else {
		updateTypeDisplay('', 1);
	}

	if (types[1]) {
		secondaryTypeSelector.value = types[1].type.name;
		updateTypeDisplay(types[1].type.name, 2);
	} else {
		updateTypeDisplay('none', 2);
		secondaryTypeDisplay.classList.add('hidden');
		typeContainer.classList.add('single-type');
	}
};

/**
 * Update abilities display
 */
const updateAbilities = () => {
	ability1.value = 'N/A';
	ability2.value = 'N/A';
	hiddenAbility.value = 'N/A';

	const pokemonData = appState.getState('pokemonData');
	pokemonData.abilities.forEach((ability) => {
		if (ability.is_hidden) {
			hiddenAbility.value = formatPokemonName(ability.ability.name);
		} else if (ability.slot === 1) {
			ability1.value = formatPokemonName(ability.ability.name);
		} else if (ability.slot === 2) {
			ability2.value = formatPokemonName(ability.ability.name);
		}
	});
};

/**
 * Update stats from API
 */
const updateStatsFromAPI = () => {
	const pokemonData = appState.getState('pokemonData');
	const statElements = {};

	// Build stat elements map from DOM
	POKEMON_STATS.forEach((stat) => {
		statElements[stat.apiName] = {
			valueInput: document.getElementById(`stat-value-${stat.apiName}`),
			slider: document.getElementById(`stat-slider-${stat.apiName}`)
		};
	});

	// Update each stat from API data
	pokemonData.stats.forEach((s) => {
		const value = s.base_stat;
		const statApiName = s.stat.name;
		const elements = statElements[statApiName];

		if (elements && elements.valueInput && elements.slider) {
			elements.valueInput.value = value;
			elements.slider.value = value;
			updateStatDisplay(elements.slider, elements.valueInput, value);
		}
	});

	updateBST();
	updateFinalStats();
};

/**
 * Update flavor text
 */
const updateFlavorText = () => {
	const speciesData = appState.getState('speciesData');
	if (speciesData && speciesData.flavor_text_entries) {
		const englishFlavorText = speciesData.flavor_text_entries.find(
			(entry) => entry.language.name === 'en'
		);
		flavorText.value = englishFlavorText ?
			formatFlavorText(englishFlavorText.flavor_text) :
			'No flavor text available';
	} else {
		flavorText.value = 'Search for a Pokémon to see its Pokédex entry';
	}
	autoResizeFlavorText();
};

/**
 * Format flavor text
 */
const formatFlavorText = (text) => {
	if (!text) return '';
	return text
		.replace(/\n\f/g, '\f')
		.replace(/\f/g, '\n')
		.replace(/\u00ad\n/g, '')
		.replace(/\u00ad/g, '')
		.replace(/ -\n/g, ' - ')
		.replace(/-\n/g, '-')
		.replace(/\n/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
};

/**
 * Auto-resize flavor text area
 */
const autoResizeFlavorText = () => {
	flavorText.style.height = 'auto';
	flavorText.style.height = flavorText.scrollHeight + 'px';
};

/**
 * Update extra information (height, weight, egg groups, etc.)
 */
const updateExtraInfo = async () => {
	const speciesData = appState.getState('speciesData');
	const pokemonData = appState.getState('pokemonData');
	const evolutionChain = appState.getState('evolutionChain');

	if (speciesData) {
		nationalDexNumber.value = speciesData.id;

		const genusEntry = speciesData.genera.find((g) => g.language.name === 'en');
		pokemonGenus.value = genusEntry ? genusEntry.genus : '???';

		pokemonColor.value = speciesData.color ? speciesData.color.name : '???';
		updateColorDisplay();

		// Gender ratio
		if (speciesData.gender_rate === -1) {
			maleRatio.textContent = 'Genderless';
			maleRatio.style.width = '100%';
			femaleRatio.style.width = '0%';
			femaleRatio.textContent = '';
			genderSlider.style.display = 'none';
			document.getElementById('gender-ratio-box').classList.add('genderless');
		} else {
			document.getElementById('gender-ratio-box').classList.remove('genderless');
			genderSlider.style.display = 'block';
			const femalePercentage = (speciesData.gender_rate / 8) * 100;
			const malePercentage = 100 - femalePercentage;
			genderSlider.value = malePercentage;
			updateGenderRatioDisplay();
		}

		// Egg groups
		if (speciesData.egg_groups && speciesData.egg_groups.length > 0) {
			eggGroup1.value = formatPokemonName(speciesData.egg_groups[0].name);
			eggGroup2.value = speciesData.egg_groups[1] ? formatPokemonName(speciesData.egg_groups[1].name) : 'N/A';
		} else {
			eggGroup1.value = 'N/A';
			eggGroup2.value = 'N/A';
		}

		// Evolution condition
		const evolutionInfo = await getFormattedEvolutionCondition(speciesData, evolutionChain, pokemonData);
		evolutionCondition.value = evolutionInfo.text;
		await displayEvolutionItemSprite(evolutionInfo.itemSpriteUrl);
	}

	if (pokemonData) {
		pokemonHeight.value = `${(pokemonData.height / 10).toFixed(1)} m`;
		pokemonWeight.value = `${(pokemonData.weight / 10).toFixed(1)} kg`;
	}
};

/**
 * Update gender ratio display
 */
const updateGenderRatioDisplay = () => {
	const malePercent = parseInt(genderSlider.value);
	const femalePercent = 100 - malePercent;

	maleRatio.textContent = malePercent > 0 ? `\u2642 ${malePercent}%` : '';
	femaleRatio.textContent = femalePercent > 0 ? `\u2640 ${femalePercent}%` : '';

	genderRatioBar.style.setProperty('--male-percent', `${malePercent}%`);
};

/**
 * Update color display
 */
const updateColorDisplay = () => {
	const colorValue = pokemonColor.value.toLowerCase();
	if (COLOR_MAP[colorValue]) {
		pokemonColor.style.backgroundColor = COLOR_MAP[colorValue];
		pokemonColor.style.color =
			colorValue === 'black' || colorValue === 'blue' || colorValue === 'purple' ?
			'white' : 'black';
	} else {
		pokemonColor.style.backgroundColor = '';
		pokemonColor.style.color = '';
	}
};

/**
 * Update all UI when Pokémon is selected
 */
const updateAllUI = async () => {
	const pokemonData = appState.getState('pokemonData');
	pokemonName.value = formatPokemonName(pokemonData.name);
	updateStatsFromAPI();
	updateTypes();
	updateAbilities();
	updatePortraitAndForms();
	await updateExtraInfo();
	updateFlavorText();
};

/**
 * Fetch and display Pokémon data
 */
const fetchAndDisplayPokemon = async (pokemonUrl) => {
	try {
		const pokemonData = await PokeAPI.fetchPokemonData(pokemonUrl);
		appState.setState('pokemonData', pokemonData);
		appState.setState('isShiny', false);

		primaryTypeSelector.value = '';
		secondaryTypeSelector.value = 'none';
		updateTypeDisplay('', 1);
		updateTypeDisplay('none', 2);

		await updateAllUI();
	} catch (error) {
		console.error('Error fetching Pokémon data:', error);
	}
};

/**
 * Select and fetch Pokémon
 */
const selectPokemon = async (speciesName) => {
	const searchInput = document.getElementById('pokemon-search-input');
	searchInput.value = speciesName;

	clearSearchError();

	try {
		const speciesData = await PokeAPI.fetchSpeciesData(speciesName);
		appState.setState('speciesData', speciesData);
		appState.setState('varieties', speciesData.varieties);

		const defaultVariety = speciesData.varieties.find((v) => v.is_default);
		if (defaultVariety) {
			await fetchAndDisplayPokemon(defaultVariety.pokemon.url);
		} else {
			console.error('No default variety found for this Pokémon species');
		}

		const evoChainData = await PokeAPI.fetchEvolutionChainData(speciesData.evolution_chain.url);
		appState.setState('evolutionChain', evoChainData);
		updateEvolutionChain();
		await updateExtraInfo();
	} catch (error) {
		console.error(`Error fetching ${speciesName}:`, error);
		displaySearchError(`Could not find Pokémon: ${speciesName}. Please check the spelling.`);
		resetUI();
	}
};

/**
 * Reset UI when Pokémon not found
 */
const resetUI = () => {
	appState.resetPokemonData();
	pokemonName.value = '';
	document.getElementById('pokemon-portrait').style.display = 'none';
	document.getElementById('shiny-toggle-button').style.display = 'none';
	document.getElementById('form-buttons-container').innerHTML = '';
	// ... additional resets
	resetStatAffectors();
	updateFinalStats();
};

/**
 * Setup all event listeners
 */
const setupEventListeners = () => {
	// Theme
	if (themeToggleBtn) {
		themeToggleBtn.addEventListener('click', toggleTheme);
	}

	// Info popup
	if (infoButton) {
		infoButton.addEventListener('click', () => {
			infoPopup.classList.toggle('hidden');
		});
	}

	if (popupCloseButton) {
		popupCloseButton.addEventListener('click', () => {
			infoPopup.classList.add('hidden');
		});
	}

	window.addEventListener('click', (event) => {
		if (infoPopup && !infoPopup.classList.contains('hidden') &&
			!infoPopup.contains(event.target) &&
			event.target !== infoButton) {
			infoPopup.classList.add('hidden');
		}
	});

	// Search button
	const searchButton = document.getElementById('search-button');
	setupSearchButton(searchButton, selectPokemon);
	setupSearchShortcut(document.getElementById('pokemon-search-input'));
	setupSearchOutsideClick(document.getElementById('pokemon-search-input'));

	// Type selectors
	if (primaryTypeSelector) {
		primaryTypeSelector.addEventListener('change', (e) => {
			updateTypeDisplay(e.target.value, 1);
		});
	}
	if (secondaryTypeSelector) {
		secondaryTypeSelector.addEventListener('change', (e) => {
			updateTypeDisplay(e.target.value, 2);
		});
	}

	// Gender slider
	if (genderSlider) {
		genderSlider.addEventListener('input', updateGenderRatioDisplay);
	}

	// Flavor text
	if (flavorText) {
		flavorText.addEventListener('input', autoResizeFlavorText);
	}

	// Color input
	if (pokemonColor) {
		pokemonColor.addEventListener('input', updateColorDisplay);
	}

	// Other keyboard shortcuts
	document.addEventListener('keydown', (e) => {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case 'b':
					e.preventDefault();
					updateStatsFromAPI();
					break;
				case 'l':
					e.preventDefault();
					toggleTheme();
					break;
			}
		}
	});

	// Shortcuts from UI modules
	setupShinyShortcut();
	setupPortraitResetShortcut();
};

/**
 * Subscribe to state changes
 */
const subscribeToStateChanges = () => {
	// We could add subscriptions here for reactive updates if needed
};

/**
 * Expose functions to global scope for UI modules to call back
 */
window.__fetchAndDisplayPokemon = fetchAndDisplayPokemon;

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
