/**
 * Map of package names to their transformer modules
 * Add new game transformers here
 */
const TRANSFORMER_MAP = {
	// Hollow Knight: Silksong
	'TeamCherry.HollowKnightSilksong_y4jvztpgccj42': require('./hollowKnight'),
	'TeamCherry.15373CD61C66B_y4jvztpgccj42': require('./hollowKnight'),
};

/**
 * Get transformer for a package
 * @param {string} packageName - Full package name
 * @returns {Function|null} Transformer function or null if no transformer exists
 */
function getTransformer(packageName) {
	return TRANSFORMER_MAP[packageName] || null;
}

/**
 * Check if a transformer exists for a package
 * @param {string} packageName - Full package name
 * @returns {boolean} True if transformer exists
 */
function hasTransformer(packageName) {
	return packageName in TRANSFORMER_MAP;
}

module.exports = {
	getTransformer,
	hasTransformer,
	TRANSFORMER_MAP,
};
