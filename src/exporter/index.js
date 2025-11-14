const fs = require('fs');
const path = require('path');

/**
 * Export container files to destination directory
 * @param {Object} scanData - Scanned container data from scanner
 * @param {string} destinationDir - Base directory for exports
 * @param {Function|null} transformer - Optional transformer function
 * @returns {Object} Export results
 */
function exportContainers(scanData, destinationDir, transformer = null) {
	const results = {
		exported: [],
		skipped: [],
		errors: [],
	};

	if (!fs.existsSync(destinationDir)) {
		fs.mkdirSync(destinationDir, { recursive: true });
	}

	const resolvedDestDir = path.resolve(destinationDir);
	const wgsBasePath = scanData.wgsBasePath;

	if (!wgsBasePath) {
		throw new Error('WGS base path not found in scan data');
	}

	if (transformer && typeof transformer === 'function') {
		return transformer(scanData, resolvedDestDir, results);
	}

	for (const entry of scanData.entries) {
		const containerName = entry.displayName;
		const folderName = entry.folderName;

		if (!entry.containerData || !entry.containerData.files) {
			results.skipped.push({ container: containerName, reason: 'No file data' });
			continue;
		}

		const containerDestDir = path.join(resolvedDestDir, containerName);
		if (!fs.existsSync(containerDestDir)) {
			fs.mkdirSync(containerDestDir, { recursive: true });
		}

		const containerSourceDir = path.join(wgsBasePath, folderName);

		for (const fileEntry of entry.containerData.files) {
			const filename = fileEntry.filename;
			if (!filename) {
				results.skipped.push({ container: containerName, file: '(no name)', reason: 'Missing filename' });
				continue;
			}

			const fileGuid = fileEntry.fileGuid || fileEntry.guid.toUpperCase().replace(/-/g, '');
			const sourcePath = path.join(containerSourceDir, fileGuid);

			if (!fs.existsSync(sourcePath)) {
				results.errors.push({ file: filename, reason: 'File not found in source' });
				continue;
			}

			const destPath = path.join(containerDestDir, filename);

			try {
				fs.copyFileSync(sourcePath, destPath);
				const relativePath = path.relative(resolvedDestDir, destPath);
				results.exported.push({
					container: containerName,
					file: filename,
					path: destPath,
					relativePath: relativePath,
				});
			} catch (err) {
				results.errors.push({ file: filename, reason: err.message });
			}
		}
	}

	return results;
}

/**
 * Get source file path for a container file
 * @param {Object} containerEntry - Container entry from scan data
 * @param {Object} fileEntry - File entry from container data
 * @param {string} wgsBasePath - Base WGS directory path
 * @returns {string} Source file path
 */
function getSourceFilePath(containerEntry, fileEntry, wgsBasePath) {
	const folderName = containerEntry.folderName;
	const fileGuid = fileEntry.fileGuid || fileEntry.guid.toUpperCase().replace(/-/g, '');
	return path.join(wgsBasePath, folderName, fileGuid);
}

module.exports = {
	exportContainers,
	getSourceFilePath,
};
