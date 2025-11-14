# Hollow Knight / Hollow Knight: Silksong Transformer

This transformer handles the specific file structure expected by the Steam version of Hollow Knight and Hollow Knight: Silksong.

## File Organization

| Container               | File Pattern           | Destination                            |
| ----------------------- | ---------------------- | -------------------------------------- |
| SharedData              | sharedData.dat         | `exported_save_files/shared.dat`       |
| Save1, Save2, ...       | user\*.dat             | `exported_save_files/user*.dat`        |
| Restore1, Restore2, ... | user\*.dat             | `exported_save_files/user*.dat`        |
| Restore1, Restore2, ... | NODELrestoreData\*.dat | `exported_save_files/Restore_Points#/` |

## Encryption Handling

### SharedData File

-   **WGS Format**: Plain JSON
-   **Steam Format**: Encrypted .dat format
-   **Transformer Logic**:
    -   Checks for existing encryption using C# header detection
    -   Encrypts if needed using AES-256-ECB with game-specific key

### Save Files

-   Already encrypted by WGS
-   Copied directly without modification

## Codec (codec.js)

Handles AES-256-ECB encryption/decryption with C# binary header format:

```javascript
const { encodeData, decodeData, CSHARP_HEADER } = require('./codec');

// Encrypt JSON to .dat format
const encryptedBytes = encodeData(jsonString);

// Decrypt .dat to JSON
const jsonString = decodeData(fileBytes);

// Check if file is already encrypted
const isEncrypted = fileContent.subarray(0, CSHARP_HEADER.length).equals(CSHARP_HEADER);
```

### Header Format

```
[22-byte C# header]
[Variable-length encoded length]
[Base64-encoded encrypted data]
[1-byte terminator: 0x0b]
```

### Encryption Details

-   **Algorithm**: AES-256-ECB
-   **Key**: Game-specific (stored in codec.js)
-   **Padding**: PKCS7 (automatic)

## Usage

The transformer is automatically selected when exporting saves for:

-   `TeamCherry.15373CD61C66B_y4jvztpgccj42` (Hollow Knight)
-   `TeamCherry.HollowKnightSilksong_y4jvztpgccj42` (Hollow Knight: Silksong)

## Export Example

```javascript
const { exportContainers } = require('../../');
const { getTransformer } = require('../');

const transformer = getTransformer('TeamCherry.15373CD61C66B_y4jvztpgccj42');
const results = exportContainers(scanData, './output_dir', transformer.transformer);
```

## Output Structure

```
exported_save_files/
├── shared.dat              # SharedData container (encrypted)
├── user1.dat               # Save1/Restore1 user files
├── user2.dat               # Save2/Restore2 user files
├── user3.dat               # Save3/Restore3 user files
├── user4.dat               # Save4/Restore4 user files
└── Restore_Points1/        # Restore1 container
    ├── NODELrestoreData1.dat
    └── ...
```
