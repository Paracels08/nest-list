# My notes on Nest List

How the app works, in my own words.

## How it fits together

The app lives in three places:
- **GitHub** stores the code and publishes it as a website.
- **The browser or phone** runs the app.
- **Supabase** stores the lists and handles logins.

Diagram: https://claude.ai/artifact/4LeLaaKECQ813K9d6654fa

## The files

**index.html** stores the structure of the app and points to the files that need to be loaded. It opens first. At the bottom it loads, in this order: `config.js`, `vendor/supabase.js`, then `app.js`. The order matters because `app.js` uses the settings and the Supabase library, so they have to exist first.

**config.js** stores the address of the database (where it is hosted) and the anon key. The anon key is public on purpose: it just gets you in the front door. It doesn't protect anything.

**vendor/supabase.js** is the official Supabase library, a ready-made tool for talking to the database. It wasn't written for this app.

**app.js** is the JavaScript that defines how the app behaves: drawing the list, reacting to taps, and saving. It has 9 sections, including setup, helpers, saving, sheets (the panels that slide up), events (taps and typing) and boot (what runs when the app opens).

**supabase/setup.sql** protects my data. Every request or change gets checked against its rules:
- Not logged in: you can see nothing.
- The owner can see, add, change and delete their own lists.
- Someone can see my list only if I share it with them first, and they can't change it.

Login details (emails, passwords) are protected by Supabase itself, not by this file.

**manifest.webmanifest** is like an ID card for the app. It says which link to open, which icons to use, and how the app opens on different devices, so it can be installed like a phone app.

**sw.js** (service worker) keeps a copy of the app's files on the phone, so the app still opens without internet. It has a version number: changing it makes phones fetch the new version. Saving my changes while offline is done by `app.js`, not `sw.js`.

## To check

- **app.css**: how the app looks
- **starter.json**: the default items a new list starts with
- **.github/workflows/pages.yml**: publishes the app on every push to main
- **icons/**: app icons
- **How saving works when two devices edit at the same time.** Can one overwrite the other?
