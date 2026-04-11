/**
 * evolutionPanel.js - Evolution chain rendering UI
 */

import {
	formatPokemonName,
	capitalizeFirstLetter
} from '../models/pokemon.js';
import {
	parseEvolutionChain,
	isLinearEvolutionChain,
	getEvolutionDetails,
	formatEvolutionCondition
} from '../models/evolution.js';
import {
	fetchPokemonSprite,
	fetchItemData,
	fetchMegaStoneData
} from '../api/pokeapi.js';
import { appState } from '../store/appState.js';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';

let evolutionContainer;

/**
 * Initialize evolution panel UI module
 */
export const initEvolutionPanel = (deps) => {
	evolutionContainer = deps.evolutionContainer;
};

/**
 * Get image with fallback
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
 * Create evolution stage element
 */
const createEvolutionStage = (evolutionData) => {
	const stage = document.createElement('div');
	stage.className = 'evolution-stage';

	const img = document.createElement('img');
	img.className = 'evolution-sprite';
	img.alt = evolutionData.name;

	const name = document.createElement('span');
	name.className = 'evolution-name';
	name.textContent = formatPokemonName(evolutionData.name);

	stage.appendChild(img);
	stage.appendChild(name);

	// Fetch and set sprite asynchronously
	(async () => {
		try {
			const data = await fetchPokemonSprite(evolutionData.name);
			const imgSrc = data.sprites.front_default || data.sprites.other['official-artwork']?.front_default || '#';
			setImageWithFallback(img, imgSrc);
		} catch (error) {
			console.error(`Error fetching evolution sprite for ${evolutionData.name}:`, error);
			setImageWithFallback(img, '#');
		}
	})();

	return stage;
};

/**
 * Create evolution arrow
 */
const createEvolutionArrow = (isLinear = false) => {
	const arrow = document.createElement('div');
	arrow.className = 'evo-arrow';
	arrow.textContent = isLinear ? '\u2192' : '\u2193';
	arrow.classList.add(isLinear ? 'horizontal' : 'vertical');
	return arrow;
};

/**
 * Create evolution condition display
 */
const createEvolutionCondition = (evolutionDetails) => {
	const condition = document.createElement('div');
	condition.className = 'evolution-condition';

	const conditionText = formatEvolutionCondition(evolutionDetails);
	condition.textContent = conditionText;
	condition.title = conditionText;
	return condition;
};

/**
 * Render evolution tree recursively
 */
const renderEvolutionTree = (tree, container, isLinear = false) => {
	if (!tree) return;

	const stageElement = createEvolutionStage(tree);
	container.appendChild(stageElement);

	if (tree.children && tree.children.length > 0) {
		if (tree.children.length === 1) {
			const child = tree.children[0];

			container.appendChild(createEvolutionArrow(isLinear));

			if (child.evolutionDetails && child.evolutionDetails.length > 0) {
				const condition = createEvolutionCondition(child.evolutionDetails[0]);
				container.appendChild(condition);
				container.appendChild(createEvolutionArrow(isLinear));
			}

			renderEvolutionTree(child, container, isLinear);
		} else {
			container.appendChild(createEvolutionArrow(isLinear));

			const branchContainer = document.createElement('div');
			branchContainer.className = 'branch-container';

			tree.children.forEach(child => {
				const branch = document.createElement('div');
				branch.className = 'evolution-branch';

				if (child.evolutionDetails && child.evolutionDetails.length > 0) {
					const condition = createEvolutionCondition(child.evolutionDetails[0]);
					branch.appendChild(condition);
					branch.appendChild(createEvolutionArrow(isLinear));
				}

				renderEvolutionTree(child, branch, isLinear);

				branchContainer.appendChild(branch);
			});

			container.appendChild(branchContainer);
		}
	}
};

/**
 * Update and render evolution chain
 */
export const updateEvolutionChain = () => {
	evolutionContainer.innerHTML = '';

	const evolutionChain = appState.getState('evolutionChain');
	if (!evolutionChain || !evolutionChain.chain) {
		return;
	}

	const evolutionTree = parseEvolutionChain(evolutionChain.chain);

	const flowContainer = document.createElement('div');
	const isLinear = isLinearEvolutionChain(evolutionTree);
	flowContainer.className = isLinear ? 'evolution-flow linear' : 'evolution-flow branched';

	renderEvolutionTree(evolutionTree, flowContainer, isLinear);
	evolutionContainer.appendChild(flowContainer);
};

