/**
 * StorageManager - Centralized IndexedDB storage management
 * Handles all cache operations for PokéAPI data, search indices, and custom portraits
 */
const StorageManager = (() => {
	const DB_NAME = 'pafc_db';
	const DB_VERSION = 1;
	const STORES = {
		POKEMON_DATA: 'pokemon_data',
		SPECIES_DATA: 'species_data',
		SEARCH_INDEX: 'search_index',
		PORTRAITS: 'portraits'
	};
	const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

	let db = null;

	/**
	 * Initialize the database, creating object stores if needed
	 */
	const init = async () => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.error('Failed to open IndexedDB:', request.error);
				reject(request.error);
			};

			request.onsuccess = async () => {
				db = request.result;
				console.log('IndexedDB initialized successfully');
				try {
					await migrateFromLocalStorage();
					resolve(db);
				} catch (error) {
					console.error('Migration failed, but database is usable:', error);
					resolve(db); // Still resolve even if migration fails
				}
			};

			request.onupgradeneeded = (event) => {
				const database = event.target.result;

				// Create object stores if they don't exist
				if (!database.objectStoreNames.contains(STORES.POKEMON_DATA)) {
					database.createObjectStore(STORES.POKEMON_DATA);
				}
				if (!database.objectStoreNames.contains(STORES.SPECIES_DATA)) {
					database.createObjectStore(STORES.SPECIES_DATA);
				}
				if (!database.objectStoreNames.contains(STORES.SEARCH_INDEX)) {
					database.createObjectStore(STORES.SEARCH_INDEX);
				}
				if (!database.objectStoreNames.contains(STORES.PORTRAITS)) {
					database.createObjectStore(STORES.PORTRAITS);
				}

				console.log('IndexedDB schema created');
			};
		});
	};

	/**
	 * Check if data is stale (older than TTL)
	 */
	const checkTTL = (cachedAt) => {
		if (!cachedAt || typeof cachedAt !== 'number') return true;
		return Date.now() - cachedAt > TTL;
	};

	/**
	 * Store data in IndexedDB
	 */
	const set = async (storeName, key, value) => {
		if (!db) {
			console.warn('StorageManager: Database not initialized. Data will not be cached.');
			return false;
		}

		try {
			return new Promise((resolve, reject) => {
				const transaction = db.transaction([storeName], 'readwrite');
				const store = transaction.objectStore(storeName);
				const request = store.put({
					value,
					cached_at: Date.now()
				}, key);

				request.onerror = () => {
					console.warn(`Failed to cache ${storeName}/${key}:`, request.error);
					reject(request.error);
				};
				request.onsuccess = () => resolve(true);
			});
		} catch (error) {
			console.warn(`StorageManager.set error for ${storeName}/${key}:`, error);
			return false;
		}
	};

	/**
	 * Retrieve data from IndexedDB with TTL checking
	 */
	const get = async (storeName, key) => {
		if (!db) {
			console.warn('StorageManager: Database not initialized. Returning null.');
			return null;
		}

		try {
			return new Promise((resolve, reject) => {
				const transaction = db.transaction([storeName], 'readonly');
				const store = transaction.objectStore(storeName);
				const request = store.get(key);

				request.onerror = () => {
					console.warn(`Failed to retrieve ${storeName}/${key}:`, request.error);
					reject(request.error);
				};
				request.onsuccess = () => {
					const result = request.result;
					if (!result) {
						resolve(null);
						return;
					}

					// Check if data is expired
					if (checkTTL(result.cached_at)) {
						// Data is stale, delete it and return null
						remove(storeName, key).catch(err =>
							console.warn(`Failed to delete expired ${storeName}/${key}:`, err)
						);
						resolve(null);
					} else {
						// Data is fresh, return the value
						resolve(result.value);
					}
				};
			});
		} catch (error) {
			console.warn(`StorageManager.get error for ${storeName}/${key}:`, error);
			return null;
		}
	};

	/**
	 * Delete a single record from IndexedDB
	 */
	const remove = async (storeName, key) => {
		if (!db) return;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([storeName], 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.delete(key);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	};

	/**
	 * Clear all expired data from a specific store
	 */
	const clearExpired = async (storeName) => {
		if (!db) return;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([storeName], 'readwrite');
			const store = transaction.objectStore(storeName);
			const getAllKeysRequest = store.getAllKeys();

			getAllKeysRequest.onerror = () => reject(getAllKeysRequest.error);
			getAllKeysRequest.onsuccess = () => {
				const keys = getAllKeysRequest.result;
				const getAllRequest = store.getAll();

				getAllRequest.onerror = () => reject(getAllRequest.error);
				getAllRequest.onsuccess = () => {
					const values = getAllRequest.result;
					const keysToDelete = [];

					// Match keys with values and check for expired data
					values.forEach((item, index) => {
						if (item && item.cached_at && checkTTL(item.cached_at)) {
							keysToDelete.push(keys[index]);
						}
					});

					if (keysToDelete.length === 0) {
						resolve();
						return;
					}

					// Delete all expired keys
					const deleteTransaction = db.transaction([storeName], 'readwrite');
					const deleteStore = deleteTransaction.objectStore(storeName);
					keysToDelete.forEach((key) => deleteStore.delete(key));

					deleteTransaction.onerror = () => reject(deleteTransaction.error);
					deleteTransaction.oncomplete = () => {
						console.log(`Cleaned ${keysToDelete.length} expired entries from ${storeName}`);
						resolve();
					};
				};
			};
		});
	};

	/**
	 * Save a portrait as a Blob in IndexedDB
	 */
	const savePortrait = async (name, blobData) => {
		if (!db) {
			console.warn('StorageManager: Database not initialized. Portrait will not be saved.');
			return false;
		}

		try {
			// Convert File to Blob if needed
			const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);

			return new Promise((resolve, reject) => {
				const transaction = db.transaction([STORES.PORTRAITS], 'readwrite');
				const store = transaction.objectStore(STORES.PORTRAITS);
				const request = store.put({
					blob,
					cached_at: Date.now()
				}, name);

				request.onerror = () => {
					console.warn(`Failed to save portrait "${name}":`, request.error);
					reject(request.error);
				};
				request.onsuccess = () => {
					console.log(`Portrait "${name}" saved successfully (${blob.size} bytes)`);
					resolve(true);
				};
			});
		} catch (error) {
			console.warn(`StorageManager.savePortrait error for "${name}":`, error);
			return false;
		}
	};

	/**
	 * Get a portrait blob and return an object URL
	 */
	const getPortraitUrl = async (name) => {
		if (!db) return null;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORES.PORTRAITS], 'readonly');
			const store = transaction.objectStore(STORES.PORTRAITS);
			const request = store.get(name);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const result = request.result;
				if (!result || !result.blob) {
					resolve(null);
					return;
				}

				// Create a URL for the blob
				const url = URL.createObjectURL(result.blob);
				resolve(url);
			};
		});
	};

	/**
	 * Migrate valid data from localStorage to IndexedDB (one-time operation)
	 */
	const migrateFromLocalStorage = async () => {
		if (!db) return;

		try {
			const keysToClean = [];
			const now = Date.now();

			// Iterate through all localStorage keys
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (!key) continue;

				// Skip theme (keep in localStorage for fast initial load)
				if (key === 'theme') continue;

				try {
					const item = JSON.parse(localStorage.getItem(key));

					// Check if item has expiry and is still valid
					if (item && item.expiry && item.expiry > now) {
						// Determine which store to put in based on key pattern
						let storeName = null;
						let storeKey = key;

						if (key.startsWith('species_')) {
							storeName = STORES.SPECIES_DATA;
						} else if (key.startsWith('pokemon_')) {
							storeName = STORES.POKEMON_DATA;
						} else if (key === 'pokemon_species_search_index') {
							storeName = STORES.SEARCH_INDEX;
						}

						if (storeName) {
							// Migrate to IndexedDB
							await set(storeName, storeKey, item.value);
							keysToClean.push(key);
						}
					} else if (item && item.expiry) {
						// Item is expired, mark for deletion
						keysToClean.push(key);
					}
				} catch (e) {
					// Invalid JSON in localStorage, mark for deletion
					keysToClean.push(key);
				}
			}

			// Clean up localStorage (remove migrated keys)
			keysToClean.forEach((key) => {
				localStorage.removeItem(key);
			});

			if (keysToClean.length > 0) {
				console.log(`Migrated and cleaned ${keysToClean.length} keys from localStorage to IndexedDB`);
			}
		} catch (error) {
			console.error('Error during localStorage migration:', error);
		}
	};

	/**
	 * Clear all data from a specific store (useful for debugging)
	 */
	const clearStore = async (storeName) => {
		if (!db) return;

		return new Promise((resolve, reject) => {
			const transaction = db.transaction([storeName], 'readwrite');
			const store = transaction.objectStore(storeName);
			const request = store.clear();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				console.log(`Cleared ${storeName}`);
				resolve();
			};
		});
	};

	/**
	 * Clear all data from all stores (useful for cache reset)
	 */
	const clearAll = async () => {
		try {
			await clearStore(STORES.POKEMON_DATA);
			await clearStore(STORES.SPECIES_DATA);
			await clearStore(STORES.SEARCH_INDEX);
			await clearStore(STORES.PORTRAITS);
			console.log('All storage cleared');
		} catch (error) {
			console.error('Error clearing all storage:', error);
		}
	};

	// Public API
	return {
		init,
		get,
		set,
		remove,
		clearExpired,
		checkTTL,
		savePortrait,
		getPortraitUrl,
		clearStore,
		clearAll,
		// Expose stores for reference
		STORES
	};
})();
