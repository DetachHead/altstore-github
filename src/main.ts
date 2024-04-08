import { Octokit } from '@octokit/rest'
import express from 'express'

const app = express()

const octokit = new Octokit()

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- express supports async
app.get('/:owner/:repo', async (request, res) => {
    const repoRequestParams = {
        owner: request.params.owner,
        repo: request.params.repo,
    } as const
    const latestRelease = (await octokit.rest.repos.listReleases(repoRequestParams)).data[0]
    if (latestRelease) {
        const ipaFile = latestRelease.assets.find((asset) =>
            asset.name.toLowerCase().endsWith('.ipa'),
        )
        if (ipaFile) {
            res.send({
                apps: [
                    {
                        beta: latestRelease.prerelease,
                        // it's impossible to know this without knowing the app ahead of time so we just make a fake one, but i don't think it matters?
                        bundleIdentifier: `io.github.${request.params.owner}.${request.params.repo}`,
                        developerName: request.params.owner,
                        iconUrl:
                            'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
                        localizedDescription: Buffer.from(
                            (await octokit.rest.repos.getReadme(repoRequestParams)).data.content,
                            'base64',
                        ).toString(),
                        name: request.params.repo,
                        screenshotUrls: [],
                        size: ipaFile.size,
                        subtitle: (await octokit.rest.repos.get(repoRequestParams)).data
                            .description,
                        tintColor: '171515',
                        version: latestRelease.tag_name.startsWith('v')
                            ? latestRelease.tag_name.substring(1)
                            : latestRelease.tag_name,
                        versionDate: latestRelease.created_at,
                        versionDescription: latestRelease.body_text,
                    },
                ],
            })
        } else {
            res.send({ apps: [] })
        }
    } else {
        res.send({ apps: [] })
    }
})

app.listen(3000, () => console.log('running'))
