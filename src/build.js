const { copyFileSync, mkdirSync, writeFileSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function build() {
	console.log('Building single executable application...\n');

	// Ensure build directory exists
	const buildDir = path.join(__dirname, '..', 'build');
	mkdirSync(buildDir, { recursive: true });

	const outputExePath = path.join(buildDir, 'silksong-wgs-exporter.exe');
	const blobFilePath = path.join(buildDir, 'sea-prep.blob');
	const seaConfigPath = path.join(__dirname, '..', 'sea-config.json');

	console.log('1. Generating SEA blob...');
	execSync(`node --experimental-sea-config "${seaConfigPath}"`, { stdio: 'inherit' });

	console.log('\n2. Copying Node.js executable...');
	copyFileSync(process.execPath, outputExePath);

	console.log('\n3. Injecting application code...');
	execSync(
		`npx postject "${outputExePath}" NODE_SEA_BLOB "${blobFilePath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
		{ stdio: 'inherit' }
	);

	console.log('\n4. Setting executable icon and metadata...');
	const pngPath = path.join(__dirname, 'Silkeater.png');
	const iconPath = path.join(buildDir, 'icon.ico');

	if (existsSync(pngPath)) {
		try {
			const pngToIco = require('png-to-ico');
			const icoBuffer = await pngToIco(pngPath);
			writeFileSync(iconPath, icoBuffer);
			console.log('✓ Converted PNG to ICO');

			// Set icon and metadata using resedit
			console.log('⏳ Setting icon and metadata...');
			const ResEdit = require('resedit');
			const fs = require('fs');

			// Read the executable (allow unsigned/modified executables)
			const exeData = fs.readFileSync(outputExePath);
			const exe = ResEdit.NtExecutable.from(exeData, { ignoreCert: true });
			const res = ResEdit.NtExecutableResource.from(exe);

			const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
			ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
				res.entries,
				1, // Icon ID
				1033, // Language (English US)
				iconFile.icons.map((icon) => icon.data)
			);

			// Set version info
			const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
			const vi = viList[0] || ResEdit.Resource.VersionInfo.createEmpty();

			vi.setStringValues(
				{ lang: 1033, codepage: 1200 },
				{
					ProductName: 'Silksong WGS Exporter',
					FileDescription: 'Export Hollow Knight/Silksong saves from Game Pass',
					CompanyName: 'Sai Kishore Komanduri',
					LegalCopyright: 'MIT License',
					OriginalFilename: 'silksong-wgs-exporter.exe',
					FileVersion: '1.0.0.0',
					ProductVersion: '1.0.0.0',
				}
			);

			vi.removeStringValue({ lang: 1033, codepage: 1200 }, 'PrivateBuild');
			vi.removeStringValue({ lang: 1033, codepage: 1200 }, 'SpecialBuild');
			vi.setFileVersion(1, 0, 0, 0, 1033);
			vi.setProductVersion(1, 0, 0, 0, 1033);
			vi.outputToResourceEntries(res.entries);

			// Write changes back
			res.outputResource(exe);
			const newExe = Buffer.from(exe.generate());
			fs.writeFileSync(outputExePath, newExe);

			console.log('✓ Icon and metadata set successfully');
		} catch (err) {
			console.warn('⚠ Failed to set icon:', err.message);
			console.warn('Continuing without icon...');
		}
	} else {
		console.warn('⚠ Silkeater.png not found, skipping icon setup');
	}

	console.log(`\n✅ Build complete! Created ${path.relative(process.cwd(), outputExePath)}`);
}

build().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
