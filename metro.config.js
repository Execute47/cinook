const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Exclude test files from Metro bundler (they are Jest-only)
config.resolver.blockList = [/.*\.test\.(ts|tsx|js|jsx)$/];

// Nécessaire pour que Firebase SDK v10 résolve le bon build React Native.
// unstable_conditionNames force TOUTES les résolutions transitives à utiliser
// le build react-native, évitant le chargement simultané de dist/esm et dist/rn.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = withNativeWind(config, { input: './global.css' });
