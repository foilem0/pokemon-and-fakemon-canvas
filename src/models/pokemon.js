/**
 * pokemon.js - Pokémon data models and formatting utilities
 */

/**
 * Format Pokémon name (replace hyphens with spaces)
 */
export const formatPokemonName = (name) => name.replace(/-/g, ' ');

/**
 * Capitalize first letter of text
 */
export const capitalizeFirstLetter = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Format Pokémon name with proper capitalization
 */
export const formatPokemonNameWithCapitalization = (name) => {
	return formatPokemonName(name).replace(/\b\w/g, (letter) => letter.toUpperCase());
};

/**
 * Format flavor text (clean up special characters and formatting)
 */
export const formatFlavorText = (text) => {
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
 * Get Pokémon sprite URL from API response URL
 */
export const getPokemonSpriteUrl = (pokemonUrl) => {
	if (!pokemonUrl) return '';
	const match = pokemonUrl.match(/\/(\d+)\/$/);
	if (!match) return '';
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${match[1]}.png`;
};

/**
 * Available Pokémon types
 */
export const POKEMON_TYPES = [
	{ name: 'Normal', value: 'normal' },
	{ name: 'Fire', value: 'fire' },
	{ name: 'Water', value: 'water' },
	{ name: 'Electric', value: 'electric' },
	{ name: 'Grass', value: 'grass' },
	{ name: 'Ice', value: 'ice' },
	{ name: 'Fighting', value: 'fighting' },
	{ name: 'Poison', value: 'poison' },
	{ name: 'Ground', value: 'ground' },
	{ name: 'Flying', value: 'flying' },
	{ name: 'Psychic', value: 'psychic' },
	{ name: 'Bug', value: 'bug' },
	{ name: 'Rock', value: 'rock' },
	{ name: 'Ghost', value: 'ghost' },
	{ name: 'Dragon', value: 'dragon' },
	{ name: 'Dark', value: 'dark' },
	{ name: 'Steel', value: 'steel' },
	{ name: 'Fairy', value: 'fairy' }
];

/**
 * Color mapping for Pokémon colors
 */
export const COLOR_MAP = {
	red: '#f44336',
	blue: '#2196f3',
	yellow: '#ffeb3b',
	green: '#4caf50',
	black: '#000000',
	brown: '#795548',
	gray: '#9e9e9e',
	white: '#ffffff',
	purple: '#9c27b0',
	pink: '#e91e63'
};

/**
 * Rank colors for stat bars
 */
export const STAT_RANK_COLORS = [
	{ range: [0, 29], class: 'barchart-rank-1', color: '#f34444' },
	{ range: [30, 59], class: 'barchart-rank-2', color: '#ff7f0f' },
	{ range: [60, 89], class: 'barchart-rank-3', color: '#ffdd57' },
	{ range: [90, 119], class: 'barchart-rank-4', color: '#a0e515' },
	{ range: [120, 149], class: 'barchart-rank-5', color: '#23cd5e' },
	{ range: [150, 255], class: 'barchart-rank-6', color: '#00c2b8' }
];

/**
 * Get rank class and color for a stat value
 */
export const getStatRankInfo = (value) => {
	for (const rank of STAT_RANK_COLORS) {
		if (value >= rank.range[0] && value <= rank.range[1]) {
			return { class: rank.class, color: rank.color };
		}
	}
	return { class: 'barchart-rank-1', color: '#f34444' };
};
