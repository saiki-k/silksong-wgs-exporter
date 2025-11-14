const path = require('path');
const chalk = require('chalk');
const { scanWGSPackages, scanPackageContainers } = require('../scanner');
const { exportContainers } = require('../exporter');
const { getTransformer } = require('../exporter/transformers');
const {
	displayPackagesTable,
	displayContainerSummaryTable,
	displayContainerFilesTable,
	promptPackageSelection,
	promptExportConfirmation,
	promptExportDestination,
	displayExportResults,
} = require('./helpers');

async function runCLI() {
	console.log(chalk.bold.cyan('\n' + '='.repeat(80)));
	console.log(chalk.bold.cyan('Windows Gaming Services - Save File Exporter'));
	console.log(chalk.bold.cyan('='.repeat(80)));

	try {
		const { packages, basePath } = scanWGSPackages();
		console.log(chalk.bold(`\n🔍 Scanning for WGS packages in: ${chalk.gray(basePath)}`));

		if (packages.length === 0) {
			console.log(chalk.red('\n✗ No WGS packages found.'));
			console.log(chalk.yellow('Make sure you have Game Pass games installed.'));
			waitForExit();
			return;
		}

		console.log(chalk.green(`\n✓ Found ${packages.length} package(s) with WGS data`));
		displayPackagesTable(packages);

		const selectedPackage = await promptPackageSelection(packages);
		const packagePath = path.join(basePath, selectedPackage.packageName);
		console.log(chalk.bold(`\n📦 Selected: ${chalk.cyan(packagePath)}`));

		const containerFolder = path.dirname(selectedPackage.containersIndexPath);
		const shortPath = path.relative(packagePath, containerFolder);
		console.log(chalk.bold(`\n🔍 Scanning containers in: ${chalk.gray(shortPath)}`));
		const scanData = scanPackageContainers(selectedPackage.containersIndexPath);

		if (!scanData.entries || scanData.entries.length === 0) {
			console.log(chalk.red('\n✗ No containers found in this package.'));
			waitForExit();
			return;
		}

		console.log(chalk.green(`\n✓ Found ${scanData.entries.length} container(s)`));
		displayContainerSummaryTable(scanData.entries);

		displayContainerFilesTable(scanData.entries);

		const availableTransformer = getTransformer(selectedPackage.packageName);
		const { shouldExport, useTransformer } = await promptExportConfirmation(availableTransformer);

		if (!shouldExport) {
			console.log(chalk.yellow('\n⊘ Export cancelled.'));
			waitForExit();
			return;
		}

		let transformer = null;
		if (useTransformer && availableTransformer) {
			transformer = availableTransformer.transformer;
			const transformerName = availableTransformer.name;
			const transformerColor = availableTransformer.color || 'green';
			console.log(chalk.bold.green(`\n✓ Using ${chalk[transformerColor](transformerName)} transformer`));
		} else {
			console.log(chalk.bold.yellow('\n● Using generic export'));
		}

		const defaultExportPath = path.join(process.cwd(), 'exported_save_files');
		const exportPath = await promptExportDestination(defaultExportPath);

		console.log(chalk.bold(`\n📤 Exporting to: ${chalk.cyan(exportPath)}`));
		const results = exportContainers(scanData, exportPath, transformer);

		displayExportResults(results);

		if (results.exported.length > 0) {
			console.log(chalk.bold.green(`\n✓ Export complete! Files saved to: ${exportPath}`));
		} else {
			console.log(chalk.bold.yellow('\n● No files were exported.'));
		}

		waitForExit();
	} catch (error) {
		console.error(chalk.red(`\n✗ Error: ${error.message}`));
		console.error(chalk.gray(error.stack));
		waitForExit();
		process.exit(1);
	}
}

function waitForExit() {
	console.log(chalk.gray('\nPress Enter to exit...'));
	process.stdin.setRawMode(false);
	process.stdin.resume();
	process.stdin.once('data', () => {
		process.exit(0);
	});
}

module.exports = { runCLI };
