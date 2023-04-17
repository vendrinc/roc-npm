// Adapted from the Elm npm installer, licensed under BSD-3-Clause, located at:
// https://github.com/lydell/compiler - original authors were:
// Richard Feldman, Aaron VonderHaar, Evan Czaplicki, Simon Lydell, and others.
// Thank you, all!

var fs = require('fs');
var package = require('./package.json');
var path = require('path');


// This function is used by install.js and by the bin/roc backup script that gets
// run when --ignore-scripts is enabled.
module.exports = function()
{
	// figure out package of binary
	var version =
        package.version.endsWith('-nightly')
        // turn '0.0.0-2023-04-17-nightly' into '2023-04-17-nightly'
        ? package.version.replace(/^\d+\.\d+\.\d+-(.*)$/, '$2')
        // turn '1.2.3-alpha' into '1.2.3'
        : package.version.replace(/^(\d+\.\d+\.\d+).*$/, '$1');
	var subPackageName = 'roc-on-' + process.platform + '_' + process.arch;

	verifyPlatform(version, subPackageName);

	var fileName = process.platform === 'win32' ? 'roc.exe' : 'roc';

	try
	{
		var subBinaryPath = require.resolve(subPackageName + '/' + fileName);
	}
	catch (error)
	{
		if (error && error.code === 'MODULE_NOT_FOUND')
		{
			exitFailure(version, missingSubPackageHelp(subPackageName));
		}
		else
		{
			exitFailure(version, 'I had trouble requiring the binary package for your platform (' + subPackageName + '):\n\n' + error);
		}
	}

	// Yarn 2 and later ("Berry") always invokes `node` (regardless of configuration)
	// so we cannot do any optimizations there
	var isYarnBerry = /\byarn\/(?!1\.)/.test(process.env.npm_config_user_agent || "");

	// as mentioned in bin/roc we cannot do any optimizations on Windows
	if (process.platform === 'win32' || isYarnBerry)
	{
		return subBinaryPath;
	}

	// figure out where to put the binary
	var binaryPath = path.resolve(__dirname, package.bin.roc);
	var tmpPath = binaryPath + '.tmp';

	// optimize by replacing the JS bin/roc with the native binary directly
	try
	{
		// atomically replace the file with a hard link to the binary
		fs.linkSync(subBinaryPath, tmpPath);
		fs.renameSync(tmpPath, binaryPath);
	}
	catch (error)
	{
		exitFailure(version, 'I had some trouble writing file to disk. It is saying:\n\n' + error);
	}

	return binaryPath;
}

function verifyPlatform(version, subPackageName)
{
	if (subPackageName in package.optionalDependencies) return;

	var situation = process.platform + '_' + process.arch;
	console.error(
		'-- ERROR -----------------------------------------------------------------------\n\n'
		+ 'This npm Roc installer does not support your platform (' + situation + ').\n\n'
		+ 'You can try to manually download an appropriate binary (if there is one) from:\n\n'
		+ '<https://github.com/roc-lang/roc/releases>\n\n'
		+ 'You can also get help from friendly people at <https://roc.zulipchat.com>\n\n'
		+ '--------------------------------------------------------------------------------\n'
	);
	process.exit(1);
}

function exitFailure(version, message)
{
	console.error(
		'-- ERROR -----------------------------------------------------------------------\n\n'
		+ message
		+ '\n\nNOTE: You can avoid npm entirely by downloading directly from:\n\n'
        + '<https://github.com/roc-lang/roc/releases>\n\n'
		+ 'All this package does is to download a file from there.\n\n'
		+ '--------------------------------------------------------------------------------\n'
	);
	process.exit(1);
}


function missingSubPackageHelp(subPackageName)
{
    // Instead of giving up, we could try to download it via fetch() in case of --no-optional.
    // If we do that, we should download it directly from npm (not from Roc releases),
    // so that we avoid introducing another point of failure, and can ensure you're getting
    // the same version as everyone else. Apparently the esbuild installer handles a bunch
    // of edge cases like this. However, evidently nobody in the Elm community has complained
    // about this causing problems, so it doesn't seem urgent to improve.
	return (
		'I support your platform, but I could not find the binary package (' + subPackageName + ') for it!\n\n'
		+ 'This can happen if you use the "--omit=optional" (or "--no-optional") npm flag.\n'
		+ 'This package uses the "optionalDependencies" package.json feature install the correct\n'
		+ 'binary executable for your current platform. Remove that flag to install Roc.\n\n'
		+ 'This can also happen if the "node_modules" folder was copied between two operating systems\n'
		+ 'that need different binaries - including "virtual" operating systems like Docker and WSL.\n'
		+ 'If so, try installing with npm rather than copying "node_modules".'
	);
}
