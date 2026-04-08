document.addEventListener("DOMContentLoaded", () => {
	const searchInput = document.getElementById("pokemon-search-input");
	const suggestionsContainer = document.getElementById("search-suggestions-container");
	const themeToggleBtn = document.getElementById("theme-toggle");
	const infoButton = document.getElementById("information-button");
	const infoPopup = document.getElementById("info-popup");
	const popupCloseButton = document.getElementById("popup-close-button");

	const pokemonName = document.getElementById("pokemon-name");
	const portrait = document.getElementById("pokemon-portrait");
	const portraitUpload = document.getElementById("portrait-upload");
	const shinyToggleBtn = document.getElementById("shiny-toggle-button");
	const pokemonFormSelector = document.getElementById("form-buttons-container");

	const primaryTypeSelector = document.getElementById('type1-select');
	const secondaryTypeSelector = document.getElementById('type2-select');
	const primaryTypeDisplay = document.getElementById('type-box-1');
	const secondaryTypeDisplay = document.getElementById('type-box-2');
	const typeContainer = document.querySelector('.type-container');

	const ability1 = document.getElementById("ability1");
	const ability2 = document.getElementById("ability2");
	const hiddenAbility = document.getElementById("ability-hidden");

	const flavorText = document.getElementById("flavor-text");
	const nationalDexNumber = document.getElementById("national-dex-number");
	const pokemonGenus = document.getElementById("pokemon-genus");
	const pokemonHeight = document.getElementById("pokemon-height");
	const pokemonWeight = document.getElementById("pokemon-weight");
	const genderSlider = document.getElementById("gender-slider");
	const maleRatio = document.getElementById("male-ratio");
	const femaleRatio = document.getElementById("female-ratio");
	const genderRatioBar = document.getElementById("gender-ratio");
	const evolutionCondition = document.getElementById("evolution-condition");
	const eggGroup1 = document.getElementById("egg-group-1");
	const eggGroup2 = document.getElementById("egg-group-2");
	const pokemonColor = document.getElementById("pokemon-color");

	const pokemonAppState = {
		speciesData: null,
		pokemonData: null,
		evolutionChain: null,
		isShiny: false,
		varieties: []
	};

	const getPokemonState = (key) => pokemonAppState[key];
	const setPokemonState = (key, value) => {
		pokemonAppState[key] = value;
	};
	const resetPokemonState = () => {
		pokemonAppState.speciesData = null;
		pokemonAppState.pokemonData = null;
		pokemonAppState.evolutionChain = null;
		pokemonAppState.isShiny = false;
		pokemonAppState.varieties = [];
	};

	const applySavedTheme = () => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			document.documentElement.setAttribute('data-theme', savedTheme);
		}
	};

	const toggleTheme = () => {
		const currentTheme = document.documentElement.getAttribute('data-theme');
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', newTheme);
		localStorage.setItem('theme', newTheme);
	};

	const pokemonStats = [{
			name: "HP",
			apiName: "hp"
		},
		{
			name: "Attack",
			apiName: "attack"
		},
		{
			name: "Defense",
			apiName: "defense"
		},
		{
			name: "Speed",
			apiName: "speed"
		},
		{
			name: "Sp. Defense",
			apiName: "special-defense"
		},
		{
			name: "Sp. Attack",
			apiName: "special-attack"
		}
	];

	const statBarDisplayOrder = [{
			name: "HP",
			apiName: "hp"
		},
		{
			name: "Attack",
			apiName: "attack"
		},
		{
			name: "Defense",
			apiName: "defense"
		},
		{
			name: "Sp. Attack",
			apiName: "special-attack"
		},
		{
			name: "Sp. Defense",
			apiName: "special-defense"
		},
		{
			name: "Speed",
			apiName: "speed"
		},
	];

	const availablePokemonTypes = [{
			name: 'Normal',
			value: 'normal'
		},
		{
			name: 'Fire',
			value: 'fire'
		},
		{
			name: 'Water',
			value: 'water'
		},
		{
			name: 'Electric',
			value: 'electric'
		},
		{
			name: 'Grass',
			value: 'grass'
		},
		{
			name: 'Ice',
			value: 'ice'
		},
		{
			name: 'Fighting',
			value: 'fighting'
		},
		{
			name: 'Poison',
			value: 'poison'
		},
		{
			name: 'Ground',
			value: 'ground'
		},
		{
			name: 'Flying',
			value: 'flying'
		},
		{
			name: 'Psychic',
			value: 'psychic'
		},
		{
			name: 'Bug',
			value: 'bug'
		},
		{
			name: 'Rock',
			value: 'rock'
		},
		{
			name: 'Ghost',
			value: 'ghost'
		},
		{
			name: 'Dragon',
			value: 'dragon'
		},
		{
			name: 'Dark',
			value: 'dark'
		},
		{
			name: 'Steel',
			value: 'steel'
		},
		{
			name: 'Fairy',
			value: 'fairy'
		}
	];

	const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/";

	const pokemonDataCache = {
		maxSize: 50 * 1024 * 1024, // 50mb limit
		ttl: 7 * 24 * 60 * 60 * 1000, // 7 days

		get(key) {
			try {
				const item = localStorage.getItem(key);
				if (!item) return null;

				const data = JSON.parse(item);
				if (Date.now() > data.expiry) {
					localStorage.removeItem(key);
					return null;
				}
				return data.value;
			} catch (e) {
				console.error("Cache read error:", e);
				return null;
			}
		},

		set(key, value) {
			let data;
			try {
				const data = {
					value,
					expiry: Date.now() + this.ttl
				};

				// check storage size before writing
				const serialized = JSON.stringify(data);
				if (serialized.length > this.maxSize) {
					this.cleanup();
				}

				localStorage.setItem(key, serialized);
			} catch (e) {
				if (e.name === 'QuotaExceededError') {
					this.cleanup();
					try {
						localStorage.setItem(key, JSON.stringify(data));
					} catch (retryError) {
						console.error("Cache write failed after cleanup:", retryError);
					}
				}
			}
		},

		cleanup() {
			const now = Date.now();
			for (let i = localStorage.length - 1; i >= 0; i--) {
				const key = localStorage.key(i);
				try {
					const item = JSON.parse(localStorage.getItem(key));
					if (item && item.expiry && item.expiry < now) {
						localStorage.removeItem(key);
					}
				} catch {
					localStorage.removeItem(key);
				}
			}
		}
	};

	const pokemonSearchIndex = [];
	const SEARCH_INDEX_CACHE_KEY = 'pokemon_species_search_index';
	let activeSuggestionIndex = -1;

	const statElements = {};
	const affectorElements = {
		natureSelect: null,
		levelInput: null,
		rows: {}
	};
	let isAffectorUIBuilt = false;

	const hexagonCache = {
		built: false,
		currentPolygon: null,
		valueNodes: [],
		svg: null
	};