/**
 * Display evolution item sprite
 */
export const displayEvolutionItemSprite = async (itemUrl) => {
	const evolutionConditionItem = document.getElementById('evolution-condition');
	if (!evolutionConditionItem) return;

	const evoConditionParent = evolutionConditionItem.closest('.info-item');
	let existingSprite = evoConditionParent ? evoConditionParent.querySelector('.evo-item-sprite') : null;

	if (!existingSprite) {
		existingSprite = document.createElement('img');
		existingSprite.classList.add('evo-item-sprite');
		if (evoConditionParent) {
			evoConditionParent.appendChild(existingSprite);
		}
	}

	if (!itemUrl) {
		existingSprite.style.display = 'none';
		existingSprite.src = '';
		existingSprite.alt = '';
		existingSprite.title = '';
		return;
	}

	const itemData = await fetchItemData(itemUrl);

	if (itemData) {
		existingSprite.src = itemData.sprites.default;
		existingSprite.alt = itemData.name;
		existingSprite.title = formatPokemonName(itemData.name);
		existingSprite.style.display = 'block';
	} else {
		existingSprite.style.display = 'none';
		existingSprite.src = '';
		existingSprite.alt = '';
		existingSprite.title = '';
	}
};

/**
 * Get formatted evolution condition text for a Pokémon
 */
export const getFormattedEvolutionCondition = async (speciesData, evolutionChain, pokemonData) => {
	if (!speciesData.evolves_from_species) {
		return 'Does not evolve from a prior form';
	}

	const preEvoName = formatPokemonName(speciesData.evolves_from_species.name);
	let evoConditionText = capitalizeFirstLetter(preEvoName);
	let itemSpriteUrl = null;

	if (evolutionChain) {
		const evolutionDetails = getEvolutionDetails(evolutionChain.chain, speciesData.name);

		if (evolutionDetails) {
			const conditionDetails = [];

			if (evolutionDetails.trigger && evolutionDetails.trigger.name === 'level-up' && evolutionDetails.min_level) {
				conditionDetails.push(`Lvl ${evolutionDetails.min_level}`);
			} else if (evolutionDetails.trigger && evolutionDetails.trigger.name === 'use-item' && evolutionDetails.item) {
				conditionDetails.push(formatPokemonName(evolutionDetails.item.name).replace('stone', 'Stone'));
				itemSpriteUrl = evolutionDetails.item.url;
			} else if (evolutionDetails.held_item) {
				conditionDetails.push(`Holding ${formatPokemonName(evolutionDetails.held_item.name).replace('protector', 'Protector').replace('reaper-cloth', 'Reaper Cloth')}`);
				itemSpriteUrl = evolutionDetails.held_item.url;
			} else if (evolutionDetails.trigger && evolutionDetails.trigger.name === 'trade') {
				conditionDetails.push('Trade');
			} else if (evolutionDetails.min_happiness) {
				conditionDetails.push('High Happiness');
			} else if (evolutionDetails.min_affection) {
				conditionDetails.push('High Affection');
			} else if (evolutionDetails.known_move) {
				conditionDetails.push(`Known Move: ${formatPokemonName(evolutionDetails.known_move.name)}`);
			} else if (evolutionDetails.known_move_type) {
				conditionDetails.push(`Known Move Type: ${evolutionDetails.known_move_type.name}`);
			}

			if (conditionDetails.length > 0) {
				evoConditionText += `, ${conditionDetails.join(', ')}`;
			}
		}
	}

	// Handle mega evolutions
	if (pokemonData && pokemonData.name.includes('-mega')) {
		const basePokemonName = pokemonData.name.replace('-mega', '');
		const megaStoneData = await fetchMegaStoneData(basePokemonName);

		if (megaStoneData) {
			evoConditionText = `${capitalizeFirstLetter(formatPokemonName(basePokemonName))}, Holding ${formatPokemonName(megaStoneData.name)}`;
			itemSpriteUrl = megaStoneData.sprites.default;
		} else {
			evoConditionText = `${capitalizeFirstLetter(formatPokemonName(basePokemonName))}, Holding Mega Stone`;
		}
	}

	return {
		text: evoConditionText || 'N/A',
		itemSpriteUrl
	};
};
