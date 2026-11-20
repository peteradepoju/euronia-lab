# The Euronia lab site

The public half of [Euronia](https://euronia.vercel.app). It is one page and three files,
and it holds nothing that was not deliberately published into it.

## How it works

`feed.json` is written by Euronia's Publish room, straight from the browser to this
repository. The page fetches it at run time and draws itself, so publishing takes effect at
once: there is no build step here, no GitHub Action, and no secret in this repository.

The feed carries only what was put into it, one item at a time, from a document in Euronia
that exists for that purpose. The notebook, the problems, the highlights, the decision gates
and the keys have no path to it.

## Serving it

GitHub Pages, from `main`, folder `/` (root). Settings → Pages → Build and deployment →
Deploy from a branch.

`.nojekyll` is here so Pages serves the files as they are rather than running Jekyll over
them.

## Changing the design

The site is `index.html`, `style.css` and `lab.js`. There is no framework and nothing to
install: open `index.html` in a browser and it works. The source of truth for the design
lives in the private Euronia repository under `site/`, and is copied here.

## What the page does with the feed

Everything from the feed is set as text, never as markup. The research statement is rendered
from a closed subset of Markdown — paragraphs, three levels of heading and bullet lists —
built element by element, so there is no path from the feed to markup however it is written.
Links are followed only when they are `https:` or `mailto:`.
