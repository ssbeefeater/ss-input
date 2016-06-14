"use strict";

var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var sprity = require('sprity');
var rename = require('gulp-rename');
var closure = require('gulp-closure-compiler-service');
var removeCode = require('gulp-remove-code');
var cleanCSS = require('gulp-clean-css');
var inject = require('gulp-inject');
var config = {
    port: 9005,
    devBaseUrl: 'http://localhost',
    paths: {
        ss_inputJs: [
            './src/ss-input/js/core/Ss-input.js',
            './src/ss-input/js/core/*.js',
            './src/ss-input/js/plugins/selectionMode/selectionMode.js',
            './src/ss-input/js/plugins/selectionMode/multiSelection.js',
            './src/ss-input/js/plugins/selectionMode/singleSelection.js',
            './src/ss-input/js/plugins/selectionMode/textEditorSelection.js',
            './src/ss-input/js/plugins/fileSystem/fileSystem.js',
            './src/ss-input/js/plugins/fileSystem/history.js',
            './src/ss-input/js/plugins/fileSystem/path.js',
            './src/ss-input/js/plugins/database/database.js',
            './src/ss-input/js/plugins/search.js',
            './src/ss-input/js/plugins/fileSystem/mkdir.js',
            './src/ss-input/js/plugins/fileSystem/newFile.js',
            './src/ss-input/js/plugins/fileSystem/upload.js',
            './src/ss-input/js/plugins/fileSystem/url.js',
            './src/ss-input/js/plugins/database/newRecord.js',
            './src/ss-input/js/plugins/refresh.js',
            './src/ss-input/js/plugins/imgBox.js',
            './src/ss-input/js/plugins/scan.js',
            './src/ss-input/js/plugins/templateManager.js',
            './src/ss-input/js/plugins/iconSize.js',
            './src/ss-input/js/plugins/sort.js',
            './src/ss-input/js/plugins/info.js',
            './src/ss-input/js/plugins/fileSystem/copy.js',
            './src/ss-input/js/plugins/delete.js',
            './src/ss-input/js/plugins/fileSystem/textEditor.js',
            './src/ss-input/js/plugins/fileSystem/aceEditor.js',
            './src/ss-input/js/plugins/fileSystem/rename.js',
            './src/ss-input/js/plugins/database/editRecord.js',
            './src/ss-input/js/plugins/sidebar.js',
            './src/ss-input/js/plugins/selectAll.js',
            './src/ss-input/js/plugins/cache.js',
            './src/ss-input/js/plugins/infoBubble.js',
            './src/ss-input/js/plugins/nameBubble.js',
            './src/ss-input/js/plugins/contextMenu.js',
            './src/ss-input/js/plugins/select.js',
            './src/ss-input/js/**/*.js',
            './src/ss-input/js/plugins/fileSystem/handlers/*.js'],
        ss_inputSassMain: './src/ss-input/styles/ss-input.scss',
        ss_inputSassFiles: ['./src/ss-input/styles/mixins.scss','./src/ss-input/styles/**/*.scss', '!./src/ss-input/styles/ss-input.scss'],
        ss_inputSystem: './src/ss-input/system/**/*.php',
        ss_inputImage: './src/ss-input/styles/!(system)/**/*.{png,jpg}',
        ss_inputImageSystem: './src/ss-input/styles/images/system/*.{png,jpg,gif}',
        dist: './dist'
    },
    sassOptions: {
        errLogToConsole: true,
        outputStyle: 'expanded'
    }
};
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./src"
        },
        ui: {
            port: 9090
        }
    });
});
gulp.task('inject', function () {
    var target = gulp.src('./src/index.html');
    var sources = gulp.src(config.paths.ss_inputJs, {read: false});
    return target.pipe(inject(sources, {relative: true}))
     .pipe(gulp.dest('./src/'));
});
gulp.task('injectSass', function () {
    var target = gulp.src(config.paths.ss_inputSassMain);
    var sources = gulp.src(config.paths.ss_inputSassFiles, {read: false});
    return target.pipe(inject(sources, {relative: true}))
     .pipe(gulp.dest('./src/ss-input/styles/'));
});
gulp.task('sprites', function () {
    return sprity.src({
         src: config.paths.ss_inputImage,
         style: './sprite.scss',
         cssPath: 'images/',
         margin: 0,
         processor: 'sass'// make sure you have installed sprity-sass
     })
     .on('error', console.error.bind(console))
     .pipe(gulpif('*.png', gulp.dest('./dist/ss-input/styles/images/'), gulp.dest('./src/ss-input/styles/')))
     .pipe(gulpif('*.png', gulp.dest('./src/styles/images/'), gulp.dest('./src/ss-input/styles/')))
});
gulp.task('compile', function () {
    gulp.src(config.paths.ss_inputJs)
     .pipe(sourcemaps.init())
     .pipe(removeCode({production: true}))
     .pipe(concat('ss-input.js'))
     .pipe(closure()).on('error', console.error.bind(console))
     .pipe(rename({suffix: '.min'}))
     .pipe(sourcemaps.write('./'))
     .pipe(gulp.dest(config.paths.dist + '/ss-input/js/'));
});
gulp.task('js', function () {
    gulp.src(config.paths.ss_inputJs)
     .pipe(concat('ss-input.js'))
     .pipe(removeCode({production: true}))
     .pipe(gulp.dest(config.paths.dist + '/ss-input/js'))
     .pipe(browserSync.reload({stream: true}));
});
gulp.task('sass', function () {
    gulp.src(config.paths.ss_inputSassMain)
     .pipe(sass(config.sassOptions))
     .on('error', console.error.bind(console))
     .pipe(autoprefixer())
     .pipe(gulp.dest(config.paths.dist + '/ss-input/styles'))
     .pipe(browserSync.reload({stream: true}))
     .pipe(rename({suffix: '.min'}))
     .pipe(sourcemaps.init())
     .pipe(cleanCSS({debug: true}, function(details) {
         console.log(details.name + ': ' + details.stats.originalSize);
         console.log(details.name + ': ' + details.stats.minifiedSize);
     }))
     .on('error', console.error.bind(console))
     .pipe(gulp.dest(config.paths.dist + '/ss-input/styles'))
     .pipe(gulp.dest('./src/styles'));
});
gulp.task('images', function () {
    gulp.src(config.paths.ss_inputImageSystem)
     .pipe(gulp.dest(config.paths.dist + '/ss-input/styles/images/system'))
     .pipe(gulp.dest('./src/styles/images/system'));
});
gulp.task('system', function () {
    gulp.src(config.paths.ss_inputSystem)
     .pipe(removeCode({production: true}))
     .pipe(gulp.dest(config.paths.dist + '/ss-input/system'));
});
gulp.task('watch', function () {
    gulp.watch(config.paths.ss_inputJs, ['js']);
    gulp.watch(config.paths.ss_inputSassFiles, ['sass']);
    gulp.watch(config.paths.ss_inputSassMain, ['sass']);
    gulp.watch(config.paths.ss_inputImage, ['images']);
    gulp.watch(config.paths.ss_inputSystem, ['system']);
});
gulp.task('default', ['inject','images','injectSass','sass', 'js', 'browser-sync', 'system', 'watch']);
