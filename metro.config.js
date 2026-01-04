const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver.assetExts.push('png');

module.exports = config;