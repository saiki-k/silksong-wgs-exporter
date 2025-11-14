# WGS Inspector

[Download](../../releases) • [Report Bugs](../../issues)

Export save files from **Windows Gaming Services** (Game Pass) to a readable format.

Game Pass stores save files in obfuscated WGS containers with cryptic directory names (GUIDs), making them inaccessible. This tool extracts and exports your saves, with special support for games like:

-   **Hollow Knight: Silksong** - Converts to Steam-compatible format
-   **Hollow Knight** - Exports with proper naming
-   **Any other Game Pass game** - Generic export with container/file structure preserved

## 🚀 Quick Setup

You can either use the pre-built standalone executable or run the project from source.

### Use the standalone executable (Recommended)

1. Download and extract `wgs-inspector-windows.zip` from the [latest release](../../releases)

2. Run `wgs-inspector.exe`

3. Select your game from the interactive menu

4. Choose export method:

    - **Game-specific transformer** (if available) - Converts to proper format with meaningful filenames
    - **Generic export** - Raw files with original container structure

5. Find your saves in `exported_save_files/` (or your chosen directory)

### Run from source

1. **Install Node.js (v20.6.0 or higher)**: Download from [nodejs.org](https://nodejs.org)

2. **Clone and install dependencies**:

    ```bash
    git clone --depth 1 https://github.com/saiki-k/wgs-inspector.git
    cd wgs-inspector
    npm install
    ```

3. **Run the exporter**:

    ```bash
    node src/index.js
    ```

## 📁 Export Formats

### With Transformer (Silksong)

When a game-specific transformer is available, saves are converted to the expected format:

```
exported_save_files/
├── user1.dat                    # Save slot 1
├── user2.dat                    # Save slot 2
├── shared.dat                   # Shared game data (encrypted for Steam)
├── Restore_Points1/             # Restore points for slot 1
│   ├── NODELrestoreData1.dat
│   └── restoreData2.dat
└── Restore_Points2/             # Restore points for slot 2
    └── NODELrestoreData2.dat
```

### Generic Export

For games without a transformer, files are exported with their container structure:

```
exported_save_files/
├── save1/
│   └── user.dat
├── save2/
│   └── user.dat
└── Preferences/
    └── settings.json
```

## 🛠️ Building from Source

Run the following command to create a standalone executable:

```bash
npm run build
```

The executable and zip package will be created in the `build/` directory. Requires Node.js v20.6.0 or higher.

## 🔧 Project Structure

```
src/
├── index.js                     # Entry point
├── cli/                         # Interactive CLI
│   ├── index.js                 # Main CLI flow
│   └── helpers.js               # Display & prompt functions
├── scanner/                     # WGS file parsers
│   ├── index.js                 # Public scanner API
│   ├── containerIndexScanner.js # Parses containers.index
│   └── containerScanner.js      # Parses container.* files
├── exporter/                    # Export logic
│   ├── index.js                 # Generic exporter
│   └── transformers/            # Game-specific exporters
│       ├── index.js             # Exporter registry
│       └── hollowKnight/        # Hollow Knight / Hollow Knight: Silksong exporter
└── build/                       # Build scripts
```

## 🤝 Contributing

Contributions welcome! Feel free to open an issue or submit a pull request.

### Adding Game Support

To add a game-specific exporter for a new game:

1. Create a new exporter in `src/exporter/transformers/your-game/`
2. Export an object with `{ name, color, transformer }`
3. Register it in `src/exporter/transformers/index.js`

See `src/exporter/transformers/hollowKnight/` for a reference implementation.

## 📄 License

MIT © [saiki-k](https://github.com/saiki-k)