const natureEffects = {
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

const natureNames = [
	'Hardy',
	'Lonely',
	'Adamant',
	'Naughty',
	'Brave',
	'Bold',
	'Docile',
	'Relaxed',
	'Impish',
	'Lax',
	'Timid',
	'Hasty',
	'Serious',
	'Jolly',
	'Mild',
	'Modest',
	'Naive',
	'Quiet',
	'Quirky',
	'Rash',
	'Sassy',
	'Calm',
	'Careful',
	'Gentle'
];

const statAffectors = {
	level: 50,
	nature: 'hardy',
	evs: {},
	ivs: {}
};

pokemonStats.forEach((stat) => {
	statAffectors.evs[stat.apiName] = 0;
	statAffectors.ivs[stat.apiName] = 31;
});

const getNatureMultiplier = (statName) => {
	const nature = natureEffects[statAffectors.nature] || {};
	if (nature.increase === statName) return 1.1;
	if (nature.decrease === statName) return 0.9;
	return 1;
};

const getNatureSign = (statName) => {
	const nature = natureEffects[statAffectors.nature] || {};
	if (nature.increase === statName) return '+';
	if (nature.decrease === statName) return '-';
	return '';
};

const calculateFinalStat = (base, iv, ev, level, statName) => {
	const adjustedEv = Math.floor(ev / 4);
	if (statName === 'hp') {
		return Math.floor(((2 * base + iv + adjustedEv) * level) / 100) + level + 10;
	}
	const intermediate = Math.floor(((2 * base + iv + adjustedEv) * level) / 100) + 5;
	return Math.floor(intermediate * getNatureMultiplier(statName));
};

const setupStatAffectorUI = () => {
	const natureSelect = document.getElementById('nature-select');
	const levelInput = document.getElementById('level-input');
	const affectorStatContainer = document.getElementById('affector-stat-container');

	affectorElements.natureSelect = natureSelect;
	affectorElements.levelInput = levelInput;

	if (!isAffectorUIBuilt) {
		natureSelect.innerHTML = '';
		natureNames.forEach((name) => {
			const option = document.createElement('option');
			option.value = name.toLowerCase();
			option.textContent = name;
			if (name.toLowerCase() === statAffectors.nature) option.selected = true;
			natureSelect.appendChild(option);
		});

		levelInput.value = statAffectors.level;
		levelInput.addEventListener('input', () => {
			const value = parseInt(levelInput.value, 10);
			statAffectors.level = Number.isNaN(value) ? 50 : Math.min(100, Math.max(1, value));
			levelInput.value = statAffectors.level;
			updateFinalStats();
		});

		affectorStatContainer.innerHTML = '';
		pokemonStats.forEach((stat) => {
			const row = document.createElement('div');
			row.classList.add('affector-stat-row');

			const label = document.createElement('span');
			label.classList.add('affector-label');
			label.textContent = stat.name;
			row.appendChild(label);

			const evGroup = document.createElement('div');
			evGroup.classList.add('range-group');
			const evRange = document.createElement('input');
			evRange.type = 'range';
			evRange.id = `ev-${stat.apiName}`;
			evRange.min = '0';
			evRange.max = '252';
			evRange.step = '4';
			evRange.value = statAffectors.evs[stat.apiName];
			const evValue = document.createElement('span');
			evValue.classList.add('slider-value');
			evValue.textContent = `EV ${evRange.value}`;
			evRange.addEventListener('input', () => {
				statAffectors.evs[stat.apiName] = parseInt(evRange.value, 10);
				evValue.textContent = `EV ${evRange.value}`;
				updateFinalStats();
			});
			evGroup.appendChild(evRange);
			evGroup.appendChild(evValue);
			row.appendChild(evGroup);

			const ivGroup = document.createElement('div');
			ivGroup.classList.add('range-group');
			ivGroup.style.display = 'grid';
			ivGroup.style.gridTemplateColumns = '1fr auto';
			ivGroup.style.alignItems = 'center';
			const ivInput = document.createElement('input');
			ivInput.type = 'number';
			ivInput.id = `iv-${stat.apiName}`;
			ivInput.min = '0';
			ivInput.max = '31';
			ivInput.value = statAffectors.ivs[stat.apiName];
			ivInput.style.width = '68px';
			const ivLabel = document.createElement('span');
			ivLabel.classList.add('slider-value');
			ivLabel.textContent = 'IV';
			ivInput.addEventListener('input', () => {
				let value = parseInt(ivInput.value, 10);
				if (Number.isNaN(value)) value = 0;
				value = Math.min(31, Math.max(0, value));
				ivInput.value = value;
				statAffectors.ivs[stat.apiName] = value;
				updateFinalStats();
			});
			ivGroup.appendChild(ivInput);
			ivGroup.appendChild(ivLabel);
			row.appendChild(ivGroup);

			const finalValue = document.createElement('input');
			finalValue.type = 'text';
			finalValue.id = `final-affector-value-${stat.apiName}`;
			finalValue.classList.add('stat-final-value');
			finalValue.value = '0';
			finalValue.readOnly = true;
			row.appendChild(finalValue);

			affectorStatContainer.appendChild(row);
			affectorElements.rows[stat.apiName] = {
				evRange,
				evValue,
				ivInput,
				finalValue
			};
		});

		natureSelect.addEventListener('change', () => {
			statAffectors.nature = natureSelect.value;
			updateFinalStats();
		});

		isAffectorUIBuilt = true;
	} else {
		levelInput.value = statAffectors.level;
		natureSelect.value = statAffectors.nature;
		pokemonStats.forEach((stat) => {
			const elements = affectorElements.rows[stat.apiName];
			if (elements) {
				elements.evRange.value = statAffectors.evs[stat.apiName];
				elements.evValue.textContent = `EV ${elements.evRange.value}`;
				elements.ivInput.value = statAffectors.ivs[stat.apiName];
			}
		});
	}

	updateFinalStats();
	closeStatAffectorDropdown();
};

const updateFinalStats = () => {
		const levelInput = affectorElements.levelInput || document.getElementById('level-input');
		statAffectors.level = parseInt(levelInput?.value || statAffectors.level, 10) || statAffectors.level;
		pokemonStats.forEach((stat) => {
			const cached = statElements[stat.apiName] || {};
			const baseValue = parseInt(cached.valueInput?.value || 0, 10);
			const evValue = statAffectors.evs[stat.apiName] ?? 0;
			const ivValue = statAffectors.ivs[stat.apiName] ?? 31;
			const finalValue = calculateFinalStat(baseValue, ivValue, evValue, statAffectors.level, stat.apiName);

			const baseBar = cached.baseBar;
			const finalDropdownOutput = affectorElements.rows[stat.apiName]?.finalValue;
			const extensionBar = cached.extensionBar;
			const labelSign = cached.natureSign;

			const baseFill = Math.min(100, Math.max(0, (baseValue / 255) * 100));
			if (baseBar) baseBar.style.width = `${baseFill}%`;
			if (finalDropdownOutput) finalDropdownOutput.value = finalValue;
			if (labelSign) {
				const sign = getNatureSign(stat.apiName);
				labelSign.textContent = sign;
				labelSign.classList.toggle('positive', sign === '+');
				labelSign.classList.toggle('negative', sign === '-');
			}

			if (extensionBar) {
				const basePercent = Math.min(100, Math.max(0, (baseValue / 255) * 100));
				const finalPercent = Math.min(100, Math.max(0, (finalValue / 255) * 100));
				const deltaPercent = finalPercent - basePercent;
				if (deltaPercent >= 0) {
					extensionBar.style.left = `${basePercent}%`;
					extensionBar.style.width = `${deltaPercent}%`;
					extensionBar.style.backgroundColor = 'rgba(34, 197, 94, 0.22)';
				} else {
					extensionBar.style.left = `${finalPercent}%`;
					extensionBar.style.width = `${Math.abs(deltaPercent)}%`;
					extensionBar.style.backgroundColor = 'rgba(248, 113, 113, 0.22)';
				}
			}
		});

	const hexagonContainer = document.getElementById('stats-hexagon-container');
	if (hexagonContainer && !hexagonContainer.classList.contains('hidden')) {
		updateStatHexagon();
	}
};

const buildStatHexagon = () => {
	const hexagonContainer = document.getElementById('stats-hexagon-container');
	if (!hexagonContainer) return;
	hexagonContainer.innerHTML = '';

	const width = 500;
	const height = 500;
	const centerX = width / 2;
	const centerY = height / 2;
	const radius = 140;

	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
	svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

	const angles = Array.from({length: 6}, (_, i) => -Math.PI / 2 + i * Math.PI / 3);
	const statNames = pokemonStats.map(stat => stat.name);

	const maxPoints = angles.map((angle) => {
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		return [x, y];
	});

	const maxPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
	const maxPoints2D = maxPoints.map((p) => p.join(',')).join(' ');
	maxPolygon.setAttribute('points', maxPoints2D);
	maxPolygon.setAttribute('fill', 'none');
	maxPolygon.setAttribute('stroke', 'var(--border-primary)');
	maxPolygon.setAttribute('stroke-width', '1');
	maxPolygon.setAttribute('opacity', '0.3');
	svg.appendChild(maxPolygon);

	angles.forEach((angle) => {
		const x = centerX + radius * Math.cos(angle);
		const y = centerY + radius * Math.sin(angle);
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', centerX);
		line.setAttribute('y1', centerY);
		line.setAttribute('x2', x);
		line.setAttribute('y2', y);
		line.setAttribute('class', 'stat-hexagon-axes');
		svg.appendChild(line);
	});

	const currentPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
	currentPolygon.setAttribute('class', 'stat-hexagon-polygon');
	svg.appendChild(currentPolygon);

	hexagonCache.valueNodes = [];

	angles.forEach((angle, i) => {
		const labelDistance = radius + 30;
		const labelX = centerX + labelDistance * Math.cos(angle);
		const labelY = centerY + labelDistance * Math.sin(angle);

		const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		label.setAttribute('x', labelX);
		label.setAttribute('y', labelY);
		label.setAttribute('class', 'stat-hexagon-label');
		label.textContent = statNames[i];
		svg.appendChild(label);

		const value = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		value.setAttribute('class', 'stat-hexagon-value');
		hexagonCache.valueNodes.push(value);
		svg.appendChild(value);
	});

	hexagonCache.built = true;
	hexagonCache.currentPolygon = currentPolygon;
	hexagonCache.svg = svg;
	hexagonContainer.appendChild(svg);
	updateStatHexagon();
};

const updateStatHexagon = () => {
	if (!hexagonCache.built) {
		buildStatHexagon();
		return;
	}

	const width = 500;
	const height = 500;
	const centerX = width / 2;
	const centerY = height / 2;
	const radius = 140;
	const angles = Array.from({length: 6}, (_, i) => -Math.PI / 2 + i * Math.PI / 3);

	const statValues = pokemonStats.map((stat) => {
		const baseValue = parseInt(statElements[stat.apiName]?.valueInput?.value || 0, 10);
		const evValue = statAffectors.evs[stat.apiName] ?? 0;
		const ivValue = statAffectors.ivs[stat.apiName] ?? 31;
		return calculateFinalStat(baseValue, ivValue, evValue, statAffectors.level, stat.apiName);
	});

	const maxStat = 200;
	const normalizedValues = statValues.map((v) => Math.min(v / maxStat, 1));

	const currentPoints = angles.map((angle, i) => {
		const scaledRadius = radius * normalizedValues[i];
		const x = centerX + scaledRadius * Math.cos(angle);
		const y = centerY + scaledRadius * Math.sin(angle);
		return [x, y];
	});

	const points2D = currentPoints.map((p) => p.join(',')).join(' ');
	hexagonCache.currentPolygon.setAttribute('points', points2D);

	hexagonCache.valueNodes.forEach((valueNode, index) => {
		const angle = angles[index];
		const scaledRadius = radius * normalizedValues[index];
		const valueDistance = scaledRadius + 22;
		const x = centerX + valueDistance * Math.cos(angle);
		const y = centerY + valueDistance * Math.sin(angle);
		valueNode.setAttribute('x', x);
		valueNode.setAttribute('y', y);
		valueNode.textContent = statValues[index];
	});
};

const toggleStatsView = () => {
	const statContainer = document.getElementById('stat-container');
	const hexagonContainer = document.getElementById('stats-hexagon-container');
	const toggle = document.getElementById('stats-view-toggle');

	const isBarView = !statContainer.classList.contains('hidden');

	if (isBarView) {
		statContainer.classList.add('hidden');
		hexagonContainer.classList.remove('hidden');
		updateStatHexagon();
		toggle.textContent = '📊︎';
	} else {
		statContainer.classList.remove('hidden');
		hexagonContainer.classList.add('hidden');
		toggle.textContent = '📊︎';
	}
};

const toggleStatAffectorDropdown = () => {
	const dropdown = document.getElementById('stat-affector-dropdown');
	dropdown?.classList.toggle('hidden');
};

const closeStatAffectorDropdown = () => {
	const dropdown = document.getElementById('stat-affector-dropdown');
	dropdown?.classList.add('hidden');
};

const resetStatAffectors = () => {
	statAffectors.level = 50;
	statAffectors.nature = 'hardy';
	pokemonStats.forEach((stat) => {
		statAffectors.evs[stat.apiName] = 0;
		statAffectors.ivs[stat.apiName] = 31;
	});
	setupStatAffectorUI();
};

const loadPokemonSearchIndex = async () => {
		const cachedIndex = pokemonDataCache.get(SEARCH_INDEX_CACHE_KEY);
		if (Array.isArray(cachedIndex) && cachedIndex.length > 0) {
			pokemonSearchIndex.push(...cachedIndex);
			return;
		}

		try {
			const response = await fetch(`${POKEAPI_BASE_URL}pokemon-species?limit=100000`);
			const data = await response.json();
			if (Array.isArray(data.results)) {
				pokemonSearchIndex.push(...data.results);
				pokemonDataCache.set(SEARCH_INDEX_CACHE_KEY, pokemonSearchIndex);
			}
		} catch (error) {
			console.error("Could not load PokÃ©mon search index:", error);
		}
	};

	const hideSearchSuggestions = () => {
		activeSuggestionIndex = -1;
		if (suggestionsContainer) {
			suggestionsContainer.classList.add("hidden");
			suggestionsContainer.innerHTML = "";
		}
	};

	const setActiveSuggestion = (index) => {
		if (!suggestionsContainer) return;
		const items = suggestionsContainer.querySelectorAll(".search-suggestion-item");
		if (!items.length) return;

		activeSuggestionIndex = Math.max(-1, Math.min(index, items.length - 1));
		items.forEach((item, idx) => {
			item.classList.toggle("active", idx === activeSuggestionIndex);
		});

		if (activeSuggestionIndex >= 0) {
			const activeItem = items[activeSuggestionIndex];
			activeItem.scrollIntoView({
				block: "nearest"
			});
		}
	};

	const getPokemonSpriteUrl = (pokemonUrl) => {
		if (!pokemonUrl) return "";
		const match = pokemonUrl.match(/\/(\d+)\/$/);
		if (!match) return "";
		return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${match[1]}.png`;
	};

	const createSuggestionItem = (pokemon, index) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "search-suggestion-item";
		button.dataset.index = index;

		const sprite = document.createElement("img");
		sprite.src = getPokemonSpriteUrl(pokemon.url);
		sprite.alt = pokemon.name;
		sprite.loading = "lazy";

		const label = document.createElement("span");
		label.className = "suggestion-label";
		label.textContent = formatPokemonNameWithCapitalization(pokemon.name);

		button.append(sprite, label);

		button.addEventListener("click", () => {
			searchInput.value = pokemon.name;
			hideSearchSuggestions();
			selectPokemon(pokemon.name);
		});

		return button;
	};

	const showSearchSuggestions = (query) => {
		if (!query || !pokemonSearchIndex.length || !suggestionsContainer) {
			hideSearchSuggestions();
			return;
		}

		const normalized = query.trim().toLowerCase();
		if (!normalized) {
			hideSearchSuggestions();
			return;
		}

		const matches = pokemonSearchIndex.filter((pokemon) => pokemon.name.includes(normalized));
		if (!matches.length) {
			hideSearchSuggestions();
			return;
		}

		const visibleMatches = matches.slice(0, 20);
		const fragment = document.createDocumentFragment();
		visibleMatches.forEach((pokemon, index) => {
			fragment.appendChild(createSuggestionItem(pokemon, index));
		});
		suggestionsContainer.innerHTML = "";
		suggestionsContainer.appendChild(fragment);
		suggestionsContainer.classList.remove("hidden");
		activeSuggestionIndex = -1;
	};

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

	const debouncedPokemonSearch = debounce((speciesName) => {
		selectPokemon(speciesName);
	}, 300);

	const displaySearchError = (message) => {
		const errorContainer = document.getElementById("search-error-container");
		if (errorContainer) {
			errorContainer.innerHTML = `<div style="color: #f44336; font-size: 0.9rem; margin-top: 5px; padding: 5px; background-color: rgba(244, 67, 54, 0.1); border-radius: 4px;">${message}</div>`;
		}
	};

	const clearSearchError = () => {
		const errorContainer = document.getElementById("search-error-container");
		if (errorContainer) {
			errorContainer.innerHTML = "";
		}
	};

	const formatPokemonName = (name) => name.replace(/-/g, " ");
	const capitalizeFirstLetter = (text) => text.charAt(0).toUpperCase() + text.slice(1);
	const formatPokemonNameWithCapitalization = (name) => {
		return formatPokemonName(name).replace(/\b\w/g, (letter) => letter.toUpperCase());
	};

	const formatFlavorText = (text) => {
		if (!text) return "";

		return text
			.replace(/\n\f/g, "\f")
			.replace(/\f/g, "\n")
			.replace(/\u00ad\n/g, "")
			.replace(/\u00ad/g, "")
			.replace(/ -\n/g, " - ")
			.replace(/-\n/g, "-")
			.replace(/\n/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	};


	const init = async () => {
		applySavedTheme();
		setupStatBars();
		cacheStatElements();
		setupStatAffectorUI();
		populateTypeDropdowns();
		await loadPokemonSearchIndex();
		setupEventListeners();
	};

	const setupEventListeners = () => {
		searchInput.addEventListener("keydown", (e) => {
			if (!suggestionsContainer.classList.contains("hidden")) {
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

			if (e.key === "Enter") {
				debouncedPokemonSearch(searchInput.value.toLowerCase());
			}
		});

		searchInput.addEventListener("input", async () => {
			clearSearchError();
			if (!pokemonSearchIndex.length) await loadPokemonSearchIndex();
			showSearchSuggestions(searchInput.value.toLowerCase());
		});

		searchInput.addEventListener("focus", async () => {
			if (searchInput.value.trim()) {
				if (!pokemonSearchIndex.length) await loadPokemonSearchIndex();
				showSearchSuggestions(searchInput.value.toLowerCase());
			}
		});

		if (themeToggleBtn) {
			themeToggleBtn.addEventListener('click', toggleTheme);
		}

		if (infoButton) {
			infoButton.addEventListener("click", () => {
				infoPopup.classList.toggle("hidden");
			});
		}

		const statAffectorToggle = document.getElementById('stat-affector-toggle');
		const statAffectorClose = document.getElementById('stat-affector-close');

		if (statAffectorToggle) {
			statAffectorToggle.addEventListener('click', toggleStatAffectorDropdown);
		}

		if (statAffectorClose) {
			statAffectorClose.addEventListener('click', closeStatAffectorDropdown);
		}

		if (popupCloseButton) {
			popupCloseButton.addEventListener("click", () => {
				infoPopup.classList.add("hidden");
			});
		}

		window.addEventListener("click", (event) => {
			if (infoPopup && !infoPopup.classList.contains("hidden") &&
				!infoPopup.contains(event.target) &&
				event.target !== infoButton) {
				infoPopup.classList.add("hidden");
			}

			if (suggestionsContainer && !suggestionsContainer.classList.contains("hidden") &&
				!suggestionsContainer.contains(event.target) &&
				event.target !== searchInput) {
				hideSearchSuggestions();
			}

			const statAffectorDropdown = document.getElementById('stat-affector-dropdown');
			const statAffectorToggle = document.getElementById('stat-affector-toggle');
			if (statAffectorDropdown && !statAffectorDropdown.classList.contains('hidden') &&
				!statAffectorDropdown.contains(event.target) &&
				event.target !== statAffectorToggle) {
				statAffectorDropdown.classList.add('hidden');
			}
		});

		const searchButton = document.getElementById("search-button");
		if (searchButton) {
			searchButton.addEventListener("click", () => {
				debouncedPokemonSearch(searchInput.value.toLowerCase());
			});
		}

		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey || e.metaKey) {
				switch (e.key) {
					case '/':
						e.preventDefault();
						searchInput.focus();
						break;
					case 's':
						e.preventDefault();
						toggleShiny();
						break;
					case 'b':
						e.preventDefault();
						updateStatsFromAPI();
						break;
					case 'p':
						e.preventDefault();
						updatePortraitAndForms();
						break;
					case 'l':
						e.preventDefault();
						toggleTheme();
						break;
				}
			}
		});

		shinyToggleBtn.addEventListener("click", toggleShiny);
		portraitUpload.addEventListener("change", handleImageUpload);
		genderSlider.addEventListener("input", updateGenderRatioDisplay);

		primaryTypeSelector.addEventListener("change", (e) => {
			updateTypeDisplay(e.target.value, 1);
		});
		secondaryTypeSelector.addEventListener("change", (e) => {
			updateTypeDisplay(e.target.value, 2);
		});

		pokemonColor.addEventListener("input", updateColorDisplay);
		flavorText.addEventListener("input", autoResizeFlavorText);

		const statsViewToggle = document.getElementById('stats-view-toggle');
		if (statsViewToggle) {
			statsViewToggle.addEventListener('click', toggleStatsView);
		}

		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				if (hexagonCache.built && !document.getElementById('stats-hexagon-container').classList.contains('hidden')) {
					buildStatHexagon();
				}
			}, 200);
		});
	};


	const selectPokemon = async (speciesName) => {
		searchInput.value = speciesName;

		clearSearchError();

		try {
			let speciesData = pokemonDataCache.get(`species_${speciesName}`);
			if (!speciesData) {
				const speciesResponse = await fetch(
					`${POKEAPI_BASE_URL}pokemon-species/${speciesName}`,
				);
				if (!speciesResponse.ok) {
					throw new Error(`PokÃ©mon "${speciesName}" not found.`);
				}
				speciesData = await speciesResponse.json();
				pokemonDataCache.set(`species_${speciesName}`, speciesData);
			}
			setPokemonState('speciesData', speciesData);
			setPokemonState('varieties', speciesData.varieties);

			// always fetches the base variety, form button changes variety
			const defaultVariety = getPokemonState('varieties').find((v) => v.is_default);
			if (defaultVariety) {
				fetchAndDisplayPokemon(defaultVariety.pokemon.url);
			} else {
				console.error("No default variety found for this PokÃ©mon species");
			}

			// check cache for evo-chain, more instances
			let evoChainData = pokemonDataCache.get(`evo_chain_${getPokemonState('speciesData').evolution_chain.url}`);
			if (!evoChainData) {
				const evoChainResponse = await fetch(
					getPokemonState('speciesData').evolution_chain.url,
				);
				evoChainData = await evoChainResponse.json();
				pokemonDataCache.set(`evo_chain_${getPokemonState('speciesData').evolution_chain.url}`, evoChainData);
			}
			setPokemonState('evolutionChain', evoChainData);
			updateEvolutionChain();
			updateExtraInfo();
		} catch (error) {
			console.error(`Error fetching ${speciesName}:`, error);
			displaySearchError(`Could not find PokÃ©mon: ${speciesName}. Please check the spelling.`);
			resetUI();
		}
	};

	const fetchAndDisplayPokemon = async (pokemonUrl) => {
		try {
			let pokemonData = pokemonDataCache.get(`pokemon_${pokemonUrl}`);
			if (!pokemonData) {
				const response = await fetch(pokemonUrl);
				pokemonData = await response.json();
				pokemonDataCache.set(`pokemon_${pokemonUrl}`, pokemonData);
			}
			setPokemonState('pokemonData', pokemonData);
			setPokemonState('isShiny', false);

			primaryTypeSelector.value = "";
			secondaryTypeSelector.value = "none";
			updateTypeDisplay("", 1);
			updateTypeDisplay("none", 2);

			updateAllUI();
		} catch (error) {
			console.error("Error fetching PokÃ©mon data:", error);
		}
	};

	const updateAllUI = () => {
		pokemonName.value = formatPokemonName(getPokemonState('pokemonData').name);
		updateStatsFromAPI();
		updateTypes();
		updateAbilities();
		updatePortraitAndForms();
		updateExtraInfo();
		updateFlavorText();
	};

	const updatePortraitAndForms = () => {
		pokemonFormSelector.innerHTML = "";
		const artwork = getPokemonState('pokemonData').sprites.other["official-artwork"];
		const portraitSrc = artwork?.front_default || getPokemonState('pokemonData').sprites.front_default || "";
		setImageWithFallback(portrait, portraitSrc);
		shinyToggleBtn.style.display = artwork?.front_shiny ? "block" : "none";

		const baseForm = getPokemonState('varieties').find((v) => v.is_default);
		const otherForms = getPokemonState('varieties').filter((v) => !v.is_default);
		const allForms = [baseForm, ...otherForms].filter(Boolean);

		if (allForms.length > 1) {
			const formSelect = document.createElement("select");
			formSelect.addEventListener("change", (e) =>
				fetchAndDisplayPokemon(e.target.value),
			);

			allForms.forEach((form) => {
				const option = document.createElement("option");
				option.value = form.pokemon.url;
				let prettyName = formatPokemonName(form.pokemon.name
						.replace(getPokemonState('speciesData').name, ""))
					.trim();
				option.textContent =
					prettyName === "" ?
					"Base" :
					formatPokemonNameWithCapitalization(prettyName);

				if (form.pokemon.name === getPokemonState('pokemonData').name) {
					option.selected = true;
				}
				formSelect.appendChild(option);
			});
			pokemonFormSelector.appendChild(formSelect);
		}
	};

	const toggleShiny = () => {
		if (!getPokemonState('pokemonData')) return;
		const artwork = getPokemonState('pokemonData').sprites.other["official-artwork"];
		if (!artwork || !artwork.front_shiny) return;
		setPokemonState('isShiny', !getPokemonState('isShiny'));
		const portraitSrc = getPokemonState('isShiny') ? artwork.front_shiny : artwork.front_default;
		setImageWithFallback(portrait, portraitSrc);
	};

	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setImageWithFallback(portrait, e.target.result);
				shinyToggleBtn.style.display = "none";
			};
			reader.readAsDataURL(file);
		}
	};

	const updateStatsFromAPI = () => {
		getPokemonState('pokemonData').stats.forEach((s) => {
			const value = s.base_stat;
			const valueInput = document.getElementById(`stat-value-${s.stat.name}`);
			const slider = document.getElementById(`stat-slider-${s.stat.name}`);
			if (valueInput && slider) {
				valueInput.value = value;
				slider.value = value;
				updateStatDisplay(slider, valueInput, value);
			}
		});
		updateBST();
		updateFinalStats();
	};

const populateTypeDropdowns = () => {
	[primaryTypeSelector, secondaryTypeSelector].forEach(selectElement => {
		const initialOptionValue = selectElement.id === 'type1-select' ? '' : 'none';
		while (selectElement.children.length > 1 || (selectElement.children.length === 1 && selectElement.children[0].value !== initialOptionValue)) {
			selectElement.removeChild(selectElement.lastChild);
		}

		availablePokemonTypes.forEach(type => {
			const option = document.createElement('option');
			option.value = type.value;
			option.textContent = type.name;
			selectElement.appendChild(option);
		});
	});
};

	const updateTypes = () => {
		const types = getPokemonState('pokemonData').types;

		typeContainer.classList.remove("single-type");
		primaryTypeDisplay.classList.remove("hidden"); // in case type-box-1 is hidden by mistake
		secondaryTypeDisplay.classList.remove("hidden");

		if (types[0]) {
			primaryTypeSelector.value = types[0].type.name;
			updateTypeDisplay(types[0].type.name, 1);
		} else {
			// in case any future PokeAPI updates uploads a pokemon with no type(s)
			updateTypeDisplay("", 1);
		}

		if (types[1]) {
			// in case second type detected, go back to normal
			secondaryTypeSelector.value = types[1].type.name;
			updateTypeDisplay(types[1].type.name, 2);
		} else {
			// in case no second type
			updateTypeDisplay("none", 2);
			secondaryTypeDisplay.classList.add("hidden");
			typeContainer.classList.add("single-type");
		}
	};

	const updateTypeDisplay = (selectedType, typeNumber) => {
		const targetTypeBox = typeNumber === 1 ? primaryTypeDisplay : secondaryTypeDisplay;
		targetTypeBox.className = "type-box";

		if (selectedType === "none" || selectedType === "") {
			targetTypeBox.classList.add("type-none");
		} else {
			targetTypeBox.classList.add(`type-${selectedType}`);
		}
	};

	const setupStatBars = () => {
		const statContainer = document.getElementById("stat-container");
		statContainer.innerHTML = "";

		statBarDisplayOrder.forEach((stat) => {
			const statBarDiv = document.createElement("div");
			statBarDiv.classList.add("stat-bar");

			const label = document.createElement("span");
			label.classList.add("stat-label");
			label.textContent = stat.name;

			const natureSign = document.createElement("span");
			natureSign.classList.add("stat-nature-sign");
			natureSign.id = `nature-sign-${stat.apiName}`;
			label.appendChild(natureSign);
			statBarDiv.appendChild(label);

			const valueInput = document.createElement("input");
			valueInput.type = "number";
			valueInput.classList.add("stat-value");
			valueInput.id = `stat-value-${stat.apiName}`;
			valueInput.min = "0";
			valueInput.max = "255";
			valueInput.value = "0";
			valueInput.addEventListener("input", (e) => {
				const newValue = parseInt(e.target.value, 10);
				const slider = document.getElementById(`stat-slider-${stat.apiName}`);
				if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
					slider.value = newValue;
					updateStatDisplay(slider, valueInput, newValue);
				} else if (e.target.value === "") {
					slider.value = 0;
					updateStatDisplay(slider, valueInput, 0);
				}
				updateBST();
				updateFinalStats();
			});
			statBarDiv.appendChild(valueInput);

			const sliderWrapper = document.createElement("div");
			sliderWrapper.classList.add("slider-wrapper");

			const baseBar = document.createElement("div");
			baseBar.classList.add("stat-base-bar");
			baseBar.id = `stat-base-${stat.apiName}`;
			sliderWrapper.appendChild(baseBar);

			const extensionBar = document.createElement("div");
			extensionBar.classList.add("stat-extension-bar");
			extensionBar.id = `stat-extension-${stat.apiName}`;
			sliderWrapper.appendChild(extensionBar);

			const slider = document.createElement("input");
			slider.type = "range";
			slider.classList.add("base-stat-slider");
			slider.id = `stat-slider-${stat.apiName}`;
			slider.min = "0";
			slider.max = "255";
			slider.value = "0";
			slider.addEventListener("input", (e) => {
				const newValue = parseInt(e.target.value, 10);
				valueInput.value = newValue;
				updateStatDisplay(slider, valueInput, newValue);
				updateBST();
				updateFinalStats();
			});
			sliderWrapper.appendChild(slider);
			statBarDiv.appendChild(sliderWrapper);
			statContainer.appendChild(statBarDiv);
			updateStatDisplay(slider, valueInput, 0);
		});

		const bstRow = document.createElement("div");
		bstRow.classList.add("stat-bar");
		bstRow.innerHTML = `
        <span class="stat-label">BST</span>
        <input type="text" id="bst-value" class="stat-value" value="0" readonly />
        <div class="empty-slider-space"></div>
    `;
		statContainer.appendChild(bstRow);
	};

	const cacheStatElements = () => {
		pokemonStats.forEach((stat) => {
			statElements[stat.apiName] = {
				valueInput: document.getElementById(`stat-value-${stat.apiName}`),
				slider: document.getElementById(`stat-slider-${stat.apiName}`),
				baseBar: document.getElementById(`stat-base-${stat.apiName}`),
				extensionBar: document.getElementById(`stat-extension-${stat.apiName}`),
				natureSign: document.getElementById(`nature-sign-${stat.apiName}`)
			};
		});
	};

	const updateStatDisplay = (slider, valueInput, value) => {
		const fillPercent = (value / 255) * 100;
		slider.style.setProperty("--fill-percent", `${fillPercent}%`);

		slider.classList.remove(
			"barchart-rank-1",
			"barchart-rank-2",
			"barchart-rank-3",
			"barchart-rank-4",
			"barchart-rank-5",
			"barchart-rank-6"
		);

		let rankClass = "";
		let rankColor = "#34d399";
		if (value <= 29) {
			rankClass = "barchart-rank-1";
			rankColor = "#f34444";
		} else if (value <= 59) {
			rankClass = "barchart-rank-2";
			rankColor = "#ff7f0f";
		} else if (value <= 89) {
			rankClass = "barchart-rank-3";
			rankColor = "#ffdd57";
		} else if (value <= 119) {
			rankClass = "barchart-rank-4";
			rankColor = "#a0e515";
		} else if (value <= 149) {
			rankClass = "barchart-rank-5";
			rankColor = "#23cd5e";
		} else {
			rankClass = "barchart-rank-6";
			rankColor = "#00c2b8";
		}

		slider.classList.add(rankClass);
		slider.style.setProperty("--bar-color", rankColor);
	};


	const updateBST = () => {
		let totalStats = 0;
		pokemonStats.forEach((stat) => {
			const valueInput = document.getElementById(`stat-value-${stat.apiName}`);
			totalStats += parseInt(valueInput.value || 0);
		});
		document.getElementById("bst-value").value = totalStats;
	};

	const updateAbilities = () => {
		ability1.value = "N/A";
		ability2.value = "N/A";
		hiddenAbility.value = "N/A";

		getPokemonState('pokemonData').abilities.forEach((ability) => {
			if (ability.is_hidden) {
				hiddenAbility.value = formatPokemonName(ability.ability.name);
			} else if (ability.slot === 1) {
				ability1.value = formatPokemonName(ability.ability.name);
			} else if (ability.slot === 2) {
				ability2.value = formatPokemonName(ability.ability.name);
			}
		});
	};

	const isLinearEvolutionChain = (tree) => {
		// A chain is linear if it has no branches at any level
		if (!tree) return true;
		if (tree.children.length > 1) return false; // Multiple children = branched
		if (tree.children.length === 1) {
			return isLinearEvolutionChain(tree.children[0]);
		}
		return true; // No children = linear (end of chain)
	};

	const updateEvolutionChain = () => {
		const evolutionContainer = document.getElementById("evolution-container");
		evolutionContainer.innerHTML = "";

		if (!getPokemonState('evolutionChain') || !getPokemonState('evolutionChain').chain) {
			return;
		}

		const evolutionTree = parseEvolutionChain(getPokemonState('evolutionChain').chain);

		const flowContainer = document.createElement('div');
		const isLinear = isLinearEvolutionChain(evolutionTree);
		flowContainer.className = isLinear ? 'evolution-flow linear' : 'evolution-flow branched';

		renderEvolutionTree(evolutionTree, flowContainer, isLinear);
		evolutionContainer.appendChild(flowContainer);
	};

	const parseEvolutionChain = (chainLink) => {
		const node = {
			name: chainLink.species.name,
			url: chainLink.species.url,
			evolutionDetails: chainLink.evolution_details || [],
			children: []
		};

		// handle multiple evolution paths
		if (chainLink.evolves_to && chainLink.evolves_to.length > 0) {
			console.log(`Found ${chainLink.evolves_to.length} evolution(s) for ${chainLink.species.name}:`,
				chainLink.evolves_to.map(e => e.species.name));

			for (const evolution of chainLink.evolves_to) {
				node.children.push(parseEvolutionChain(evolution));
			}
		}

		return node;
	};

	const renderEvolutionTree = (tree, container, isLinear = false) => {
		if (!tree) return;

		const stageElement = createEvolutionStage(tree);
		container.appendChild(stageElement);

		if (tree.children && tree.children.length > 0) {
			if (tree.children.length === 1) {
				// single evos
				const child = tree.children[0];

				container.appendChild(createEvolutionArrow(isLinear));

				if (child.evolutionDetails && child.evolutionDetails.length > 0) {
					const condition = createEvolutionCondition(child.evolutionDetails[0]);
					container.appendChild(condition);
					container.appendChild(createEvolutionArrow(isLinear));
				}

				renderEvolutionTree(child, container, isLinear);
			} else {
				// branched evos

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

		fetchPokemonSprite(evolutionData.name, img);

		return stage;
	};

	const createEvolutionArrow = (isLinear = false) => {
		const arrow = document.createElement('div');
		arrow.className = 'evo-arrow';
		arrow.textContent = isLinear ? '\u2192' : '\u2193';
		arrow.classList.add(isLinear ? 'horizontal' : 'vertical');
		return arrow;
	};


	const createEvolutionCondition = (evolutionDetails) => {
		const condition = document.createElement('div');
		condition.className = 'evolution-condition';

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

		condition.textContent = conditionText;
		condition.title = conditionText;
		return condition;
	};

	const fetchPokemonSprite = async (pokemonName, imgElement) => {
		try {
			let data = pokemonDataCache.get(`pokemon_evo_${pokemonName}`);
			if (!data) {
				const response = await fetch(`${POKEAPI_BASE_URL}pokemon/${pokemonName}`);
				data = await response.json();
				pokemonDataCache.set(`pokemon_evo_${pokemonName}`, data);
			}

			const imgSrc = data.sprites.front_default || data.sprites.other["official-artwork"]?.front_default || '#';
			setImageWithFallback(imgElement, imgSrc);
		} catch (error) {
			console.error(`Error fetching evolution sprite for ${pokemonName}:`, error);
			setImageWithFallback(imgElement, '#');
		}
	};


	const autoResizeFlavorText = () => {
		flavorText.style.height = 'auto';
		flavorText.style.height = flavorText.scrollHeight + 'px';
	};

	const getEvolutionDetails = (chain, targetSpeciesName) => {
		if (!chain) return null;

		if (chain.species.name === targetSpeciesName) {
			// if first in the chain and has no evolution_details, it's the base evo
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


	const displayEvolutionItemSprite = async (itemUrl) => {
		const evolutionConditionItem = document.getElementById("evolution-condition");
		const evoConditionParent = evolutionConditionItem.closest('.info-item');
		let existingSprite = evoConditionParent ? evoConditionParent.querySelector(".evo-item-sprite") : null;

		if (!existingSprite) {
			existingSprite = document.createElement("img");
			existingSprite.classList.add("evo-item-sprite");
			if (evoConditionParent) {
				evoConditionParent.appendChild(existingSprite);
			}
		}

		if (!itemUrl) {
			existingSprite.style.display = 'none';
			existingSprite.src = "";
			existingSprite.alt = "";
			existingSprite.title = "";
			return;
		}

		let itemData = pokemonDataCache.get(`item_${itemUrl}`);
		if (!itemData) {
			try {
				const response = await fetch(itemUrl);
				if (!response.ok) throw new Error("Item not found");
				itemData = await response.json();
				pokemonDataCache.set(`item_${itemUrl}`, itemData);
			} catch (error) {
				console.error("Error fetching item sprite:", error);
				existingSprite.style.display = 'none';
				existingSprite.src = "";
				existingSprite.alt = "";
				existingSprite.title = "";
				return;
			}
		}

		existingSprite.src = itemData.sprites.default;
		existingSprite.alt = itemData.name;
		existingSprite.title = formatPokemonName(itemData.name);
		existingSprite.style.display = 'block'; // show if itemUrl is valid
	};


	const updateExtraInfo = async () => {
		const speciesData = getPokemonState('speciesData');
		const pokemonData = getPokemonState('pokemonData');
		if (speciesData) {
			nationalDexNumber.value = speciesData.id;
			const genusEntry = speciesData.genera.find(
				(g) => g.language.name === "en",
			);
			pokemonGenus.value = genusEntry ? genusEntry.genus : "???";

			pokemonColor.value = speciesData.color ?
				speciesData.color.name :
				"???";
			updateColorDisplay();

			// gender ratio
			if (speciesData.gender_rate === -1) {
				maleRatio.textContent = "Genderless";
				maleRatio.style.width = "100%";
				femaleRatio.style.width = "0%";
				femaleRatio.textContent = "";
				genderSlider.style.display = "none";
				document.getElementById("gender-ratio-box").classList.add("genderless");
			} else {
				document
					.getElementById("gender-ratio-box")
					.classList.remove("genderless");
				genderSlider.style.display = "block";
				const femalePercentage = (speciesData.gender_rate / 8) * 100;
				const malePercentage = 100 - femalePercentage;
				genderSlider.value = malePercentage;
				updateGenderRatioDisplay();
			}

			// egg groups
			if (speciesData.egg_groups && speciesData.egg_groups.length > 0) {
				eggGroup1.value = formatPokemonName(speciesData.egg_groups[0].name);
				if (speciesData.egg_groups[1]) {
					eggGroup2.value = formatPokemonName(speciesData.egg_groups[1].name);
				} else {
					eggGroup2.value = "N/A";
				}
			} else {
				eggGroup1.value = "N/A";
				eggGroup2.value = "N/A";
			}

			let evoConditionText = "";
			let itemSpriteUrl = null;

			if (getPokemonState('speciesData').evolves_from_species) {
				const preEvoName = formatPokemonName(getPokemonState('speciesData').evolves_from_species.name);
				evoConditionText += capitalizeFirstLetter(preEvoName);

				if (getPokemonState('evolutionChain')) {
					const evolutionDetails = getEvolutionDetails(getPokemonState('evolutionChain').chain, getPokemonState('speciesData').name);

					if (evolutionDetails) {
						let conditionDetails = [];

						if (evolutionDetails.trigger && evolutionDetails.trigger.name === "level-up" && evolutionDetails.min_level) {
							conditionDetails.push(`Lvl ${evolutionDetails.min_level}`);
						} else if (evolutionDetails.trigger && evolutionDetails.trigger.name === "use-item" && evolutionDetails.item) {
							conditionDetails.push(formatPokemonName(evolutionDetails.item.name).replace("stone", "Stone"));
							itemSpriteUrl = evolutionDetails.item.url;
						} else if (evolutionDetails.held_item) {
							conditionDetails.push(`Holding ${formatPokemonName(evolutionDetails.held_item.name).replace("protector", "Protector").replace("reaper-cloth", "Reaper Cloth")}`);
							itemSpriteUrl = evolutionDetails.held_item.url;
						} else if (evolutionDetails.trigger && evolutionDetails.trigger.name === "trade") {
							conditionDetails.push("Trade");
						} else if (evolutionDetails.min_happiness) {
							conditionDetails.push("High Happiness");
						} else if (evolutionDetails.min_affection) {
							conditionDetails.push("High Affection");
						} else if (evolutionDetails.known_move) {
							conditionDetails.push(`Known Move: ${formatPokemonName(evolutionDetails.known_move.name)}`);
						} else if (evolutionDetails.known_move_type) {
							conditionDetails.push(`Known Move Type: ${evolutionDetails.known_move_type.name}`);
						}
						// future note: add more conditions later, check from PokeAPI evo-chain pages

						if (conditionDetails.length > 0) {
							evoConditionText += `, ${conditionDetails.join(", ")}`;
						}
					}
				}
			} else {
				evoConditionText = "Does not evolve from a prior form";
			}

			// how i would handle mega evolutions for an evo-condition
			// checking if the current pokemon's name implies mega evolution and then infer the item
			// a better solution would involve a separate API call or a pre-defined mapping
			if (getPokemonState('pokemonData') && getPokemonState('pokemonData').name.includes("-mega")) {
				const basePokemonName = getPokemonState('pokemonData').name.replace("-mega", "");
				// const megaStoneName = `${basePokemonName}-mega-stone`; // in case PokeAPI ever adds mega-stones to evo-chains
				const megaStoneApiUrl = `${POKEAPI_BASE_URL}item/${basePokemonName}-megastone`;

				let megaStoneData = pokemonDataCache.get(`item_${megaStoneApiUrl}`);
				if (!megaStoneData) {
					try {
						const megaStoneResponse = await fetch(megaStoneApiUrl);
						if (megaStoneResponse.ok) {
							megaStoneData = await megaStoneResponse.json();
							pokemonDataCache.set(`item_${megaStoneApiUrl}`, megaStoneData);
						} else {
							console.warn(`Mega stone for ${basePokemonName} not found via API. Using generic text.`);
						}
					} catch (error) {
						console.error("Error fetching mega stone data:", error);
					}
				}

				if (megaStoneData) {
					evoConditionText = `${capitalizeFirstLetter(formatPokemonName(basePokemonName))}, Holding ${formatPokemonName(megaStoneData.name)}`;
					itemSpriteUrl = megaStoneData.sprites.default;
				} else {
					evoConditionText = `${capitalizeFirstLetter(formatPokemonName(basePokemonName))}, Holding Mega Stone`;
				}
			}

			evolutionCondition.value = evoConditionText || "N/A";
			displayEvolutionItemSprite(itemSpriteUrl);
		}


		if (pokemonData) {
			pokemonHeight.value = `${(pokemonData.height / 10).toFixed(1)} m`; // decimeters to meters
			pokemonWeight.value = `${(pokemonData.weight / 10).toFixed(1)} kg`; // hectograms to kilograms
		}
	};


	const updateGenderRatioDisplay = () => {
		const malePercent = parseInt(genderSlider.value);
		const femalePercent = 100 - malePercent;

		maleRatio.textContent = malePercent > 0 ? `\u2642 ${malePercent}%` : "";
		femaleRatio.textContent = femalePercent > 0 ? `\u2640 ${femalePercent}%` : "";

		genderRatioBar.style.setProperty("--male-percent", `${malePercent}%`);
	};

	const updateFlavorText = () => {
		if (getPokemonState('speciesData') && getPokemonState('speciesData').flavor_text_entries) {
			const englishFlavorText = getPokemonState('speciesData').flavor_text_entries.find(
				(entry) => entry.language.name === "en",
			);
			flavorText.value = englishFlavorText ?
				formatFlavorText(englishFlavorText.flavor_text) :
				"No flavor text available for this PokÃ©mon";
		} else {
			flavorText.value = "Search for a PokÃ©mon to see its PokÃ©dex entry";
		}
		autoResizeFlavorText();
	};

	const updateColorDisplay = () => {
		const colorValue = pokemonColor.value.toLowerCase();
		const colorMap = {
			red: "#f44336",
			blue: "#2196f3",
			yellow: "#ffeb3b",
			green: "#4caf50",
			black: "#000000",
			brown: "#795548",
			gray: "#9e9e9e",
			white: "#ffffff",
			purple: "#9c27b0",
			pink: "#e91e63",
		};
		if (colorMap[colorValue]) {
			pokemonColor.style.backgroundColor = colorMap[colorValue];
			pokemonColor.style.color =
				colorValue === "black" || colorValue === "blue" || colorValue === "purple" ?
				"white" :
				"black";
		} else {
			pokemonColor.style.backgroundColor = "";
			pokemonColor.style.color = "";
		}
	};

	// reset UI elements when pokemon not found
	const resetUI = () => {
		resetPokemonState();

		pokemonName.value = "";

		setImageWithFallback(document.getElementById("pokemon-portrait"), '#');

		shinyToggleBtn.style.display = "none";
		pokemonFormSelector.innerHTML = "";

		primaryTypeSelector.value = "";
		secondaryTypeSelector.value = "none";
		updateTypeDisplay("", 1);
		updateTypeDisplay("none", 2);

		nationalDexNumber.value = "???";
		pokemonGenus.value = "???";
		pokemonHeight.value = "? m";
		pokemonWeight.value = "? kg";
		genderSlider.value = "50";
		updateGenderRatioDisplay();
		evolutionCondition.value = "???";
		eggGroup1.value = "???";
		eggGroup2.value = "???";
		pokemonColor.value = "???";
		pokemonColor.style.backgroundColor = "";
		pokemonColor.style.color = "";
		evolutionCondition.value = "???";
		displayEvolutionItemSprite(null);

		const evolutionContainer = document.getElementById("evolution-container");
		if (evolutionContainer) {
			evolutionContainer.innerHTML = "";
		}

		flavorText.value = "Search for a PokÃ©mon to see its PokÃ©dex entry";

		ability1.value = "Ability 1";
		ability2.value = "Ability 2";
		hiddenAbility.value = "Hidden Ability";

		pokemonStats.forEach(stat => {
			document.getElementById(`stat-value-${stat.apiName}`).value = "0";
			const slider = document.getElementById(`stat-slider-${stat.apiName}`);
			slider.value = "0";
			updateStatDisplay(slider, document.getElementById(`stat-value-${stat.apiName}`), 0);
		});
		updateBST();
		resetStatAffectors();
		updateFinalStats();
	};

	init();
});
