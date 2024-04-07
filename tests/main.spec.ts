import { PowerAssert } from 'typed-nodejs-assert'

// eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-assignment -- hack to fix type definitions for the nodejs assertion library.
const assert: PowerAssert = require('power-assert')

test('main', () => {
    assert(
        "power assert isn't really needed but i find it kinda cool. u might find it's more trouble than it's worth",
    )
})
