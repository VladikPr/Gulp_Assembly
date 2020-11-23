'use strict';

const projectFolder = require("path").basename(__dirname);
const sourceFolder = "src";
const fs = require('fs');

//define whole pathes

const path = {
    build: {
        html: projectFolder + "/",
        css: projectFolder + "/css/",
        js: projectFolder + "/js/",
        img: projectFolder + "/img/",
        fonts: projectFolder + "/fonts/"
    },
    src: {
        html: sourceFolder + "/pug/pages/*.pug",
        css: sourceFolder + "/assets/scss/style.scss",
        js: sourceFolder + "/js/index.js",
        img: sourceFolder + "/assets/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: sourceFolder + "/assets/fonts/*.ttf"
    },
    watch: {
        html: sourceFolder + "/pug/**/*.pug",
        css: sourceFolder + "/assets/scss/**/*.scss",
        js: sourceFolder + "/js/**/*.js",
        img: sourceFolder + "/assets/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },
    clean: "./" + projectFolder + "/"
};

const { src, dest, watch, series, parallel} = require('gulp');
const gulp = require('gulp');
const browsersync = require('browser-sync').create();
const del = require('del');
const pug = require('gulp-pug');
const scss = require("gulp-sass");
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require("gulp-clean-css");
const rename = require("gulp-rename");
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');
const uglify = require("gulp-uglify-es").default;
const imagemin = require("gulp-imagemin");
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');

function browserSync(params) {
    browsersync.init({
        server:{
            baseDir: path.clean
        },
        port: 3000,
        notify: false
    });
}

//pug
function html() {
    return src(path.src.html)
    .pipe(pug({
        //pretty: true
    }))
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream());
}

//scss
function css() {
    return src(path.src.css)
    .pipe(
        scss({
            outputStyle: "expanded"
        })
    )
    .pipe(gcmq())
    .pipe(
        autoprefixer({
            overrideBrowserslist: ["last 5 versions"],
            cascade: true
        })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
    .pipe(cleanCSS())
    .pipe(
        rename({
            extname: ".min.css"
        })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream());

}

//js
function js() {
    return src(path.src.js)
        .pipe(gulpWebpack({
            mode: 'development',
            output: {
                filename: 'script.js'
            },
            module: {
                rules: [
                  {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                      loader: 'babel-loader',
                      options: {
                        presets: ['@babel/preset-env']
                      }
                    }
                  }
                ]
            },
        }))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}

//images
function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3 // 0 to 7
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}

//fonts
function fonts(params){
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
          .pipe(ttf2woff2())
          .pipe(dest(path.build.fonts));
}

//convert otf to ttf
gulp.task('otf2ttf', function (){
    return src([sourceFolder + '/assets/fonts/*.otf'])
    .pipe(fonter({
        formats: ['ttf']
    }))
    .pipe(dest(sourceFolder + '/fonts/'));
});


function watchFiles(params) {
    watch([path.watch.html], html);
    watch([path.watch.css], css);
    watch([path.watch.js], js);
    watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean);
}

const build = series(clean, parallel(css, html, images), js, fonts);
const watchChanges = parallel(build, watchFiles, browserSync);

exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watchChanges = watchChanges;
exports.default = watchChanges;