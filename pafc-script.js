document.addEventListener("DOMContentLoaded", () => {
	const searchInput = document.getElementById("pokemon-search-input");
	const pokemonName = document.getElementById("pokemon-name");
	const portrait = document.getElementById("pokemon-portrait");
	const portraitUpload = document.getElementById("portrait-upload");
	const shinyToggleBtn = document.getElementById("shiny-toggle-button");
	const formButtonsContainer = document.getElementById("form-buttons-container", );

	const type1Select = document.getElementById('type1-select');
	const type2Select = document.getElementById('type2-select');
	const typeBox1 = document.getElementById('type-box-1');
	const typeBox2 = document.getElementById('type-box-2');
	const typeContainer = document.querySelector('.type-container');

	const ability1 = document.getElementById("ability1");
	const ability2 = document.getElementById("ability2");
	const hiddenAbility = document.getElementById("ability-hidden");

	const flavorText = document.getElementById("flavor-text");

	const infoDexNo = document.getElementById("info-dex-no");
	const infoGenus = document.getElementById("info-genus");
	const infoHeight = document.getElementById("info-height");
	const infoWeight = document.getElementById("info-weight");
	const genderSlider = document.getElementById("gender-slider");
	const maleRatio = document.getElementById("male-ratio");
	const femaleRatio = document.getElementById("female-ratio");
	const infoEvoCondition = document.getElementById("info-evo-condition");
	const eggGroup1 = document.getElementById("egg-group-1");
	const eggGroup2 = document.getElementById("egg-group-2");
	const infoColor = document.getElementById("info-color");

	// global state
	let currentSpeciesData = null;
	let currentPokemonData = null;
	let evolutionChainData = null;
	let isShiny = false;
	let currentVarieties = [];
	const statInfo = [{
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

	const pokemonTypes = [{
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

	const API_BASE_URL = "https://pokeapi.co/api/v2/";

	// cache to local storage
	const cache = {
		get: (key) => {
			try {
				const item = localStorage.getItem(key);
				if (item) {
					const data = JSON.parse(item);
					// add expiry time check in the future
					return data;
				}
			} catch (e) {
				console.error("Error reading from localStorage", e);
			}
			return null;
		},
		set: (key, data) => {
			try {
				localStorage.setItem(key, JSON.stringify(data));
			} catch (e) {
				console.error("Error writing to localStorage", e);
			}
		},
	};

	// debounce for key press
	const debounce = (func, delay) => {
		let timeout;
		return function(...args) {
			const context = this;
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(context, args), delay);
		};
	};

	const debouncedSelectPokemon = debounce((speciesName) => {
		selectPokemon(speciesName);
	}, 300); // 300ms debounce delay

	// initilization
	const init = async () => {
		setupStatBars();
		populateTypeDropdowns();
		setupEventListeners();
	};

	// event listeners
	const setupEventListeners = () => {
		searchInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				debouncedSelectPokemon(searchInput.value.toLowerCase());
			}
		});

		shinyToggleBtn.addEventListener("click", toggleShiny);

		portraitUpload.addEventListener("change", handleImageUpload);

		genderSlider.addEventListener("input", updateGenderRatioDisplay);

		type1Select.addEventListener("change", (e) => {
			updateTypeDisplay(e.target.value, 1);
		});
		type2Select.addEventListener("change", (e) => {
			updateTypeDisplay(e.target.value, 2);
		});

		infoColor.addEventListener("input", updateColorDisplay);

		flavorText.addEventListener("input", autoResizeFlavorText);
	};


	const selectPokemon = async (speciesName) => {
		searchInput.value = speciesName;

		try {
			let speciesData = cache.get(`species_${speciesName}`);
			if (!speciesData) {
				const speciesResponse = await fetch(
					`${API_BASE_URL}pokemon-species/${speciesName}`,
				);
				if (!speciesResponse.ok) {
					throw new Error(`Pokémon "${speciesName}" not found.`);
				}
				speciesData = await speciesResponse.json();
				cache.set(`species_${speciesName}`, speciesData); // store in cache, more instances
			}
			currentSpeciesData = speciesData;
			currentVarieties = currentSpeciesData.varieties;

			// always fetches the base (item 1) variety, form button changes variety
			const defaultVariety = currentVarieties.find((v) => v.is_default);
			if (defaultVariety) {
				fetchAndDisplayPokemon(defaultVariety.pokemon.url);
			} else {
				console.error("No default variety found for this Pokémon species.");
			}

			// check cache for evo-chain, more instances
			let evoChainData = cache.get(`evo_chain_${currentSpeciesData.evolution_chain.url}`);
			if (!evoChainData) {
				const evoChainResponse = await fetch(
					currentSpeciesData.evolution_chain.url,
				);
				evoChainData = await evoChainResponse.json();
				cache.set(`evo_chain_${currentSpeciesData.evolution_chain.url}`, evoChainData);
			}
			evolutionChainData = evoChainData;
			updateEvolutionChain();
			updateExtraInfo();
		} catch (error) {
			console.error(`Error fetching ${speciesName}:`, error);
			alert(`Could not find Pokémon: ${speciesName}. Please check the spelling.`);
			resetUI();
		}
	};

	const fetchAndDisplayPokemon = async (pokemonUrl) => {
		try {
			let pokemonData = cache.get(`pokemon_${pokemonUrl}`);
			if (!pokemonData) {
				const response = await fetch(pokemonUrl);
				pokemonData = await response.json();
				cache.set(`pokemon_${pokemonUrl}`, pokemonData);
			}
			currentPokemonData = pokemonData;
			isShiny = false;

			type1Select.value = "";
			type2Select.value = "none";
			updateTypeDisplay("", 1);
			updateTypeDisplay("none", 2);

			updateAllUI();
		} catch (error) {
			console.error("Error fetching Pokémon data:", error);
		}
	};

	const updateAllUI = () => {
		pokemonName.value = currentPokemonData.name.replace(/-/g, " ");
		updateStatsFromAPI();
		updateTypes();
		updateAbilities();
		updatePortraitAndForms();
		updateExtraInfo();
		updateFlavorText();
	};

	const updatePortraitAndForms = () => {
		formButtonsContainer.innerHTML = "";
		const artwork = currentPokemonData.sprites.other["official-artwork"];
		portrait.src =
			artwork?.front_default || currentPokemonData.sprites.front_default || "";
		shinyToggleBtn.style.display = artwork?.front_shiny ? "block" : "none";

		const baseForm = currentVarieties.find((v) => v.is_default);
		const otherForms = currentVarieties.filter((v) => !v.is_default);
		const allForms = [baseForm, ...otherForms].filter(Boolean);

		if (allForms.length > 1) {
			const formSelect = document.createElement("select");
			formSelect.addEventListener("change", (e) =>
				fetchAndDisplayPokemon(e.target.value),
			);

			allForms.forEach((form) => {
				const option = document.createElement("option");
				option.value = form.pokemon.url;
				let prettyName = form.pokemon.name
					.replace(currentSpeciesData.name, "")
					.replace(/-/g, " ")
					.trim();
				option.textContent =
					prettyName === "" ?
					"Base" :
					prettyName.replace(/\b\w/g, (l) => l.toUpperCase());

				if (form.pokemon.name === currentPokemonData.name) {
					option.selected = true;
				}
				formSelect.appendChild(option);
			});
			formButtonsContainer.appendChild(formSelect);
		}
	};

	const toggleShiny = () => {
		if (!currentPokemonData) return;
		const artwork = currentPokemonData.sprites.other["official-artwork"];
		if (!artwork || !artwork.front_shiny) return;
		isShiny = !isShiny;
		portrait.src = isShiny ? artwork.front_shiny : artwork.front_default;
	};

	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				portrait.src = e.target.result;
				shinyToggleBtn.style.display = "none";
			};
			reader.readAsDataURL(file);
		}
	};

	const updateStatsFromAPI = () => {
		currentPokemonData.stats.forEach((s) => {
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
		[type1Select, type2Select].forEach(selectElement => {
			const initialOptionValue = selectElement.id === 'type1-select' ? '' : 'none';
			while (selectElement.children.length > 1 || (selectElement.children.length === 1 && selectElement.children[0].value !== initialOptionValue)) {
				selectElement.removeChild(selectElement.lastChild);
			}

			pokemonTypes.forEach(type => {
				const option = document.createElement('option');
				option.value = type.value;
				option.textContent = type.name;
				selectElement.appendChild(option);
			});
		});
	};

	const updateTypes = () => {
		const types = currentPokemonData.types;

		typeContainer.classList.remove("single-type");
		typeBox1.classList.remove("hidden"); // incase type-box-1 is hidden by mistake
		typeBox2.classList.remove("hidden");

		if (types[0]) {
			type1Select.value = types[0].type.name;
			updateTypeDisplay(types[0].type.name, 1);
		} else {
			// incase any future PokeAPI updates uploads a pokemon with no type(s)
			updateTypeDisplay("", 1);
		}

		if (types[1]) {
			// incase second type detected, go back to normal
			type2Select.value = types[1].type.name;
			updateTypeDisplay(types[1].type.name, 2);
		} else {
			// incase no second type
			updateTypeDisplay("none", 2);
			typeBox2.classList.add("hidden");
			typeContainer.classList.add("single-type");
		}
	};

	const updateTypeDisplay = (selectedType, typeNumber) => {
		const targetTypeBox = typeNumber === 1 ? typeBox1 : typeBox2;
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

		statInfo.forEach((stat) => {
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
		statInfo.forEach((stat) => {
			const valueInput = document.getElementById(`stat-value-${stat.apiName}`);
			totalStats += parseInt(valueInput.value || 0);
		});
		document.getElementById("bst-value").value = totalStats;
	};

	const updateAbilities = () => {
		ability1.value = "N/A";
		ability2.value = "N/A";
		hiddenAbility.value = "N/A";

		currentPokemonData.abilities.forEach((ability) => {
			if (ability.is_hidden) {
				hiddenAbility.value = ability.ability.name.replace(/-/g, " ");
			} else if (ability.slot === 1) {
				ability1.value = ability.ability.name.replace(/-/g, " ");
			} else if (ability.slot === 2) {
				ability2.value = ability.ability.name.replace(/-/g, " ");
			}
		});
	};

	const updateEvolutionChain = () => {
		const getEvoStageDetails = (chainLink) => {
			const details = [];
			let current = chainLink;
			while (current) {
				details.push({
					name: current.species.name,
					url: current.species.url,
				});
				current = current.evolves_to[0];
			}
			return details;
		};

		const evoStages = getEvoStageDetails(evolutionChainData.chain);

		// clear previous; figure out how to fix broken image icon
		document.getElementById("evo-1-img").src = "#";
		document.getElementById("evo-1-name").textContent = "";
		document.getElementById("evo-2-img").src = "#";
		document.getElementById("evo-2-name").textContent = "";
		document.getElementById("evo-3-img").src = "#";
		document.getElementById("evo-3-name").textContent = "";


		if (evoStages[0]) {
			fetchPokemonDataForEvolution(evoStages[0].name, "evo-1");
		}
		if (evoStages[1]) {
			fetchPokemonDataForEvolution(evoStages[1].name, "evo-2");
		}
		if (evoStages[2]) {
			fetchPokemonDataForEvolution(evoStages[2].name, "evo-3");
		}
	};

	const fetchPokemonDataForEvolution = async (pokemonName, elElementIdPrefix) => {
		try {
			let data = cache.get(`pokemon_evo_${pokemonName}`);
			if (!data) {
				const response = await fetch(`${API_BASE_URL}pokemon/${pokemonName}`);
				data = await response.json();
				cache.set(`pokemon_evo_${pokemonName}`, data);
			}

			const img = document.getElementById(`${elElementIdPrefix}-img`);
			const name = document.getElementById(`${elElementIdPrefix}-name`);

			img.src =
				data.sprites.front_default || data.sprites.other["official-artwork"]?.front_default || "#";
			img.alt = pokemonName;
			name.textContent = pokemonName.replace(/-/g, " ");
		} catch (error) {
			console.error(`Error fetching evolution data for ${pokemonName}:`, error);
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
			// looking for how pre-evo evolves into targetSpeciesName
			// look in evolves_to array of the pre-evo
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
		const infoEvoConditionItem = document.getElementById("info-evo-condition");
		const evoConditionParent = infoEvoConditionItem.closest('.info-item');
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

		let itemData = cache.get(`item_${itemUrl}`);
		if (!itemData) {
			try {
				const response = await fetch(itemUrl);
				if (!response.ok) throw new Error("Item not found");
				itemData = await response.json();
				cache.set(`item_${itemUrl}`, itemData);
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
		existingSprite.title = itemData.name.replace(/-/g, " ");
		existingSprite.style.display = 'block'; // show if itemUrl is valid
	};


	const updateExtraInfo = async () => {
		if (currentSpeciesData) {
			infoDexNo.value = currentSpeciesData.id;
			const genusEntry = currentSpeciesData.genera.find(
				(g) => g.language.name === "en",
			);
			infoGenus.value = genusEntry ? genusEntry.genus : "???";

			const flavorTextEntry = currentSpeciesData.flavor_text_entries.find(
				(entry) => entry.language.name === "en",
			);
			flavorText.value = flavorTextEntry ?
				flavorTextEntry.flavor_text.replace(/\n|\f/g, " ") :
				"No flavor text available.";

			infoColor.value = currentSpeciesData.color ?
				currentSpeciesData.color.name :
				"???";
			updateColorDisplay();

			// gender ratio
			if (currentSpeciesData.gender_rate === -1) {
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
				const femalePercentage = (currentSpeciesData.gender_rate / 8) * 100;
				const malePercentage = 100 - femalePercentage;
				genderSlider.value = malePercentage;
				updateGenderRatioDisplay();
			}

			// egg groups
			if (currentSpeciesData.egg_groups && currentSpeciesData.egg_groups.length > 0) {
				eggGroup1.value = currentSpeciesData.egg_groups[0].name.replace(/-/g, " ");
				if (currentSpeciesData.egg_groups[1]) {
					eggGroup2.value = currentSpeciesData.egg_groups[1].name.replace(/-/g, " ");
				} else {
					eggGroup2.value = "N/A";
				}
			} else {
				eggGroup1.value = "N/A";
				eggGroup2.value = "N/A";
			}

			let evoConditionText = "";
			let itemSpriteUrl = null;

			if (currentSpeciesData.evolves_from_species) {
				const preEvoName = currentSpeciesData.evolves_from_species.name.replace(/-/g, " ");
				evoConditionText += preEvoName.charAt(0).toUpperCase() + preEvoName.slice(1);

				if (evolutionChainData) {
					const evolutionDetails = getEvolutionDetails(evolutionChainData.chain, currentSpeciesData.name);

					if (evolutionDetails) {
						let conditionDetails = [];

						if (evolutionDetails.trigger && evolutionDetails.trigger.name === "level-up" && evolutionDetails.min_level) {
							conditionDetails.push(`Lvl ${evolutionDetails.min_level}`);
						} else if (evolutionDetails.trigger && evolutionDetails.trigger.name === "use-item" && evolutionDetails.item) {
							conditionDetails.push(evolutionDetails.item.name.replace(/-/g, " ").replace("stone", "Stone"));
							itemSpriteUrl = evolutionDetails.item.url;
						} else if (evolutionDetails.held_item) {
							conditionDetails.push(`Holding ${evolutionDetails.held_item.name.replace(/-/g, " ").replace("protector", "Protector").replace("reaper-cloth", "Reaper Cloth")}`);
							itemSpriteUrl = evolutionDetails.held_item.url;
						} else if (evolutionDetails.trigger && evolutionDetails.trigger.name === "trade") {
							conditionDetails.push("Trade");
						} else if (evolutionDetails.min_happiness) {
							conditionDetails.push("High Happiness");
						} else if (evolutionDetails.min_affection) {
							conditionDetails.push("High Affection");
						} else if (evolutionDetails.known_move) {
							conditionDetails.push(`Known Move: ${evolutionDetails.known_move.name.replace(/-/g, " ")}`);
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
				evoConditionText = "Does not evolve from a prior form.";
			}

			// how i would handle mega evolutions for an evo-condition
			// checking if the current pokemon's name implies mega evolution and then infer the item
			// a better solution would involve a separate API call or a pre-defined mapping
			if (currentPokemonData && currentPokemonData.name.includes("-mega")) {
				const basePokemonName = currentPokemonData.name.replace("-mega", "");
				const megaStoneName = `${basePokemonName}-mega-stone`; // incase PokeAPI ever adds mega-stones to evo-chains
				const megaStoneApiUrl = `${API_BASE_URL}item/${basePokemonName}-megastone`;

				let megaStoneData = cache.get(`item_${megaStoneApiUrl}`);
				if (!megaStoneData) {
					try {
						const megaStoneResponse = await fetch(megaStoneApiUrl);
						if (megaStoneResponse.ok) {
							megaStoneData = await megaStoneResponse.json();
							cache.set(`item_${megaStoneApiUrl}`, megaStoneData);
						} else {
							console.warn(`Mega stone for ${basePokemonName} not found via API. Using generic text.`);
						}
					} catch (error) {
						console.error("Error fetching mega stone data:", error);
					}
				}

				if (megaStoneData) {
					evoConditionText = `${basePokemonName.charAt(0).toUpperCase() + basePokemonName.slice(1).replace(/-/g, " ")}, Holding ${megaStoneData.name.replace(/-/g, " ")}`;
					itemSpriteUrl = megaStoneData.sprites.default;
				} else {
					evoConditionText = `${basePokemonName.charAt(0).toUpperCase() + basePokemonName.slice(1).replace(/-/g, " ")}, Holding Mega Stone`;
				}
			}

			infoEvoCondition.value = evoConditionText || "N/A";
			displayEvolutionItemSprite(itemSpriteUrl);
		}


		if (currentPokemonData) {
			infoHeight.value = `${(currentPokemonData.height / 10).toFixed(1)} m`; // decimeters to meters
			infoWeight.value = `${(currentPokemonData.weight / 10).toFixed(1)} kg`; // hectograms to kilograms
		}
	};


	const updateGenderRatioDisplay = () => {
		const malePercent = parseInt(genderSlider.value);
		const femalePercent = 100 - malePercent;

		maleRatio.style.width = `${malePercent}%`;
		femaleRatio.style.width = `${femalePercent}%`;

		maleRatio.textContent = malePercent > 0 ? `♂ ${malePercent}%` : "";
		femaleRatio.textContent = femalePercent > 0 ? `♀ ${femalePercent}%` : "";

		genderSlider.style.setProperty("--male-percent", `${malePercent}%`);
	};

	const updateFlavorText = () => {
		if (currentSpeciesData && currentSpeciesData.flavor_text_entries) {
			const englishFlavorText = currentSpeciesData.flavor_text_entries.find(
				(entry) => entry.language.name === "en",
			);
			flavorText.value = englishFlavorText ?
				englishFlavorText.flavor_text.replace(/\n|\f/g, " ") :
				"No flavor text available for this Pokémon.";
		} else {
			flavorText.value = "Search for a Pokémon to see its Pokédex entry.";
		}
		autoResizeFlavorText();
	};

	const updateColorDisplay = () => {
		const colorValue = infoColor.value.toLowerCase();
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
			infoColor.style.backgroundColor = colorMap[colorValue];
			infoColor.style.color =
				colorValue === "black" || colorValue === "blue" || colorValue === "purple" ?
				"white" :
				"black";
		} else {
			infoColor.style.backgroundColor = "";
			infoColor.style.color = "";
		}
	};

	// reset UI elements when pokemon not found
	const resetUI = () => {
		pokemonName.value = "";
		portrait.src = "#";
		shinyToggleBtn.style.display = "none";
		formButtonsContainer.innerHTML = "";

		type1Select.value = "";
		type2Select.value = "none";
		updateTypeDisplay("", 1);
		updateTypeDisplay("none", 2);

		infoDexNo.value = "???";
		infoGenus.value = "???";
		infoHeight.value = "? m";
		infoWeight.value = "? kg";
		genderSlider.value = "50";
		updateGenderRatioDisplay();
		infoEvoCondition.value = "???";
		eggGroup1.value = "???";
		eggGroup2.value = "???";
		infoColor.value = "???";
		infoColor.style.backgroundColor = "";
		infoColor.style.color = "";
		infoEvoCondition.value = "???";
		displayEvolutionItemSprite(null);

		document.getElementById("evo-1-img").src = "#";
		document.getElementById("evo-1-name").textContent = "";
		document.getElementById("evo-2-img").src = "#";
		document.getElementById("evo-2-name").textContent = "";
		document.getElementById("evo-3-img").src = "#";
		document.getElementById("evo-3-name").textContent = "";

		flavorText.value = "Search for a Pokémon to see its Pokédex entry.";

		ability1.value = "Ability 1";
		ability2.value = "Ability 2";
		hiddenAbility.value = "Hidden Ability";

		statInfo.forEach(stat => {
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