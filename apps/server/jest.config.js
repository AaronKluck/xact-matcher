module.exports = {
    // Use ts-jest preset for TypeScript support
    preset: 'ts-jest',

    // Set the test environment
    testEnvironment: 'node',

    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts',
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],

    // File extensions Jest will process
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

    // Transform files with ts-jest
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },

    // Coverage settings (optional but recommended)
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts'
    ],

    // Setup files (if needed)
    // setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],

    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.test.json'
        }
    }
};