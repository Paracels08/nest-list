# Nest List

A private, shareable checklist for everything to sort before the baby arrives: baby items, the hospital bag, mom essentials and paperwork. It installs on an iPhone home screen and opens full screen like an app. It is designed to help new moms to keep track of all necessities.

- Plain HTML, CSS and JavaScript, with no build step. Hosted on GitHub Pages.
- Lists live in Supabase. There are no accounts: each list has a secret link, and anyone with the link can see and change it.

## Setup

1. In Supabase, open SQL Editor, paste `supabase/setup.sql` and run it, then do the same with `supabase/no-login.sql`. The last one prints the link to any list already in the database.
2. Supabase's free plan pauses a project after about a week without use. If the app says it can't reach the server, open the Supabase dashboard and restore the project.
3. Put the project URL and anon key in `config.js`.
4. In GitHub, go to Settings → Pages and set **Source** to **GitHub Actions**. Every push to `main` publishes the app.

## Install on iPhone

Open the app's address in Safari, tap Share, then Add to Home Screen.

## Files

- `index.html`, `app.css` and `app.js` are the app itself.
- `starter.json` is the suggested list a new account starts with.
- `sw.js` is the offline cache. Bump `VERSION` in it on each release.
- `vendor/supabase.js` is supabase-js 2.45.4 (UMD build).
