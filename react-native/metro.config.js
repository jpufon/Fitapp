// Metro config — supports consuming walifit-shared (at ../packages/shared)
// in addition to react-native/node_modules. The symlink at
// react-native/node_modules/walifit-shared resolves the package, but Metro
// refuses to bundle files outside the project root unless watchFolders
// includes them.

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the whole repo so Metro picks up changes in packages/shared/src.
// Hierarchical node_modules lookup is left enabled so transitive deps
// (e.g. react-native-reanimated → semver) resolve via npm's nested layout.
config.watchFolders = [workspaceRoot];

module.exports = withNativeWind(config, { input: './global.css' });
