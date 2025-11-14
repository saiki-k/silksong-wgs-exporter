# Exporter Module

The exporter module handles copying and transforming WGS container files to user-friendly save file formats.

## Overview

The exporter provides:

-   **Generic export** - Copies files with original structure (`<container-name>/<filename>`)
-   **Game-specific transformers** - Applies custom file organization and encryption for specific games
-   **Extensible system** - Easy to add new game transformers

## Usage

```javascript
const { exportContainers } = require('./exporter');
const { getTransformer } = require('./exporter/transformers');

// Get transformer for a specific package (if available)
const transformer = getTransformer('TeamCherry.HollowKnightSilksong_y4jvztpgccj42');

// Export with transformer (or null for generic export)
const results = exportContainers(scanData, './output_dir', transformer);

console.log(`Exported: ${results.exported.length}`);
console.log(`Errors: ${results.errors.length}`);
```

## Generic Export

Without a transformer, files are exported as:

```
output_dir/
├── Save1/
│   ├── user1.dat
│   ├── user2.dat
│   └── user3.dat
├── Restore1/
│   └── user1.dat
└── SharedData/
    └── sharedData.dat
```

## Transformers

Game-specific transformers reorganize files to match the expected format for that game's Steam/other versions.

### Adding a Transformer

1. Create a folder: `transformers/<game-name>/`
2. Create `index.js` that exports `{ name, color, transformer }`
3. Register in `transformers/index.js`:

```javascript
const TRANSFORMER_MAP = {
	'Package.Name_identifier': require('./game-name'),
};
```

### Transformer Export Structure

Each transformer exports an object with:

```javascript
module.exports = {
	name: 'Game Name (Platform)', // Display name for CLI
	color: 'magenta', // Chalk color for display
	transformer: function (scanData, destinationDir, results) {
		// Your export logic here
		return results;
	},
};
```

**Transformer Function Parameters:**

-   `scanData` - Parsed container data from scanner
-   `destinationDir` - Export destination path
-   `results` - Object to populate with exported/skipped/errors

### Available Transformers

-   **Hollow Knight / Hollow Knight: Silksong** - See [transformers/hollowKnight/README.md](transformers/hollowKnight/README.md)

## Export Results

The exporter returns:

```javascript
{
  exported: [
    {
      container: 'save1',
      file: 'user1.dat',
      path: '/full/path/to/file.dat',
      relativePath: 'user1.dat'
    }
  ],
  skipped: [
    {
      container: 'unknown',
      file: 'data.bin',
      reason: 'Unknown container type'
    }
  ],
  errors: [
    {
      file: 'user2.dat',
      reason: 'File not found in source'
    }
  ]
}
```

## Module Structure

```
exporter/
├── index.js                    # Generic export logic
└── transformers/
    ├── index.js                # Transformer registry
    └── hollowKnight/
        ├── index.js            # Hollow Knight / Silksong transformer
        ├── codec.js            # Encryption/decryption utilities
        └── README.md           # Transformer documentation
```

## API Reference

### `exportContainers(scanData, destinationDir, transformer)`

Exports container files to destination directory.

**Parameters:**

-   `scanData` (Object) - Scanned container data from scanner module
-   `destinationDir` (string) - Base directory for exports
-   `transformer` (Function|null) - Optional transformer function

**Returns:** Object with `exported`, `skipped`, and `errors` arrays

### `getTransformer(packageName)`

Gets the transformer for a specific package.

**Parameters:**

-   `packageName` (string) - Full package name

**Returns:** Object with `{ name, color, transformer }` or `null` if no transformer exists no transformer exists
