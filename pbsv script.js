document.addEventListener('DOMContentLoaded', () => {
  const statContainer = document.getElementById('stat-container');
  const pokemonNameInput = document.getElementById('character-name');

  // PokeAPI calls
  const pokemonSearchInput = document.getElementById('pokemon-search-input');
  const searchButton = document.getElementById('search-button');
  const uploadedPortrait = document.getElementById('uploaded-portrait');
  const portraitPlaceholder = document.querySelector('.portrait-box-placeholder');
  const type1Select = document.getElementById('type1-select');
  const type2Select = document.getElementById('type2-select');
  const shinyToggleButton = document.getElementById('shiny-toggle-button');

  let currentPokemonSprites = null; // store sprites data from API
  let isShiny = false; // sprite state for the shiny button

  // updated after an API call
  const stats = [
    { name: 'HP', value: 30, apiName: 'hp' },
    { name: 'Attack', value: 60, apiName: 'attack' },
    { name: 'Defense', value: 90, apiName: 'defense' },
    { name: 'Special Attack', value: 120, apiName: 'special-attack' },
    { name: 'Special Defense', value: 150, apiName: 'special-defense' },
    { name: 'Speed', value: 255, apiName: 'speed' }
  ];

  const rankClasses = [
    'barchart-rank-1', 'barchart-rank-2', 'barchart-rank-3',
    'barchart-rank-4', 'barchart-rank-5', 'barchart-rank-6'
  ];

  const COLOR_MAX_VALUE = 180;
  const RANK_INTERVAL = COLOR_MAX_VALUE / 6;

  const getRankClass = (value) => {
    if (value <= RANK_INTERVAL * 1) return rankClasses[0];
    if (value <= RANK_INTERVAL * 2) return rankClasses[1];
    if (value <= RANK_INTERVAL * 3) return rankClasses[2];
    if (value <= RANK_INTERVAL * 4) return rankClasses[3];
    if (value <= RANK_INTERVAL * 5) return rankClasses[4];
    return rankClasses[5];
  };

  const updateStatDisplay = (slider, valueInput, value) => {
    const clampedValue = Math.max(0, Math.min(255, value));
    slider.value = clampedValue;
    if (document.activeElement !== valueInput) {
      valueInput.value = clampedValue;
    }
    const newRankClass = getRankClass(clampedValue);
    slider.className = ''; // clear existing classes
    slider.classList.add(newRankClass);
    const fillPercent = (clampedValue / 255) * 100;
    slider.style.setProperty('--fill-percent', `${fillPercent}%`);
  };

  stats.forEach(stat => {
    const statBar = document.createElement('div');
    statBar.className = 'stat-bar';

    const label = document.createElement('label');
    label.className = 'stat-label';
    label.textContent = stat.name;
    label.htmlFor = `stat-slider-${stat.apiName}`;

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.className = 'stat-value';
    valueInput.min = 0;
    valueInput.max = 255;
    valueInput.value = stat.value;
    valueInput.id = `stat-value-${stat.apiName}`; // API call for a stat, text box

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 255;
    slider.value = stat.value;
    slider.id = `stat-slider-${stat.apiName}`; // API call for a stat, slider

    statBar.append(label, valueInput, slider);
    statContainer.appendChild(statBar);

    slider.addEventListener('input', () => {
      updateStatDisplay(slider, valueInput, parseInt(slider.value, 10));
      updateBST();
    });
    valueInput.addEventListener('input', () => {
      updateStatDisplay(slider, valueInput, parseInt(valueInput.value, 10) || 0);
      updateBST();
    });

    updateStatDisplay(slider, valueInput, stat.value);
  });

  const bstBar = document.createElement('div');
  bstBar.className = 'stat-bar';

  const bstLabel = document.createElement('label');
  bstLabel.className = 'stat-label';
  bstLabel.textContent = 'BST';

  const bstValue = document.createElement('input');
  bstValue.type = 'number';
  bstValue.className = 'stat-value';
  bstValue.readOnly = true;
  bstValue.value = 0;
  bstValue.style.backgroundColor = '#f9fafb';
  bstValue.style.fontWeight = '700';
  bstValue.style.border = 'none';

  const emptySpan = document.createElement('span');

  bstBar.append(bstLabel, bstValue, emptySpan);
  statContainer.appendChild(bstBar);

  const updateBST = () => {
    const total = stats.reduce((sum, stat) => {
      const input = document.getElementById(`stat-value-${stat.apiName}`);
      return sum + (parseInt(input.value, 10) || 0);
    }, 0);
    bstValue.value = total;
  };

  updateBST();

  const pokemonTypes = [
    { name: 'Normal', class: 'type-normal', value: 'normal' },
    { name: 'Fire', class: 'type-fire', value: 'fire' },
    { name: 'Water', class: 'type-water', value: 'water' },
    { name: 'Electric', class: 'type-electric', value: 'electric' },
    { name: 'Grass', class: 'type-grass', value: 'grass' },
    { name: 'Ice', class: 'type-ice', value: 'ice' },
    { name: 'Fighting', class: 'type-fighting', value: 'fighting' },
    { name: 'Poison', class: 'type-poison', value: 'poison' },
    { name: 'Ground', class: 'type-ground', value: 'ground' },
    { name: 'Flying', class: 'type-flying', value: 'flying' },
    { name: 'Psychic', class: 'type-psychic', value: 'psychic' },
    { name: 'Bug', class: 'type-bug', value: 'bug' },
    { name: 'Rock', class: 'type-rock', value: 'rock' },
    { name: 'Ghost', class: 'type-ghost', value: 'ghost' },
    { name: 'Dragon', class: 'type-dragon', value: 'dragon' },
    { name: 'Dark', class: 'type-dark', value: 'dark' },
    { name: 'Steel', class: 'type-steel', value: 'steel' },
    { name: 'Fairy', class: 'type-fairy', value: 'fairy' }
  ];

  const populateTypeDropdown = (selectElement) => {
    while (selectElement.children.length > 1) {
      selectElement.removeChild(selectElement.lastChild);
    }

    pokemonTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.name;
      selectElement.appendChild(option);
    });
  };

  populateTypeDropdown(type1Select);
  populateTypeDropdown(type2Select);


  const handleTypeChange = (event) => {
    const selectElement = event.target;
    const selectedValue = selectElement.value;

    pokemonTypes.forEach(type => {
      selectElement.classList.remove(type.class);
    });

    const selectedType = pokemonTypes.find(type => type.value === selectedValue);

    if (selectedType) {
      selectElement.classList.add(selectedType.class);

    } else {
      selectElement.style.backgroundColor = '';
    }
  };

  type1Select.addEventListener('change', handleTypeChange);
  type2Select.addEventListener('change', handleTypeChange);

  const portraitBox = document.getElementById('portrait-box');
  const imageUploadInput = document.getElementById('image-upload-input');

  portraitBox.addEventListener('click', (event) => {
    // only allow manual upload if no API image is displayed
    // prevents click from propagating to shiny button
    if (event.target === shinyToggleButton) {
      return; // don't trigger file input if shiny button clicked
    }

    if (uploadedPortrait.style.display === 'none' || event.target === portraitPlaceholder) {
      imageUploadInput.click();
    }
  });

  imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedPortrait.src = e.target.result;
        uploadedPortrait.style.display = 'block';
        portraitPlaceholder.classList.add('hidden');
        shinyToggleButton.style.display = 'none';
        currentPokemonSprites = null;
        isShiny = false;
      };
      reader.readAsDataURL(file);
    } else {
      uploadedPortrait.src = '#';
      uploadedPortrait.style.display = 'none';
      portraitPlaceholder.classList.remove('hidden');
      shinyToggleButton.style.display = 'none';
      currentPokemonSprites = null;
      isShiny = false;
    }
  });

  // PokeAPI integration
  const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';

  const fetchPokemonData = async (pokemonName) => {
    const url = `${POKEAPI_BASE_URL}${pokemonName.toLowerCase()}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          alert(`Pokémon "${pokemonName}" not found. Please check the spelling.`);
        } else {
          alert(`Error fetching Pokémon data: ${response.statusText}`);
        }
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Could not connect to PokeAPI');
      return null;
    }
  };

  const updateUIWithPokemonData = (data) => {
    currentPokemonSprites = data.sprites;
    isShiny = false;

    pokemonNameInput.value = data.name.charAt(0).toUpperCase() + data.name.slice(1);

    data.stats.forEach(apiStat => {
      const statName = apiStat.stat.name;
      const baseStatValue = apiStat.base_stat;

      const slider = document.getElementById(`stat-slider-${statName}`);
      const valueInput = document.getElementById(`stat-value-${statName}`);

      if (slider && valueInput) {
        updateStatDisplay(slider, valueInput, baseStatValue);
      }
    });
    updateBST();

    type1Select.value = "";
    type2Select.value = "";
    handleTypeChange({ target: type1Select });
    handleTypeChange({ target: type2Select });

    data.types.forEach((typeInfo, index) => {
      const typeName = typeInfo.type.name;
      if (index === 0) {
        type1Select.value = typeName;
        handleTypeChange({ target: type1Select });
      } else if (index === 1) {
        type2Select.value = typeName;
        handleTypeChange({ target: type2Select });
      }
    });

    const spriteUrl = currentPokemonSprites.front_default;
    if (spriteUrl) {
      uploadedPortrait.src = spriteUrl;
      uploadedPortrait.style.display = 'block';
      portraitPlaceholder.classList.add('hidden');
      // show shiny button only if shiny sprite exists
      if (currentPokemonSprites.front_shiny) {
        shinyToggleButton.style.display = 'flex';
      } else {
        shinyToggleButton.style.display = 'none';
      }
    } else {
      uploadedPortrait.src = '#';
      uploadedPortrait.style.display = 'none';
      portraitPlaceholder.classList.remove('hidden');
      shinyToggleButton.style.display = 'none';
      console.warn(`No front_default sprite found for ${data.name}.`);
    }
  };

  const handleSearch = async () => {
    const query = pokemonSearchInput.value.trim();
    if (query) {
      const pokemonData = await fetchPokemonData(query);
      if (pokemonData) {
        updateUIWithPokemonData(pokemonData);
      } else {
        pokemonNameInput.value = '';
        uploadedPortrait.src = '#';
        uploadedPortrait.style.display = 'none';
        portraitPlaceholder.classList.remove('hidden');
        shinyToggleButton.style.display = 'none';
        currentPokemonSprites = null;
        isShiny = false;
        type1Select.value = "";
        type2Select.value = "";
        handleTypeChange({ target: type1Select });
        handleTypeChange({ target: type2Select });
      }
    } else {
      alert('Please enter a Pokémon name to search.');
    }
  };

  searchButton.addEventListener('click', handleSearch);
  pokemonSearchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  });

  shinyToggleButton.addEventListener('click', () => {
    if (currentPokemonSprites) {
      isShiny = !isShiny;
      let newSpriteUrl = '';

      if (isShiny) {
        newSpriteUrl = currentPokemonSprites.front_shiny;
        if (!newSpriteUrl) {
          console.warn("No shiny sprite available for this Pokémon");
          newSpriteUrl = currentPokemonSprites.front_default;
          isShiny = false;
        }
      } else {
        newSpriteUrl = currentPokemonSprites.front_default;
      }

      if (newSpriteUrl) {
        uploadedPortrait.src = newSpriteUrl;
      }
    }
  });

  shinyToggleButton.style.display = 'none';
});