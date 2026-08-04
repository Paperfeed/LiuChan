# Chrome Web Store release

## Repository setup

Create a protected GitHub environment named `chrome-web-store`, then add these repository or environment secrets:

- `CHROME_EXTENSION_ID`
- `CHROME_PUBLISHER_ID`
- `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`
- `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`

The workflow uses Chrome Web Store API v2 with a service account, so it does
not need a user OAuth client or refresh token:

1. Enable the Chrome Web Store API in a Google Cloud project.
2. Create a service account; it does not need a Google Cloud role for this API.
3. Create a JSON key for it. Store its `client_email` and `private_key` values
   in the corresponding GitHub secrets above. Never commit the JSON key.
4. In the Chrome Web Store Developer Dashboard, open **Account** and add the
   service account email. Chrome currently permits one service account per
   publisher.
5. Copy the publisher ID from **Publisher > Settings** into
   `CHROME_PUBLISHER_ID`.

Follow the official [service-account setup](https://developer.chrome.com/docs/webstore/service-accounts) and enable two-step verification on the human developer account. The previously configured `CHROME_CLIENT_ID` and `CHROME_CLIENT_SECRET` are only used by the deprecated v1.1 API and can be removed from GitHub after the v2 dry run succeeds.

## Before submitting

1. Choose a release tag whose version is greater than the currently published version.
2. Run the complete local verification sequence from the README.
3. Review the generated `.output/chrome-mv3/manifest.json` and zip contents.
4. Update the Store listing so it advertises only the features in the current README.
5. In Privacy practices, disclose that page text is processed locally for lookup and is not collected or transmitted. Dictionary update requests contact `cc-cedict.org` and `cccanto.org` only after a user clicks the update button.
6. Refresh screenshots to show the MV3 popup, Mandarin/Cantonese modes, and options page.
7. Keep the dictionary source and license attribution from the README/options page in the Store description.

## Workflow

Run **Release LiuChan** from the Actions tab before the first release to validate the Chrome Web Store credentials without uploading anything.

To publish a release, create and push a semantic version tag on a commit in `master`. The tag is the release version; no version file needs to be edited. For example:

```sh
git tag v3.0.0
git push origin v3.0.0
```

The workflow derives the extension version from the tag, builds a fresh zip, retains it as a workflow artifact, attaches it to a GitHub Release, uploads it to the existing Chrome Web Store listing, and submits it for review. The GitHub Release remains a draft if Chrome submission fails.

If automated submission is unavailable, download the workflow artifact and use **Upload New Package** in the Chrome Developer Dashboard.
