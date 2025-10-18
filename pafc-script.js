document.addEventListener("DOMContentLoaded", () => {
	const searchInput = document.getElementById("pokemon-search-input");
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
		}
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
			const items = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				try {
					const item = JSON.parse(localStorage.getItem(key));
					items.push({
						key,
						expiry: item.expiry || 0
					});
				} catch {
					localStorage.removeItem(key);
				}
			}

			// remove oldest items 
			items.sort((a, b) => a.expiry - b.expiry);
			const toRemove = Math.ceil(items.length * 0.3); // remove 30%
			items.slice(0, toRemove).forEach(item => localStorage.removeItem(item.key));
		}
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
		populateTypeDropdowns();
		setupEventListeners();
	};

	const setupEventListeners = () => {
		searchInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				debouncedPokemonSearch(searchInput.value.toLowerCase());
			}
		});

		searchInput.addEventListener("input", clearSearchError);

		if (themeToggleBtn) {
			themeToggleBtn.addEventListener('click', toggleTheme);
		}

		if (infoButton) {
			infoButton.addEventListener("click", () => {
				infoPopup.classList.toggle("hidden");
			});
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
					throw new Error(`Pokémon "${speciesName}" not found.`);
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
				console.error("No default variety found for this Pokémon species");
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
			displaySearchError(`Could not find Pokémon: ${speciesName}. Please check the spelling.`);
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
			console.error("Error fetching Pokémon data:", error);
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

		pokemonStats.forEach((stat) => {
			const statBarDiv = document.createElement("div");
			statBarDiv.classList.add("stat-bar");

			const label = document.createElement("span");
			label.classList.add("stat-label");
			label.textContent = stat.name;
			statBarDiv.appendChild(label);

			const valueInput = document.createElement("input");
			valueInput.type = "number";
			valueInput.classList.add("stat-value");
			valueInput.id = `stat-value-${stat.apiName}`;
			valueInput.min = "0";
			valueInput.max = "255";
			valueInput.value = "0";
			valueInput.addEventListener("input", (e) => {
				const newValue = parseInt(e.target.value);
				const slider = document.getElementById(`stat-slider-${stat.apiName}`);
				if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
					slider.value = newValue;
					updateStatDisplay(slider, valueInput, newValue);
				} else if (e.target.value === "") {
					slider.value = 0; // set the value for updateStatDisplay
					updateStatDisplay(slider, valueInput, slider.value); // slider.value could be replaced with 0
				}
				updateBST();
			});
			statBarDiv.appendChild(valueInput);

			const slider = document.createElement("input");
			slider.type = "range";
			slider.id = `stat-slider-${stat.apiName}`;
			slider.min = "0";
			slider.max = "255";
			slider.value = "0";
			slider.addEventListener("input", (e) => {
				const newValue = parseInt(e.target.value);
				valueInput.value = newValue;
				updateStatDisplay(slider, valueInput, newValue);
				updateBST();
			});
			statBarDiv.appendChild(slider);
			statContainer.appendChild(statBarDiv);
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
		if (value <= 29) rankClass = "barchart-rank-1";
		else if (value <= 59) rankClass = "barchart-rank-2";
		else if (value <= 89) rankClass = "barchart-rank-3";
		else if (value <= 119) rankClass = "barchart-rank-4";
		else if (value <= 149) rankClass = "barchart-rank-5";
		else rankClass = "barchart-rank-6";

		slider.classList.add(rankClass);
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

	const updateEvolutionChain = () => {
		const evolutionContainer = document.getElementById("evolution-container");
		evolutionContainer.innerHTML = "";

		if (!getPokemonState('evolutionChain') || !getPokemonState('evolutionChain').chain) {
			return;
		}

		const evolutionTree = parseEvolutionChain(getPokemonState('evolutionChain').chain);

		const flowContainer = document.createElement('div');
		flowContainer.className = 'evolution-flow';

		renderEvolutionTree(evolutionTree, flowContainer);
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

	const renderEvolutionTree = (tree, container) => {
		if (!tree) return;

		const stageElement = createEvolutionStage(tree);
		container.appendChild(stageElement);

		if (tree.children && tree.children.length > 0) {
			if (tree.children.length === 1) {
				// single evos
				const child = tree.children[0];

				container.appendChild(createEvolutionArrow());

				if (child.evolutionDetails && child.evolutionDetails.length > 0) {
					const condition = createEvolutionCondition(child.evolutionDetails[0]);
					container.appendChild(condition);
					container.appendChild(createEvolutionArrow());
				}

				renderEvolutionTree(child, container);
			} else {
				// branched evos

				container.appendChild(createEvolutionArrow());

				const branchContainer = document.createElement('div');
				branchContainer.className = 'branch-container';

				tree.children.forEach(child => {
					const branch = document.createElement('div');
					branch.className = 'evolution-branch';

					if (child.evolutionDetails && child.evolutionDetails.length > 0) {
						const condition = createEvolutionCondition(child.evolutionDetails[0]);
						branch.appendChild(condition);
						branch.appendChild(createEvolutionArrow());
					}

					renderEvolutionTree(child, branch);

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

	const createEvolutionArrow = () => {
		const arrow = document.createElement('div');
		arrow.className = 'evo-arrow';
		arrow.textContent = '↓';
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
		if (getPokemonState('speciesData')) {
			nationalDexNumber.value = getPokemonState('speciesData').id;
			const genusEntry = getPokemonState('speciesData').genera.find(
				(g) => g.language.name === "en",
			);
			pokemonGenus.value = genusEntry ? genusEntry.genus : "???";

			pokemonColor.value = getPokemonState('speciesData').color ?
				getPokemonState('speciesData').color.name :
				"???";
			updateColorDisplay();

			// gender ratio
			if (getPokemonState('speciesData').gender_rate === -1) {
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
				const femalePercentage = (getPokemonState('speciesData').gender_rate / 8) * 100;
				const malePercentage = 100 - femalePercentage;
				genderSlider.value = malePercentage;
				updateGenderRatioDisplay();
			}

			// egg groups
			if (getPokemonState('speciesData').egg_groups && getPokemonState('speciesData').egg_groups.length > 0) {
				eggGroup1.value = formatPokemonName(getPokemonState('speciesData').egg_groups[0].name);
				if (getPokemonState('speciesData').egg_groups[1]) {
					eggGroup2.value = formatPokemonName(getPokemonState('speciesData').egg_groups[1].name);
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


		if (getPokemonState('pokemonData')) {
			pokemonHeight.value = `${(getPokemonState('pokemonData').height / 10).toFixed(1)} m`; // decimeters to meters
			pokemonWeight.value = `${(getPokemonState('pokemonData').weight / 10).toFixed(1)} kg`; // hectograms to kilograms
		}
	};


	const updateGenderRatioDisplay = () => {
		const malePercent = parseInt(genderSlider.value);
		const femalePercent = 100 - malePercent;

		maleRatio.textContent = malePercent > 0 ? `♂ ${malePercent}%` : "";
		femaleRatio.textContent = femalePercent > 0 ? `♀ ${femalePercent}%` : "";

		genderRatioBar.style.setProperty("--male-percent", `${malePercent}%`);
	};

	const updateFlavorText = () => {
		if (getPokemonState('speciesData') && getPokemonState('speciesData').flavor_text_entries) {
			const englishFlavorText = getPokemonState('speciesData').flavor_text_entries.find(
				(entry) => entry.language.name === "en",
			);
			flavorText.value = englishFlavorText ?
				formatFlavorText(englishFlavorText.flavor_text) :
				"No flavor text available for this Pokémon";
		} else {
			flavorText.value = "Search for a Pokémon to see its Pokédex entry";
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

		flavorText.value = "Search for a Pokémon to see its Pokédex entry";

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

		document.querySelectorAll('.move-input').forEach(input => input.value = "");
	};


	init();
});