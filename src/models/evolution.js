/**
 * evolution.js - Pure functions for parsing and rendering evolution chains
 */

/**
 * Parse a PokeAPI evolution chain into a flat, renderable tree structure
 */
export const parseEvolutionChain = (chainLink) => {
	const node = {
		name: chainLink.species.name,
		url: chainLink.species.url,
		evolutionDetails: chainLink.evolution_details || [],
		children: []
	};

	if (chainLink.evolves_to && chainLink.evolves_to.length > 0) {
		console.log(
			`Found ${chainLink.evolves_to.length} evolution(s) for ${chainLink.species.name}:`,
			chainLink.evolves_to.map(e => e.species.name)
		);

		for (const evolution of chainLink.evolves_to) {
			node.children.push(parseEvolutionChain(evolution));
		}
	}

	return node;
};

/**
 * Check if an evolution chain is linear (no branching)
 */
export const isLinearEvolutionChain = (tree) => {
	if (!tree) return true;
	if (tree.children.length > 1) return false;
	if (tree.children.length === 1) {
		return isLinearEvolutionChain(tree.children[0]);
	}
	return true;
};

/**
 * Find evolution details for a specific Pokémon in the chain
 */
export const getEvolutionDetails = (chain, targetSpeciesName) => {
	if (!chain) return null;

	if (chain.species.name === targetSpeciesName) {
		return null;
	}

	for (const evolvesTo of chain.evolves_to) {
		if (evolvesTo.species.name === targetSpeciesName) {
			return evolvesTo.evolution_details[0];
		}
		const found = getEvolutionDetails(evolvesTo, targetSpeciesName);
		if (found) {
			return found;
		}
	}
	return null;
};

/**
 * Format evolution condition details into human-readable text
 */
export const formatEvolutionCondition = (evolutionDetails) => {
	if (!evolutionDetails) return '';

	let conditionText = '';

	if (evolutionDetails.trigger) {
		switch (evolutionDetails.trigger.name) {
			case 'level-up':
				if (evolutionDetails.min_level) {
					conditionText = `Lvl ${evolutionDetails.min_level}`;
				} else {
					conditionText = 'Level up';
				}
				break;
			case 'use-item':
				if (evolutionDetails.item) {
					conditionText = evolutionDetails.item.name.replace(/-/g, ' ');
				} else {
					conditionText = 'Use item';
				}
				break;
			case 'trade':
				conditionText = 'Trade';
				break;
			case 'other':
				if (evolutionDetails.item) {
					conditionText = evolutionDetails.item.name.replace(/-/g, ' ');
				} else if (evolutionDetails.location) {
					conditionText = evolutionDetails.location.name.replace(/-/g, ' ');
				} else {
					conditionText = 'Special';
				}
				break;
			default:
				conditionText = evolutionDetails.trigger.name.replace(/-/g, ' ');
		}
	}

	const additionalConditions = [];
	if (evolutionDetails.held_item) {
		additionalConditions.push(`Holding ${evolutionDetails.held_item.name.replace(/-/g, ' ')}`);
	}
	if (evolutionDetails.min_happiness) {
		additionalConditions.push(`Happiness ${evolutionDetails.min_happiness}`);
	}
	if (evolutionDetails.known_move) {
		additionalConditions.push(`Know ${evolutionDetails.known_move.name.replace(/-/g, ' ')}`);
	}
	if (evolutionDetails.time_of_day) {
		additionalConditions.push(evolutionDetails.time_of_day);
	}

	if (additionalConditions.length > 0 && conditionText.length < 15) {
		conditionText += ` (${additionalConditions.join(', ')})`;
	}

	if (conditionText.length > 35) {
		conditionText = conditionText.substring(0, 22) + '...';
	}

	return conditionText;
};
