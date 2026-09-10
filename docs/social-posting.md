# Posting to Facebook and X

`scripts/social-post.mjs` posts to the FAB Facebook page and X account. Claude runs it in a
session via the `/post-social` skill; you can also run it by hand.

```bash
node scripts/social-post.mjs --article august-meeting-minutes-published --dry-run
node scripts/social-post.mjs --text "Next FAB meeting: Tuesday 22 September, 6.30pm on Teams. Send us your questions." --link https://fab.barnsleyfc.co.uk/submit --to facebook,x
```

## One-off setup (Paul)
Copy `.env.social.example` to `.env.social` and fill it in. The file is gitignored.

**Facebook**
1. https://developers.facebook.com → create an app (type "Business"). No extra products are needed, only the Graph API.
2. Graph API Explorer → select the app, ask for `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`; generate a User token; then "Get Page Access Token" for the FAB page.
3. Exchange it for a long-lived token (Graph API Explorer's "Extend" or the `oauth/access_token` endpoint). Long-lived Page tokens do not expire while you remain a page admin.
4. `FB_PAGE_ID` is the number on the page's About section; `FB_PAGE_TOKEN` is the long-lived token.

**X**
1. https://developer.x.com → sign up with the FAB account (Free tier is enough for occasional posts; check the current monthly write limit).
2. Create an app; under "User authentication settings" enable OAuth 1.0a with **Read and Write**.
3. Keys and tokens tab: copy the API Key/Secret into `X_API_KEY`/`X_API_SECRET` and generate an Access Token/Secret (they must show "Read and Write") into `X_ACCESS_TOKEN`/`X_ACCESS_SECRET`.

## Behaviour
- `--article` uses the title and summary, links to `/news/<slug>` and attaches the featured image
  (uploaded directly, so the post has a picture even though the site's link previews do not yet).
- On X, text is trimmed so that text plus link fits in 280 characters.
- `--dry-run` prints what would be sent and sends nothing. Claude always dry-runs and asks first.
