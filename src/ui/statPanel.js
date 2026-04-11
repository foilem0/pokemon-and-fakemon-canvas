/**
 * statPanel.js - Stat display, hexagon visualization, and stat affectors UI
 */

import {
	POKEMON_STATS,
	STAT_BAR_DISPLAY_ORDER,
	NATURE_NAMES,
	calculateFinalStat,
	getNatureMultiplier,
	getNatureSign,
	createDefaultStatAffectors,
	calculateBST
} from '../models/stats.js';
import { getStatRankInfo } from '../models/pokemon.js';
import { appState } from '../store/appState.js';

// DOM references
let statElements = {};
let affectorElements = {};
let hexagonCache = { built: false, currentPolygon: null, valueNodes: [], svg: null };
let isAffectorUIBuilt = false;

// DOM node references
let statContainer;
let hexagonContainer;
let natureSelect;
let levelInput;
let affectorStatContainer;
let statAffectorToggle;
let statAffectorClose;

/**
 * Initialize stat panel UI module
 */
export const initStatPanel = (deps) => {
	statContainer = deps.statContainer;
	hexagonContainer = deps.hexagonContainer;
	natureSelect = deps.natureSelect;
	levelInput = deps.levelInput;
	affectorStatContainer = deps.affectorStatContainer;
	statAffectorToggle = deps.statAffectorToggle;
	statAffectorClose = deps.statAffectorClose;

	setupStatBars();
	cacheStatElements();
	setupStatAffectorUI();
	setupStatPanelEventListeners();
};

/**
 * Setup stat panel event listeners
 */
const setupStatPanelEventListeners = () => {
	const statsViewToggle = document.getElementById('stats-view-toggle');
	if (statsViewToggle) {
		statsViewToggle.addEventListener('click', toggleStatsView);
	}

	if (statAffectorToggle) {
		statAffectorToggle.addEventListener('click', toggleStatAffectorDropdown);
	}

	if (statAffectorClose) {
		statAffectorClose.addEventListener('click', closeStatAffectorDropdown);
	}

	// Close stat affector on outside click
	window.addEventListener('click', (event) => {
		const dropdown = document.getElementById('stat-affector-dropdown');
		if (
			dropdown &&
			!dropdown.classList.contains('hidden') &&
			!dropdown.contains(event.target) &&
			event.target !== statAffectorToggle
		) {
			dropdown.classList.add('hidden');
		}
	});

	// Handle window resize for hexagon
	let resizeTimeout;
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			if (hexagonCache.built && !hexagonContainer.classList.contains('hidden')) {
				buildStatHexagon();
			}
		}, 200);
	});
};

/**
 * Setup stat bars
 */
