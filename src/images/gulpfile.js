
gulp.task('sass', function () {
    gulp.src(config.paths.ss_inputSass)
     .pipe(sass(config.sassOptions))
     .on('error', console.error.bind(console))
     .pipe(autoprefixer())
     .pipe(gulp.dest(config.paths.dist + '/ss-input/styles'))
     .pipe(browserSync.reload({stream: true}))
     .pipe(rename({suffix: '.min'}))
     .pipe(sourcemaps.init())
     .pipe(csso())
     .on('error', console.error.bind(console))
     .pipe(sourcemaps.write('.'))
     .pipe(gulp.dest(config.paths.dist + '/ss-input/styles'));
});
gulp.task('images', function () {
    gulp.src(config.paths.ss_inputImageSystem)
     .pipe(gulp.dest(config.paths.dist + '/ss-input/styles/images/system'));
});
gulp.task('system', function () {
    gulp.src(config.paths.ss_inputSystem)
     .pipe(gulp.dest(config.paths.dist + '/ss-input/system'));
});
gulp.task('watch', function () {
    gulp.watch(config.paths.ss_inputJs, ['js']);
    gulp.watch(config.paths.ss_inputSass, ['sass']);
    gulp.watch(config.paths.ss_inputImage, ['images']);
    gulp.watch(config.paths.ss_inputSystem, ['system']);
});
gulp.task('default', ['inject', 'sass', 'js', 'browser-sync','system','watch']);
