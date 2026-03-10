const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Exclude test files from Metro bundler (they are Jest-only)
config.resolver.blockList = [/.*\.test\.(ts|tsx|js|jsx)$/];

// Firebase SDK v10 : résolution platform-aware des package exports.
// - Sur native : force le build react-native pour éviter le chargement simultané dist/esm + dist/rn.
// - Sur web : force le build browser pour que signInWithPopup et les APIs web soient disponibles.
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];
// Sur web, @firebase/auth se résoudrait sur son build react-native (qui n'exporte pas signInWithPopup).
// On redirige directement vers le build browser ESM2017.
// Sur web, @firebase/auth se résoudrait sur son build react-native (qui n'exporte pas signInWithPopup).
// On redirige directement vers le build browser ESM2017.
const path = require('path');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === '@firebase/auth' || moduleName === 'firebase/auth')) {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@firebase/auth/dist/browser-cjs/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
