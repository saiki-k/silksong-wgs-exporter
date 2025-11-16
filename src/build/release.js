const { execSync } = require('child_process');
const { version } = require('../../package.json');

const tag = `v${version}`;

console.log(`Creating release tag: ${tag}...`);

try {
	const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
	if (currentBranch !== 'main' && currentBranch !== 'master') {
		console.error(`\n✗ Releases can only be created from main or master branch. Currently on: ${currentBranch}`);
		process.exit(1);
	}

	const status = execSync('git status --porcelain', { encoding: 'utf-8' });
	if (status.trim()) {
		console.error('\n✗ Working directory is dirty. Commit or stash changes before releasing.');
		process.exit(1);
	}

	// Check if local branch is up-to-date with remote
	try {
		execSync('git fetch', { stdio: 'pipe' });
		const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
		const remoteCommit = execSync('git rev-parse @{u}', { encoding: 'utf-8' }).trim();

		if (localCommit !== remoteCommit) {
			const base = execSync('git merge-base HEAD @{u}', { encoding: 'utf-8' }).trim();

			if (base === localCommit) {
				console.error('\n✗ Local branch is behind remote. Pull changes before releasing.');
				process.exit(1);
			} else if (base !== remoteCommit) {
				console.error('\n✗ Local and remote branches have diverged. Resolve conflicts before releasing.');
				process.exit(1);
			}
			// If base === remoteCommit, we're ahead, which is fine
		}
	} catch (error) {
		console.warn('⚠ Could not verify remote branch status (no upstream configured?)');
	}

	try {
		execSync(`git tag -d ${tag}`, { stdio: 'inherit' });
		console.log(`Deleted local tag ${tag}`);
	} catch (error) {
		console.log(`Local tag ${tag} does not exist`);
	}

	try {
		execSync(`git push origin :refs/tags/${tag}`, { stdio: 'inherit' });
		console.log(`Deleted remote tag ${tag}`);
	} catch (error) {
		console.log(`Remote tag ${tag} does not exist`);
	}

	execSync('git push origin', { stdio: 'inherit' });
	console.log('Pushed commits to origin');

	execSync(`git tag ${tag}`, { stdio: 'inherit' });
	console.log(`Created tag ${tag}`);

	execSync(`git push origin ${tag}`, { stdio: 'inherit' });
	console.log(`Pushed tag ${tag} to origin`);

	console.log(`\n✓ Release ${tag} created successfully!`);
} catch (error) {
	console.error(`\n✗ Failed to create release: ${error.message}`);
	process.exit(1);
}
