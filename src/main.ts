import { toNumber } from '@detachhead/ts-helpers/dist/functions/Number'
import { Octokit } from '@octokit/rest'
import { format, parseISO } from 'date-fns'
import express from 'express'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

const port = 3000

const host = `http://192.168.1.101:${port}`

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace -- this is the only way to type this as far as i can tell
    namespace Express {
        interface Locals {
            // technically these are optional but they should always be set during the app.use
            octokit: Octokit
            token: string
        }
    }
}

const app = express()

app.use((request, response, next) => {
    const token = request.query['token']
    if (!token) {
        response
            .status(403)
            .send('you must specify a github access token using the `token` query parameter')
        return
    } else if (typeof token !== 'string') {
        response.status(400).send('token must be a string')
        return
    }
    response.locals.octokit = new Octokit({ auth: token })
    response.locals.token = token
    next()
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- express supports async
app.get('/repo/:owner/:repo/:bundleId', async (request, response) => {
    const repoRequestParams = {
        owner: request.params.owner,
        repo: request.params.repo,
    } as const
    const octokit = response.locals.octokit
    const releases = (await octokit.rest.repos.listReleases(repoRequestParams)).data
    const repo = (await octokit.rest.repos.get(repoRequestParams)).data
    const result = {
        identifier: `io.github.${request.params.owner}.${request.params.repo}`,
        name: `${request.params.owner}/${request.params.repo}`,
        news: [],
        userInfo: {},
        apps: [
            {
                bundleIdentifier: request.params.bundleId,
                developerName: request.params.owner,
                iconURL: 'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
                localizedDescription: Buffer.from(
                    (await octokit.rest.repos.getReadme(repoRequestParams)).data.content,
                    'base64',
                ).toString(),
                name: request.params.repo,
                subtitle: repo.description,
                versions: (
                    await Promise.all(
                        releases.map((release) => {
                            const ipaFile = release.assets.find((asset) =>
                                asset.name.toLowerCase().endsWith('.ipa'),
                            )
                            if (!ipaFile) {
                                return
                            }
                            return {
                                size: ipaFile.size,
                                version: release.tag_name.startsWith('v')
                                    ? release.tag_name.substring(1)
                                    : release.tag_name,
                                date: format(parseISO(release.created_at), 'yyyy-MM-dd'),
                                localizedDescription: release.body,
                                downloadURL: repo.private
                                    ? `${host}/ipa/${request.params.owner}/${request.params.repo}/${ipaFile.id}?token=${response.locals.token}`
                                    : ipaFile.browser_download_url,
                            }
                        }),
                    )
                ).filter((version) => version !== undefined),
            },
        ],
    }
    response.send(result)
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- express supports async
app.get('/ipa/:owner/:repo/:assetId', async (request, response) => {
    const octokit = response.locals.octokit
    try {
        const assetData = await octokit.rest.repos.getReleaseAsset({
            owner: request.params.owner,
            repo: request.params.repo,
            asset_id: toNumber(request.params.assetId, true),
            headers: {
                accept: 'application/octet-stream',
            },
            mediaType: {
                format: 'stream',
            },
        })
        // @ts-expect-error https://github.com/octokit/rest.js/issues/12#issuecomment-1916023479
        const assetBuffer = Buffer.from(assetData.data)
        const assetStream = Readable.from([assetBuffer])
        response.setHeader('Content-Type', 'application/octet-stream')
        response.setHeader('Content-Disposition', 'attachment; filename="app.ipa"') // Change the filename as per your need
        await pipeline(assetStream, response)
    } catch (error) {
        console.error('Error streaming file:', error)
        response.status(500).send('Error streaming file')
    }
})

app.listen(port, () => console.log('running'))
