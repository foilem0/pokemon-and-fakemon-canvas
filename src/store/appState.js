/**
 * appState.js - Central state management with Observer pattern
 * Single source of truth for Pokémon data and UI state
 */

class AppStateManager {
	constructor() {
		this.state = {
			speciesData: null,
			pokemonData: null,
			evolutionChain: null,
			isShiny: false,
			varieties: [],
			statAffectors: {
				level: 50,
				nature: 'hardy',
				evs: {},
				ivs: {}
			},
			theme: localStorage.getItem('theme') || 'dark'
		};

		// Initialize stat affectors with default values
		const statAffectorNames = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack'];
		statAffectorNames.forEach(stat => {
			this.state.statAffectors.evs[stat] = 0;
			this.state.statAffectors.ivs[stat] = 31;
		});

		this.listeners = new Map();
	}

	/**
	 * Subscribe to state changes for a specific key
	 * Returns an unsubscribe function
	 */
	subscribe(key, callback) {
		if (!this.listeners.has(key)) {
			this.listeners.set(key, []);
		}
		this.listeners.get(key).push(callback);

		return () => {
			const callbacks = this.listeners.get(key);
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		};
	}

	/**
	 * Notify all listeners of a state change
	 */
	notifyListeners(key, newValue) {
		if (this.listeners.has(key)) {
			this.listeners.get(key).forEach(callback => {
				callback(newValue, this.state);
			});
		}
	}

	/**
	 * Update state and notify listeners
	 */
	setState(key, value) {
		if (this.state[key] !== value) {
			this.state[key] = value;
			this.notifyListeners(key, value);
		}
	}

	/**
	 * Get current state value
	 */
	getState(key) {
		return this.state[key];
	}

	/**
	 * Get entire state object
	 */
	getAllState() {
		return this.state;
	}

	/**
	 * Update nested state (like statAffectors.level)
	 */
	setNestedState(parentKey, childKey, value) {
		if (this.state[parentKey] && this.state[parentKey][childKey] !== value) {
			this.state[parentKey][childKey] = value;
			this.notifyListeners(parentKey, this.state[parentKey]);
		}
	}

	/**
	 * Get nested state value
	 */
	getNestedState(parentKey, childKey) {
		if (this.state[parentKey]) {
			return this.state[parentKey][childKey];
		}
		return null;
	}

	/**
	 * Update deeply nested state (like statAffectors.evs.speed)
	 */
	setDeeplyNestedState(parentKey, childKey, nestedKey, value) {
		if (this.state[parentKey] && this.state[parentKey][childKey]) {
			if (this.state[parentKey][childKey][nestedKey] !== value) {
				this.state[parentKey][childKey][nestedKey] = value;
				this.notifyListeners(parentKey, this.state[parentKey]);
			}
		}
	}

	/**
	 * Get deeply nested state value
	 */
	getDeeplyNestedState(parentKey, childKey, nestedKey) {
		if (this.state[parentKey] && this.state[parentKey][childKey]) {
			return this.state[parentKey][childKey][nestedKey];
		}
		return null;
	}

	/**
	 * Reset Pokémon data (when changing species)
	 */
	resetPokemonData() {
		this.setState('speciesData', null);
		this.setState('pokemonData', null);
		this.setState('evolutionChain', null);
		this.setState('isShiny', false);
		this.setState('varieties', []);
	}

	/**
	 * Reset stat affectors to defaults
	 */
	resetStatAffectors() {
		this.setNestedState('statAffectors', 'level', 50);
		this.setNestedState('statAffectors', 'nature', 'hardy');

		const statAffectorNames = ['hp', 'attack', 'defense', 'speed', 'special-defense', 'special-attack'];
		statAffectorNames.forEach(stat => {
			this.state.statAffectors.evs[stat] = 0;
			this.state.statAffectors.ivs[stat] = 31;
		});

		this.notifyListeners('statAffectors', this.state.statAffectors);
	}

	/**
	 * Bulk update pokemon data
	 */
	setPokemonDataBulk(speciesData, pokemonData, evolutionChain, varieties) {
		this.state.speciesData = speciesData;
		this.state.pokemonData = pokemonData;
		this.state.evolutionChain = evolutionChain;
		this.state.varieties = varieties;
		this.state.isShiny = false;

		this.notifyListeners('speciesData', speciesData);
		this.notifyListeners('pokemonData', pokemonData);
		this.notifyListeners('evolutionChain', evolutionChain);
		this.notifyListeners('varieties', varieties);
		this.notifyListeners('isShiny', false);
	}

	/**
	 * Update theme and save to localStorage
	 */
	setTheme(theme) {
		this.state.theme = theme;
		localStorage.setItem('theme', theme);
		this.notifyListeners('theme', theme);
	}
}

// Export singleton instance
export const appState = new AppStateManager();
