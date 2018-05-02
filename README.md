https://github.com/nodeca/js-yaml (I'm using release 3.10.0/dist/js-yaml.min.js)

https://codemirror.net/doc/manual.html
- I'm using 5.33.0 (from the homepage)
- TODO: minimize this instead of copying the whole thing...

- https://cdn.plot.ly/plotly-1.31.2.min.js
- https://plot.ly/javascript/

## NODEify!

- minify JS

I think I'm going to use a combination of
https://medium.com/the-node-js-collection/modern-javascript-explained-for-dinosaurs-f695e9747b70
and https://webpack.js.org/guides/getting-started/ to do this. By the time I'm
done I should have npm scripts  to auto-rebuild, transpile, and minify with
webpacks server plugin thingie.

## Install

```bash
npm install
npm run build  # for a one-time build
npm run start  # for a hot-reloading server
```

https://github.com/plotly/plotly.js/blob/master/README.md#building-plotlyjs-with-webpack

## TODO:
- Add Load/Save
- Add sliding areas
- Add title
- Add better CSS
- Add tests!
- add my name at the bottom (and a link to github)
- copy tensorflow.org's deploy method ( https://github.com/tensorflow/playground )
- grep -i todo .

# DNS Notes

Following https://help.github.com/articles/setting-up-an-apex-domain/#configuring-a-records-with-your-dns-provider

I'm using the A record style cause NameCheap supports it

from the advanced DNS page

Okay, I was running into some errors, but I solved them by removing and
readding ptoplotter.com to the custom domain thingie, then waiting a while.

