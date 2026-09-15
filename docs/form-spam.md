# Submit form: spam and bots

The Submit page posts to Netlify Forms. Three layers keep junk out:

1. **Netlify's spam filter (Akismet)** runs on every submission. Flagged ones go to the
   form's *Spam* tab in the dashboard instead of notifications. Nothing to configure.
2. **Honeypot field** `bot-field`, hidden from people, present in both the hidden HTML form
   and the React form. Anything that fills it is dropped.
3. **reCAPTCHA v2 checkbox**, verified by Netlify before the submission is accepted. This is
   the layer that stops scripts posting straight to the endpoint (the SQL-injection noise),
   because they have no token.

## Turning reCAPTCHA on (Paul, once)
1. https://www.google.com/recaptcha/admin/create: label "FAB website", type **Challenge (v2)**,
   "I'm not a robot" checkbox. Domains: `fab.barnsleyfc.co.uk` and `zippy-quokka-bea4f1.netlify.app`
   (add `localhost` if you want it on the dev server). Copy the site key and secret key.
2. Netlify > Site configuration > Environment variables, add three:
   - `SITE_RECAPTCHA_KEY` = site key
   - `SITE_RECAPTCHA_SECRET` = secret key
   - `VITE_RECAPTCHA_SITE_KEY` = site key (same value; this one is baked into the page)
3. Trigger a deploy (Deploys > Trigger deploy). The checkbox appears on the Submit page and
   Netlify starts rejecting posts without a valid token.

Until the variables exist the form works exactly as before, without the checkbox.

## Clearing what has already arrived
In Netlify > Forms > fab-submission, tick the junk rows and choose *Mark as spam*; that also
trains the filter. Notifications only fire for submissions that pass all three layers.
