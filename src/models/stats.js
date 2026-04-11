/**
 * stats.js - Pure functions for Pokémon stat calculations
 * Implements the official Pokémon stat formulas
 */

/**
 * Calculate final HP stat using the official formula
 * HP = floor((2 * Base + IV + floor(EV/4)) * Level / 100) + Level + 10
 */
export const calculateHP = (baseValue, iv, ev, level) => {
	const adjustedEv = Math.floor(ev / 4);
	return Math.floor(((2 * baseValue + iv + adjustedEv) * level) / 100) + level + 10;
};

/**
 * Calculate final stat for non-HP stats using the official formula
 * Stat = floor((floor((2 * Base + IV + floor(EV/4)) * Level / 100) + 5) * Nature)
 */
export const calculateStat = (baseValue, iv, ev, level, nature = 1) => {
	const adjustedEv = Math.floor(ev / 4);
	const intermediate = Math.floor(((2 * baseValue + iv + adjustedEv) * level) / 100) + 5;
	return Math.floor(intermediate * nature);
};

/**
 * Calculate final stat value for a given stat name
 * Automatically chooses between HP and regular stat formula
 */
export const calculateFinalStat = (baseValue, iv, ev, level, statName, natureMultiplier = 1) => {
	if (statName === 'hp') {
		return calculateHP(baseValue, iv, ev, level);
	}
	return calculateStat(baseValue, iv, ev, level, natureMultiplier);
};

/**
 * Nature effects mapping
 */
export const natureEffects = {
	hardy: { increase: null, decrease: null },
	lonely: { increase: 'attack', decrease: 'defense' },
	adamant: { increase: 'attack', decrease: 'special-attack' },
	naughty: { increase: 'attack', decrease: 'special-defense' },
	brave: { increase: 'attack', decrease: 'speed' },
	bold: { increase: 'defense', decrease: 'attack' },
	docile: { increase: null, decrease: null },
	relaxed: { increase: 'defense', decrease: 'speed' },
	impish: { increase: 'defense', decrease: 'special-attack' },
	lax: { increase: 'defense', decrease: 'special-defense' },
	timid: { increase: 'speed', decrease: 'attack' },
	hasty: { increase: 'speed', decrease: 'defense' },
	serious: { increase: null, decrease: null },
	jolly: { increase: 'speed', decrease: 'special-attack' },
	mild: { increase: 'special-attack', decrease: 'defense' },
	modest: { increase: 'special-attack', decrease: 'attack' },
	naive: { increase: 'speed', decrease: 'special-defense' },
	quiet: { increase: 'special-attack', decrease: 'speed' },
	bashful: { increase: null, decrease: null },
	quirky: { increase: null, decrease: null },
	rash: { increase: 'special-attack', decrease: 'special-defense' },
	sassy: { increase: 'special-defense', decrease: 'speed' },
	calm: { increase: 'special-defense', decrease: 'attack' },
	careful: { increase: 'special-defense', decrease: 'special-attack' },
	gentle: { increase: 'special-defense', decrease: 'defense' }
};

/**
 * Get the nature multiplier for a given stat
 */
export const getNatureMultiplier = (statName, natureName) => {
	const nature = natureEffects[natureName] || {};
	if (nature.increase === statName) return 1.1;
	if (nature.decrease === statName) return 0.9;
	return 1;
};

/**
 * Get the nature sign (+/-) for a given stat
 */
export const getNatureSign = (statName, natureName) => {
	const nature = natureEffects[natureName] || {};
	if (nature.increase === statName) return '+';
	if (nature.decrease === statName) return '-';
	return '';
};

/**
 * Calculate total base stat (BST)
 */
export const calculateBST = (baseStats) => {
	return baseStats.reduce((sum, stat) => sum + (parseInt(stat, 10) || 0), 0);
};

/**
 * Stat metadata
 */
export const POKEMON_STATS = [
	{ name: 'HP', apiName: 'hp' },
	{ name: 'Attack', apiName: 'attack' },
	{ name: 'Defense', apiName: 'defense' },
	{ name: 'Speed', apiName: 'speed' },
	{ name: 'Sp. Defense', apiName: 'special-defense' },
	{ name: 'Sp. Attack', apiName: 'special-attack' }
];

export const STAT_BAR_DISPLAY_ORDER = [
	{ name: 'HP', apiName: 'hp' },
	{ name: 'Attack', apiName: 'attack' },
	{ name: 'Defense', apiName: 'defense' },
	{ name: 'Sp. Attack', apiName: 'special-attack' },
	{ name: 'Sp. Defense', apiName: 'special-defense' },
	{ name: 'Speed', apiName: 'speed' }
];

/**
 * Available natures
 */
export const NATURE_NAMES = [
	'Hardy', 'Lonely', 'Adamant', 'Naughty', 'Brave',
	'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
	'Timid', 'Hasty', 'Serious', 'Jolly', 'Mild',
	'Modest', 'Naive', 'Quiet', 'Quirky', 'Rash',
	'Sassy', 'Calm', 'Careful', 'Gentle'
];

/**
 * Default stat affector state
 */
export const createDefaultStatAffectors = () => ({
	level: 50,
	nature: 'hardy',
	evs: {
		hp: 0,
		attack: 0,
		defense: 0,
		speed: 0,
		'special-defense': 0,
		'special-attack': 0
	},
	ivs: {
		hp: 31,
		attack: 31,
		defense: 31,
		speed: 31,
		'special-defense': 31,
		'special-attack': 31
	}
});
