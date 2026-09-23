// The production origin, used to build absolute canonical/OG URLs baked into the
// pre-rendered HTML. Pages must not read `window.location.origin` for this: during
// pre-rendering (and in `npm run dev`) that would bake in the wrong host.
// Keep in sync with SITE_URL in scripts/build-feeds.mjs.
export const SITE_URL = 'https://fab.barnsleyfc.co.uk';

export const SITE_NAME = 'Barnsley FC Fan Advisory Board';
