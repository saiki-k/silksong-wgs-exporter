# Scanner Module

The scanner module handles discovery and parsing of Windows Gaming Services (WGS) container files.

## Overview

Windows Gaming Services stores game data in encrypted containers. The scanner module:

-   Discovers all WGS packages in `AppData/Local/Packages`
-   Parses `containers.index` files to extract container metadata
-   Reads individual container files to enumerate save files

## Usage

```javascript
const { scanWGSPackages, scanPackageContainers } = require('./scanner');

// Discover all WGS packages
const packages = scanWGSPackages();

// Scan a specific package for detailed container info
const scanData = scanPackageContainers(packages[0].containers_index_path);
```

## WGS Container Structure

```
WGS_Directory/
├── containers.index             # Master index (what we parse)
├── {GUID-1}/                    # Container folder (no dashes in name)
│   ├── container.5              # Container metadata
│   └── {FILE-GUID}              # Actual save file (named by GUID)
├── {GUID-2}/
│   ├── container.6
│   └── {FILE-GUID}
└── ...
```

## File Format Details

### containers.index Format

The master index file uses **length-prefixed string format** with UTF-16LE encoding:

```
[4 bytes: length] [2×length bytes: UTF-16LE string data]

Example - "hello" (5 characters):
  05 00 00 00  68 00  65 00  6C 00  6C 00  6F 00
  ^^^^^^^^^^^  ^^^^^  ^^^^^  ^^^^^  ^^^^^  ^^^^^
  Length = 5     h      e      l      l      o
```

**Header Structure:**

-   Bytes 0-3: Version number (4 bytes, little-endian)
-   Bytes 4-7: Container count (4 bytes, little-endian)
-   Bytes 8-11: Unknown/reserved field
-   Bytes 12+: Package name (length-prefixed UTF-16LE string)
-   Following: Timestamp (8 bytes, Windows FILETIME)
-   Following: Secondary count field (4 bytes)
-   Following: Container ID (length-prefixed UTF-16LE string)

**Container Entry Structure:**

Two formats are supported:

**Format 1 (Silksong):**
1. Display name (length-prefixed UTF-16LE string, e.g., "save1")
2. Display name duplicate (same value, repeated)
3. Identifier (length-prefixed UTF-16LE string, e.g., "0x...")
4. Container number (1 byte)
5. Unknown padding (4 bytes)
6. Container GUID (16 bytes, binary, mixed-endian)

**Format 2 (Hollow Knight):**
1. Display name (length-prefixed UTF-16LE string, e.g., "Preferences")
2. Padding (4 bytes: 00 00 00 00)
3. Identifier (length-prefixed UTF-16LE string, e.g., "0x...")
4. Container number (1 byte)
5. Unknown padding (4 bytes)
6. Container GUID (16 bytes, binary, mixed-endian)

### container.# Files

Individual container files in GUID subdirectories:

```
[4 bytes: version]
[4 bytes: file count]
[160-byte entries × file count]:
  - 128 bytes: UTF-16LE null-terminated filename (padded)
  - 16 bytes: GUID (identifies actual save file)
  - 16 bytes: GUID duplicate (same value)
```

## Pattern Matching Algorithm

Since the complete WGS format specification isn't public, the scanner uses **pattern-matching**:

1. Scans every byte position in containers.index as a potential container entry
2. Attempts to parse multiple format variants at each position
3. Validates by checking if the identifier starts with "0x"
4. Filters duplicates based on GUID (not offset, as same container may match multiple formats)
5. Sorts results by order of appearance

This brute-force approach ensures all container entries are found regardless of variable-length fields, unknown padding, or format variations between games.

## GUID Format Handling

GUIDs in WGS containers use **mixed-endian byte ordering**:

```
GUID in text: FA22B52C-35CB-4C3C-9EEB-A2B4D5D6AD11
Binary bytes: 2C B5 22 FA CB 35 3C 4C 9E EB A2 B4 D5 D6 AD 11
              └─────────┘ └───┘ └───┘ └───┘ └───────────────┘
              Little-endian │     │     │   Big-endian
              (reversed)    │     │     └─> Big-endian
                            │     └────> Little-endian
                            └─────────> Little-endian
```

**First 3 sections** (4+2+2 bytes): Little-endian (bytes reversed)  
**Last 2 sections** (2+6 bytes): Big-endian (bytes in order)

## Directory Name Mapping

Container folders are named using their GUID **without dashes**:

```
GUID in index:     A25851B1-62E1-4AB2-A61A-2A3DC07387AB
Folder name:       A25851B162E14AB2A61A2A3DC07387AB
```

## Timestamp Conversion

Windows FILETIME format:

-   **64-bit integer** (big-endian in file)
-   **100-nanosecond intervals** since January 1, 1601 UTC

Conversion to JavaScript Date:

```javascript
const EPOCH_DIFF = 116444736000000000n; // Difference between 1601 and 1970
const INTERVALS_PER_MS = 10000n; // 100ns intervals per millisecond
const unixTime = (fileTime - EPOCH_DIFF) / INTERVALS_PER_MS;
return new Date(Number(unixTime)).toISOString();
```

## API Reference

### `scanWGSPackages()`

Scans all packages in `AppData/Local/Packages` for WGS containers.

**Returns:** Object containing `{ packages, basePath }` where packages is an array of package information:

-   `packageName` - Full package directory name
-   `displayName` - Friendly package name
-   `containersIndexPath` - Path to containers.index file
-   `containerCount` - Number of containers
-   `timestamp` - Last modified timestamp
-   `wgsFolder` - WGS subfolder name

### `scanPackageContainers(containersIndexPath)`

Scans a specific package for detailed container information.

**Parameters:**

-   `containersIndexPath` (string) - Path to containers.index file

**Returns:** Object containing:

-   Header fields (version, containerCount, packageName, timestamp, containerId)
-   `wgsBasePath` - Base WGS directory path
-   `entries` array - Detailed container entries with:
    -   `displayName` - Container name (e.g., "save1")
    -   `folderName` - GUID folder name (no dashes)
    -   `guid` - Container GUID
    -   `containerData` - Parsed file metadata:
        -   `version` - Container version
        -   `fileCount` - Number of files
        -   `files` - Array of file entries:
            -   `filename` - Logical filename
            -   `guid` - File GUID
            -   `fileGuid` - File GUID without dashes
            -   `size` - File size in bytes

## Module Structure

-   `index.js` - Package discovery and orchestration
-   `containerIndexScanner.js` - Parses containers.index files
-   `containerScanner.js` - Parses individual container.* files
