/**
 * pokeapi.js - PokeAPI data fetching and caching layer
 * Handles all HTTP requests to the PokeAPI with storage caching
 */

import * as StorageManager from '../store/storageManager.js';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/';
const SEARCH_INDEX_CACHE_KEY = 'pokemon_species_search_index';

/**
 * Fetch and cache Pokémon species data
 */
export const fetchSpeciesData = async (speciesName) => {
	let speciesData = await StorageManager.get(
		StorageManager.STORES.SPECIES_DATA,
		`species_${speciesName}`
	);

	if (!speciesData) {
		const response = await fetch(`${POKEAPI_BASE_URL}pokemon-species/${speciesName}`);
		if (!response.ok) {
			throw new Error(`Pokémon "${speciesName}" not found.`);
		}
		speciesData = await response.json();
		await StorageManager.set(
			StorageManager.STORES.SPECIES_DATA,
			`species_${speciesName}`,
			speciesData
		);
	}

	return speciesData;
};

/**
 * Fetch and cache Pokémon data (by URL or name)
 */
export const fetchPokemonData = async (pokemonUrl) => {
	let pokemonData = await StorageManager.get(
		StorageManager.STORES.POKEMON_DATA,
		`pokemon_${pokemonUrl}`
	);

	if (!pokemonData) {
		const response = await fetch(pokemonUrl);
		pokemonData = await response.json();
		await StorageManager.set(
			StorageManager.STORES.POKEMON_DATA,
			`pokemon_${pokemonUrl}`,
			pokemonData
		);
	}

	return pokemonData;
};

/**
 * Fetch and cache evolution chain data
 */
export const fetchEvolutionChainData = async (chainUrl) => {
	let evoChainData = await StorageManager.get(
		StorageManager.STORES.POKEMON_DATA,
		`evo_chain_${chainUrl}`
	);

	if (!evoChainData) {
		const response = await fetch(chainUrl);
		evoChainData = await response.json();
		await StorageManager.set(
			StorageManager.STORES.POKEMON_DATA,
			`evo_chain_${chainUrl}`,
			evoChainData
		);
	}

	return evoChainData;
};

/**
 * Fetch and cache Pokémon sprite (for evolution chain)
 */
export const fetchPokemonSprite = async (pokemonName) => {
	let data = await StorageManager.get(
		StorageManager.STORES.POKEMON_DATA,
		`pokemon_evo_${pokemonName}`
	);

	if (!data) {
		const response = await fetch(`${POKEAPI_BASE_URL}pokemon/${pokemonName}`);
		data = await response.json();
		await StorageManager.set(
			StorageManager.STORES.POKEMON_DATA,
			`pokemon_evo_${pokemonName}`,
			data
		);
	}

	return data;
};

/**
 * Fetch and cache item data (for evolution conditions)
 */
export const fetchItemData = async (itemUrl) => {
	try {
		let itemData = await StorageManager.get(
			StorageManager.STORES.POKEMON_DATA,
			`item_${itemUrl}`
		);

		if (!itemData) {
			const response = await fetch(itemUrl);
			if (!response.ok) throw new Error('Item not found');
			itemData = await response.json();
			await StorageManager.set(
				StorageManager.STORES.POKEMON_DATA,
				`item_${itemUrl}`,
				itemData
			);
		}

		return itemData;
	} catch (error) {
		console.error('Error fetching item data:', error);
		return null;
	}
};

/**
 * Load the entire Pokémon search index
 */
export const loadPokemonSearchIndex = async () => {
	const cachedIndex = await StorageManager.get(
		StorageManager.STORES.SEARCH_INDEX,
		SEARCH_INDEX_CACHE_KEY
	);

	if (Array.isArray(cachedIndex) && cachedIndex.length > 0) {
		return cachedIndex;
	}

	try {
		const response = await fetch(`${POKEAPI_BASE_URL}pokemon-species?limit=100000`);
		const data = await response.json();
		if (Array.isArray(data.results)) {
			await StorageManager.set(
				StorageManager.STORES.SEARCH_INDEX,
				SEARCH_INDEX_CACHE_KEY,
				data.results
			);
			return data.results;
		}
	} catch (error) {
		console.error('Could not load Pokémon search index:', error);
	}

	return [];
};

/**
 * Try to fetch mega stone data for a Pokémon
 */
export const fetchMegaStoneData = async (basePokemonName) => {
	const megaStoneApiUrl = `${POKEAPI_BASE_URL}item/${basePokemonName}-megastone`;

	try {
		let megaStoneData = await StorageManager.get(
			StorageManager.STORES.POKEMON_DATA,
			`item_${megaStoneApiUrl}`
		);

		if (!megaStoneData) {
			const response = await fetch(megaStoneApiUrl);
			if (response.ok) {
				megaStoneData = await response.json();
				await StorageManager.set(
					StorageManager.STORES.POKEMON_DATA,
					`item_${megaStoneApiUrl}`,
					megaStoneData
				);
			} else {
				console.warn(`Mega stone for ${basePokemonName} not found via API.`);
				return null;
			}
		}

		return megaStoneData;
	} catch (error) {
		console.error('Error fetching mega stone data:', error);
		return null;
	}
};
