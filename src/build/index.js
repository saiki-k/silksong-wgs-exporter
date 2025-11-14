const { copyFileSync, mkdirSync, writeFileSync, unlinkSync, rmSync, existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function build() {
	console.log('Building single executable application...\n');

	const buildDir = path.join(__dirname, '..', '..', 'dist');
	mkdirSync(buildDir, { recursive: true });

	const outputExePath = path.join(buildDir, 'wgs-inspector.exe');
	const blobFilePath = path.join(buildDir, 'sea-prep.blob');
	const bundledPath = path.join(buildDir, 'bundled.js');
	const seaConfigPath = path.join(buildDir, 'sea-config.json');

	const packageJson = require('../../package.json');
	const version = packageJson.version;

	console.log('\n1. Bundling application with dependencies using ncc...');
	execSync(`npx ncc build src/index.js -o dist/ncc-output`, { stdio: 'inherit' });

	copyFileSync(path.join(buildDir, 'ncc-output', 'index.js'), bundledPath);

	const seaConfig = {
		main: bundledPath,
		output: blobFilePath,
		disableExperimentalSEAWarning: true,
	};
	writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, '\t'));

	console.log('\n2. Generating SEA blob...');
	execSync(`node --experimental-sea-config "${seaConfigPath}"`, { stdio: 'inherit' });

	console.log('\n3. Copying Node.js executable...');
	copyFileSync(process.execPath, outputExePath);

	console.log('\n4. Injecting application code...');
	execSync(
		`npx postject "${outputExePath}" NODE_SEA_BLOB "${blobFilePath}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
		{ stdio: 'inherit' }
	);

	console.log('\n5. Setting executable icon and metadata...');
	const pngPath = path.join(__dirname, 'assets', 'Silkeater.png');
	const iconPath = path.join(buildDir, 'icon.ico');

	if (existsSync(pngPath)) {
		try {
			const pngToIco = require('png-to-ico');
			const icoBuffer = await pngToIco(pngPath);
			writeFileSync(iconPath, icoBuffer);
			console.log('✓ Converted PNG to ICO');

			console.log('⏳ Setting icon and metadata...');
			const ResEdit = require('resedit');
			const fs = require('fs');

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

			const versionParts = version.split('.').map(Number);

			vi.setStringValues(
				{ lang: 1033, codepage: 1200 },
				{
					ProductName: 'WGS Inspector',
					FileDescription: 'Export Game Pass (WGS) saves to compatible formats',
					CompanyName: 'Sai Kishore Komanduri',
					LegalCopyright: 'MIT License',
					OriginalFilename: 'wgs-inspector.exe',
					FileVersion: `${version}.0`,
					ProductVersion: `${version}.0`,
				}
			);

			vi.removeStringValue({ lang: 1033, codepage: 1200 }, 'PrivateBuild');
			vi.removeStringValue({ lang: 1033, codepage: 1200 }, 'SpecialBuild');
			vi.setFileVersion(versionParts[0] || 1, versionParts[1] || 0, versionParts[2] || 0, 0, 1033);
			vi.setProductVersion(versionParts[0] || 1, versionParts[1] || 0, versionParts[2] || 0, 0, 1033);
			vi.outputToResourceEntries(res.entries);

			res.outputResource(exe);
			const newExe = Buffer.from(exe.generate());
			fs.writeFileSync(outputExePath, newExe);

			console.log('✓ Icon and metadata set successfully');
		} catch (err) {
			console.warn('⚠  Failed to set icon:', err.message);
			console.warn('Continuing without icon...');
		}
	} else {
		console.warn('⚠  Silkeater.png not found, skipping icon setup');
	}

	console.log('\n6. Creating distribution package (zip archive)...');

	const extension = process.platform === 'win32' ? '.exe' : '';
	const distDirName = `wgs-inspector`;
	const distDir = path.join(buildDir, distDirName);
	mkdirSync(distDir, { recursive: true });

	const distExePath = path.join(distDir, `wgs-inspector${extension}`);
	copyFileSync(outputExePath, distExePath);

	const AdmZip = require('adm-zip');
	const zip = new AdmZip();
	zip.addLocalFolder(distDir);
	const zipPath = path.join(buildDir, `${distDirName}-v${version}.zip`);
	zip.writeZip(zipPath);

	console.log('\n7. Cleaning up temporary files...');
	existsSync(seaConfigPath) && unlinkSync(seaConfigPath);
	existsSync(blobFilePath) && unlinkSync(blobFilePath);
	existsSync(bundledPath) && unlinkSync(bundledPath);
	rmSync(path.join(buildDir, 'ncc-output'), { recursive: true, force: true });
	existsSync(outputExePath) && unlinkSync(outputExePath);
	existsSync(iconPath) && unlinkSync(iconPath);

	console.log(`\n✅ Build complete!`);
	console.log(`Executable: ${path.relative(process.cwd(), distExePath)}`);
	console.log(`Package: ${path.relative(process.cwd(), zipPath)}`);
}

build().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
