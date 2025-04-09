#!/usr/bin/env node

/**
 * this script handles the release process for the package
 * it bumps the version, creates a changelog, and publishes to npm
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const semver = require('semver');

// utility to run commands and log them
const run = (cmd) => {
  console.log(`\n> ${cmd}\n`);
  return execSync(cmd, { stdio: 'inherit' });
};

// utility to create CLI prompts
const prompt = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// ensure the working directory is clean
const ensureCleanWorkingDirectory = () => {
  try {
    const status = execSync('git status --porcelain').toString().trim();
    if (status !== '') {
      console.error('Error: Working directory is not clean. Please commit or stash your changes before releasing.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking git status:', error.message);
    process.exit(1);
  }
};

// get the current version from package.json
const getCurrentVersion = () => {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
  return packageJson.version;
};

// update version in package.json
const updateVersion = (newVersion) => {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
};

// main release process
const release = async () => {
  try {
    // check if we're on main/master branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== 'main' && currentBranch !== 'master') {
      console.error(`Error: You need to be on the main/master branch to release. Currently on ${currentBranch}.`);
      process.exit(1);
    }

    // ensure working directory is clean
    ensureCleanWorkingDirectory();

    // ensure dependencies are installed
    run('yarn install --frozen-lockfile');

    // run tests to make sure everything is working
    run('yarn test');

    // build the package
    run('yarn build');

    // get current version and suggest next version
    const currentVersion = getCurrentVersion();
    console.log(`Current version: ${currentVersion}`);

    const suggestedVersion = {
      patch: semver.inc(currentVersion, 'patch'),
      minor: semver.inc(currentVersion, 'minor'),
      major: semver.inc(currentVersion, 'major'),
    };

    console.log('\nSuggested versions:');
    console.log(`- Patch: ${suggestedVersion.patch} (bug fixes)`);
    console.log(`- Minor: ${suggestedVersion.minor} (new features, backwards compatible)`);
    console.log(`- Major: ${suggestedVersion.major} (breaking changes)`);

    // get the version to release
    let newVersion = await prompt('\nWhat version would you like to release? ');
    
    if (!newVersion) {
      newVersion = suggestedVersion.patch;
      console.log(`Defaulting to patch version: ${newVersion}`);
    }

    if (!semver.valid(newVersion)) {
      console.error(`Error: Invalid version "${newVersion}".`);
      process.exit(1);
    }

    // confirm release
    const confirm = await prompt(`\nRelease version ${newVersion}? (y/N) `);
    if (confirm.toLowerCase() !== 'y') {
      console.log('Release cancelled.');
      process.exit(0);
    }

    // update version in package.json
    updateVersion(newVersion);

    // generate changelog
    try {
      run('npx conventional-changelog -p angular -i CHANGELOG.md -s');
    } catch (error) {
      console.warn('Warning: Could not generate changelog. Continuing without it.');
    }

    // commit version change and changelog
    run(`git add package.json CHANGELOG.md`);
    run(`git commit -m "chore(release): ${newVersion}"`);

    // create git tag
    run(`git tag v${newVersion}`);

    // push changes and tags
    const pushRemote = await prompt('\nPush to remote? (y/N) ');
    if (pushRemote.toLowerCase() === 'y') {
      run('git push');
      run('git push --tags');
    }

    // publish to npm
    const publishToNpm = await prompt('\nPublish to npm? (y/N) ');
    if (publishToNpm.toLowerCase() === 'y') {
      run('npm publish --access public');
      console.log(`\n🎉 Successfully published version ${newVersion} to npm!`);
    } else {
      console.log(`\n✅ Version ${newVersion} prepared for release.`);
      console.log('Run `npm publish --access public` when you\'re ready to publish to npm.');
    }
  } catch (error) {
    console.error('Error during release:', error.message);
    process.exit(1);
  }
};

// run the release process
release().catch((err) => {
  console.error('Release failed:', err);
  process.exit(1);
});
