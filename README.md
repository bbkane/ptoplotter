https://github.com/nodeca/js-yaml (I'm using release 3.10.0/dist/js-yaml.min.js)

https://codemirror.net/doc/manual.html
- I'm using 5.33.0 (from the homepage)
- TODO: minimize this instead of copying the whole thing...

- https://cdn.plot.ly/plotly-1.31.2.min.js
- https://plot.ly/javascript/

## NODEify!

- minify JS
- Use typescript :)
- Add npm scripts
- add webpack-dev-server

I think I'm going to use a combination of
https://medium.com/the-node-js-collection/modern-javascript-explained-for-dinosaurs-f695e9747b70
and https://webpack.js.org/guides/getting-started/ to do this. By the time I'm
done I should have npm scripts  to auto-rebuild, transpile, and minify with
webpacks server plugin thingie.

## Install

```bash
npm install
npx webpack --config webpack.config.js
```

https://github.com/plotly/plotly.js/blob/master/README.md#building-plotlyjs-with-webpack

## TODO:
- make "today" variable
- Add Load/Save
- Add sliding areas
- Add multiple changing traces?
- Add title
- Add better CSS
- The one_day_changes seem to be off by one
- If a change happens on a holiday, then PDO isn't counted off. Make sure to account for this

