import type { JestConfigWithTsJest } from 'ts-jest/dist/types'

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '(/tests/.*|(\\.|/)(test|spec))[^d]\\.ts$',
    globals: {
        'ts-jest': {
            tsconfig: './tests/tsconfig.json',
            babelConfig: {
                presets: ['power-assert'],
            },
        },
    },
    detectOpenHandles: true,
}
export default config
