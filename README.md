# Hollow Knight: Silksong Game Pass Save Exporter

[Download](../../releases) • [Documentation](src/TECHNICAL.md) • [Report Bugs](../../issues)

Export your **Hollow Knight: Silksong** saves from Game Pass to Steam-compatible format.

Game Pass stores save files in obfuscated containers with weird directory names, making them inaccessible without knowing what's what. Steam, on the other hand, is a darling - you immediately know what `user1.dat` is. This tool bridges that gap, extracting your saves into the familiar Steam format.

I haven't tested it, but this should work with **Hollow Knight** saves as well.

## 🚀 Quick Setup

You can either use the pre-built standalone executable or run the project from source.

### Use the standalone executable (Recommended)

1. **Download and extract** `silksong-wgs-exporter-windows.zip` from the [latest release](../../releases)

2. **Run the executable**

3. Find your saves in the `exported_save_files/` folder, created in the same directory as the executable

### Run from source

1. **Install Node.js (v20.6.0 or higher)**: Download from [nodejs.org](https://nodejs.org)

2. **Clone and install dependencies**:

    ```bash
    git clone --depth 1 https://github.com/saiki-k/silksong-wgs-exporter.git
    cd silksong-wgs-exporter
    npm install
    ```

3. **Run the exporter**:

    ```bash
    node src/index.js
    ```

## 📁 What gets exported

Your Game Pass save files are extracted and organized into the familiar Steam format.

For whatever weird reason, the `shared.dat` counterpart (`sharedData.dat`) from Game Pass is stored decrypted (as JSON). This exporter converts it back into the encrypted `.dat` format, as expected by Steam.

```
exported_save_files/
├── user1.dat                                  # Save slot 1
├── user2.dat                                  # Save slot 2 (if it exists)
├── ...
├── shared.dat                                 # Shared game data (encrypted for Steam compatibility)
└── Restore_Points1/                           # Restore points for Save slot 1 (if it exists)
    ├── NODELrestoreData1.dat
	├── restoreData2.dat
	└── ...
└── Restore_Points2/                           # Restore points for Save slot 2 (if it exists)
	├── NODELrestoreData2.dat
	└── ...
└── ...
```

## 🛠️ Building from Source

Run the following command to create a standalone executable:

```bash
npm run build
```

The executable and zip package will be created in the `build/` directory. Requires Node.js v20.6.0 or higher.

## 📚 Documentation

For technical details about the WGS container format and API reference, see [src/TECHNICAL.md](src/TECHNICAL.md).

## 🤝 Contributing

Contributions welcome! Feel free to open an issue or submit a pull request.

### 📄 License

MIT © [saiki-k](https://github.com/saiki-k)
