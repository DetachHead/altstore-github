import type { JestConfigWithTsJest } from 'ts-jest/dist/types.js'

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '(/tests/.*|(\\.|/)(test|spec))[^d]\\.ts$',
    globals: {
        'ts-jest': {
            tsconfig: './tests/tsconfig.json',
        },
    },
    detectOpenHandles: true,
}
export default config
