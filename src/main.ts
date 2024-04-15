import { app, host, port } from './app.js'

app.listen(port, () => console.log(`listening on ${host}`))