const setupStatBars = () => {
	statContainer.innerHTML = '';

	STAT_BAR_DISPLAY_ORDER.forEach((stat) => {
		const statBarDiv = document.createElement('div');
		statBarDiv.classList.add('stat-bar');

		const label = document.createElement('span');
		label.classList.add('stat-label');
		label.textContent = stat.name;

		const natureSign = document.createElement('span');
		natureSign.classList.add('stat-nature-sign');
		natureSign.id = `nature-sign-${stat.apiName}`;
		label.appendChild(natureSign);
		statBarDiv.appendChild(label);

		const valueInput = document.createElement('input');
		valueInput.type = 'number';
		valueInput.classList.add('stat-value');
		valueInput.id = `stat-value-${stat.apiName}`;
		valueInput.min = '0';
		valueInput.max = '255';
		valueInput.value = '0';
		valueInput.addEventListener('input', (e) => {
			const newValue = parseInt(e.target.value, 10);
			const slider = document.getElementById(`stat-slider-${stat.apiName}`);
			if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
				slider.value = newValue;
				updateStatDisplay(slider, valueInput, newValue);
			} else if (e.target.value === '') {
				slider.value = 0;
				updateStatDisplay(slider, valueInput, 0);
			}
			updateBST();
			updateFinalStats();
		});
		statBarDiv.appendChild(valueInput);

		const sliderWrapper = document.createElement('div');
		sliderWrapper.classList.add('slider-wrapper');

		const baseBar = document.createElement('div');
		baseBar.classList.add('stat-base-bar');
		baseBar.id = `stat-base-${stat.apiName}`;
		sliderWrapper.appendChild(baseBar);

		const extensionBar = document.createElement('div');
		extensionBar.classList.add('stat-extension-bar');
		extensionBar.id = `stat-extension-${stat.apiName}`;
		sliderWrapper.appendChild(extensionBar);

		const slider = document.createElement('input');
		slider.type = 'range';
		slider.classList.add('base-stat-slider');
		slider.id = `stat-slider-${stat.apiName}`;
		slider.min = '0';
		slider.max = '255';
		slider.value = '0';
		slider.addEventListener('input', (e) => {
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

	const bstRow = document.createElement('div');
	bstRow.classList.add('stat-bar');
	bstRow.innerHTML = `
        <span class="stat-label">BST</span>
        <input type="text" id="bst-value" class="stat-value" value="0" readonly />
        <div class="empty-slider-space"></div>
    `;
	statContainer.appendChild(bstRow);
};

/**
 * Get stat elements (for external updates)
 */
export const getStatElements = () => statElements;

/**
 * Cache stat elements for future reference
 */
const cacheStatElements = () => {
	POKEMON_STATS.forEach((stat) => {
		statElements[stat.apiName] = {
			valueInput: document.getElementById(`stat-value-${stat.apiName}`),
			slider: document.getElementById(`stat-slider-${stat.apiName}`),
			baseBar: document.getElementById(`stat-base-${stat.apiName}`),
			extensionBar: document.getElementById(`stat-extension-${stat.apiName}`),
			natureSign: document.getElementById(`nature-sign-${stat.apiName}`)
		};
	});
};
	POKEMON_STATS.forEach((stat) => {
		statElements[stat.apiName] = {
			valueInput: document.getElementById(`stat-value-${stat.apiName}`),
			slider: document.getElementById(`stat-slider-${stat.apiName}`),
			baseBar: document.getElementById(`stat-base-${stat.apiName}`),
			extensionBar: document.getElementById(`stat-extension-${stat.apiName}`),
			natureSign: document.getElementById(`nature-sign-${stat.apiName}`)
		};
	});
};

/**
 * Update stat display (fill bar color)
 */
export const updateStatDisplay = (slider, valueInput, value) => {
	const fillPercent = (value / 255) * 100;
	slider.style.setProperty('--fill-percent', `${fillPercent}%`);

	slider.classList.remove(
		'barchart-rank-1',
		'barchart-rank-2',
		'barchart-rank-3',
		'barchart-rank-4',
		'barchart-rank-5',
		'barchart-rank-6'
	);

	const rankInfo = getStatRankInfo(value);
	slider.classList.add(rankInfo.class);
	slider.style.setProperty('--bar-color', rankInfo.color);
};

/**
 * SettingUp stat affector UI
 */
const setupStatAffectorUI = () => {
	affectorElements = {
		natureSelect: null,
		levelInput: null,
		rows: {}
	};

	if (!isAffectorUIBuilt) {
		natureSelect.innerHTML = '';
		NATURE_NAMES.forEach((name) => {
			const option = document.createElement('option');
			option.value = name.toLowerCase();
			option.textContent = name;
			if (name.toLowerCase() === appState.getNestedState('statAffectors', 'nature')) {
				option.selected = true;
			}
			natureSelect.appendChild(option);
		});

		levelInput.value = appState.getNestedState('statAffectors', 'level');
		levelInput.addEventListener('input', () => {
			const value = parseInt(levelInput.value, 10);
			const newLevel = Number.isNaN(value) ? 50 : Math.min(100, Math.max(1, value));
			levelInput.value = newLevel;
			appState.setNestedState('statAffectors', 'level', newLevel);
			updateFinalStats();
		});

		affectorStatContainer.innerHTML = '';
		POKEMON_STATS.forEach((stat) => {
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
			evRange.value = appState.getNestedState('statAffectors', 'evs')[stat.apiName];
			const evValue = document.createElement('span');
			evValue.classList.add('slider-value');
			evValue.textContent = `EV ${evRange.value}`;
			evRange.addEventListener('input', () => {
				const newEVValue = parseInt(evRange.value, 10);
				const currentEvs = Object.assign({}, appState.getNestedState('statAffectors', 'evs'));
				currentEvs[stat.apiName] = newEVValue;
				appState.state.statAffectors.evs[stat.apiName] = newEVValue;
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
			ivInput.value = appState.getNestedState('statAffectors', 'ivs')[stat.apiName];
			ivInput.style.width = '68px';
			const ivLabel = document.createElement('span');
			ivLabel.classList.add('slider-value');
			ivLabel.textContent = 'IV';
			ivInput.addEventListener('input', () => {
				let value = parseInt(ivInput.value, 10);
				if (Number.isNaN(value)) value = 0;
				value = Math.min(31, Math.max(0, value));
				ivInput.value = value;
				appState.state.statAffectors.ivs[stat.apiName] = value;
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
			appState.setNestedState('statAffectors', 'nature', natureSelect.value);
			updateFinalStats();
		});

		isAffectorUIBuilt = true;
	} else {
		levelInput.value = appState.getNestedState('statAffectors', 'level');
		natureSelect.value = appState.getNestedState('statAffectors', 'nature');
		POKEMON_STATS.forEach((stat) => {
			const elements = affectorElements.rows[stat.apiName];
			if (elements) {
				elements.evRange.value = appState.getNestedState('statAffectors', 'evs')[stat.apiName];
				elements.evValue.textContent = `EV ${elements.evRange.value}`;
				elements.ivInput.value = appState.getNestedState('statAffectors', 'ivs')[stat.apiName];
			}
		});
	}

	updateFinalStats();
	closeStatAffectorDropdown();
};

/**
 * Update final stats with nature and level modifiers
 */
export const updateFinalStats = () => {
	const level = appState.getNestedState('statAffectors', 'level');
	const nature = appState.getNestedState('statAffectors', 'nature');
	const evs = appState.getNestedState('statAffectors', 'evs');
	const ivs = appState.getNestedState('statAffectors', 'ivs');

	POKEMON_STATS.forEach((stat) => {
		const cached = statElements[stat.apiName] || {};
		const baseValue = parseInt(cached.valueInput?.value || 0, 10);
		const evValue = evs[stat.apiName] ?? 0;
		const ivValue = ivs[stat.apiName] ?? 31;
		const natureMultiplier = getNatureMultiplier(stat.apiName, nature);
		const finalValue = calculateFinalStat(baseValue, ivValue, evValue, level, stat.apiName, natureMultiplier);

		const baseBar = cached.baseBar;
		const finalDropdownOutput = affectorElements.rows[stat.apiName]?.finalValue;
		const extensionBar = cached.extensionBar;
		const labelSign = cached.natureSign;

		const baseFill = Math.min(100, Math.max(0, (baseValue / 255) * 100));
		if (baseBar) baseBar.style.width = `${baseFill}%`;
		if (finalDropdownOutput) finalDropdownOutput.value = finalValue;
		if (labelSign) {
			const sign = getNatureSign(stat.apiName, nature);
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

	if (hexagonContainer && !hexagonContainer.classList.contains('hidden')) {
		updateStatHexagon();
	}
};

/**
 * Update BST display
 */
export const updateBST = () => {
	let totalStats = 0;
	POKEMON_STATS.forEach((stat) => {
		const valueInput = document.getElementById(`stat-value-${stat.apiName}`);
		totalStats += parseInt(valueInput.value || 0);
	});
	document.getElementById('bst-value').value = totalStats;
};

/**
 * Build hexagon visualization
 */
const buildStatHexagon = () => {
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

	const angles = Array.from({ length: 6 }, (_, i) => -Math.PI / 2 + i * Math.PI / 3);
	const statNames = POKEMON_STATS.map(stat => stat.name);

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

/**
 * Update hexagon visualization
 */
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
	const angles = Array.from({ length: 6 }, (_, i) => -Math.PI / 2 + i * Math.PI / 3);

	const level = appState.getNestedState('statAffectors', 'level');
	const nature = appState.getNestedState('statAffectors', 'nature');
	const evs = appState.getNestedState('statAffectors', 'evs');
	const ivs = appState.getNestedState('statAffectors', 'ivs');

	const statValues = POKEMON_STATS.map((stat) => {
		const baseValue = parseInt(statElements[stat.apiName]?.valueInput?.value || 0, 10);
		const evValue = evs[stat.apiName] ?? 0;
		const ivValue = ivs[stat.apiName] ?? 31;
		const natureMultiplier = getNatureMultiplier(stat.apiName, nature);
		return calculateFinalStat(baseValue, ivValue, evValue, level, stat.apiName, natureMultiplier);
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

/**
 * Toggle between bar and hexagon view
 */
const toggleStatsView = () => {
	const isBarView = !statContainer.classList.contains('hidden');

	if (isBarView) {
		statContainer.classList.add('hidden');
		hexagonContainer.classList.remove('hidden');
		updateStatHexagon();
	} else {
		statContainer.classList.remove('hidden');
		hexagonContainer.classList.add('hidden');
	}
};

/**
 * Toggle stat affector dropdown
 */
const toggleStatAffectorDropdown = () => {
	const dropdown = document.getElementById('stat-affector-dropdown');
	dropdown?.classList.toggle('hidden');
};

/**
 * Close stat affector dropdown
 */
const closeStatAffectorDropdown = () => {
	const dropdown = document.getElementById('stat-affector-dropdown');
	dropdown?.classList.add('hidden');
};

/**
 * Reset stat affectors to default values
 */
export const resetStatAffectors = () => {
	appState.resetStatAffectors();
	setupStatAffectorUI();
};
