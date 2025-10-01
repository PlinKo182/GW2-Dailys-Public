// Load configuration from environment or config file
const path = require('path');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  jest: {
    configure: (jestConfig) => {
      // Explicitly ignore node_modules to prevent Jest from scanning it for tests
      jestConfig.testPathIgnorePatterns = [
        ...(jestConfig.testPathIgnorePatterns || []),
        '/node_modules/',
      ];

      // Explicitly set the test match pattern to only look inside the src directory
      jestConfig.testMatch = [
        '<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)'
      ];

      // Disable coverage collection during normal test runs to speed things up
      jestConfig.collectCoverage = false;

      return jestConfig;
    },
  },
};