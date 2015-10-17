var path        = require('path'),
    runSequence = require('run-sequence'),
    gulp        = require('gulp'),
    less        = require('gulp-less'),
    livereload  = require('gulp-livereload'),
    sourcemaps  = require('gulp-sourcemaps'),
    gutil       = require('gulp-util'),
    watchify    = require('watchify'),
    browserify  = require('browserify'),
    babelify    = require('babelify'),
    source      = require('vinyl-source-stream'),
    buffer      = require('vinyl-buffer'),
    assign      = require('object-assign'),
    src         = './src',
    styles      = './styles',
    dest        = './www',
    assets      = dest;

function swallowError(err) {
    gutil.log(gutil.colors.bgRed(' ✗ ') +' '+ err.toString());
    gutil.beep();
};

gulp.task('less', function () {
    function compileLess(src, dest) {
        return  gulp.src(src)
                    .pipe(less(/*{ compress: true }*/))
                    // .pipe(sourcemaps.init({loadMaps: true}))
                    // .pipe(sourcemaps.write('.'))
                    .on('error', function (err) {
                        swallowError(err);
                        this.emit('end', 'error');
                    })
                    .on('end', function (err) {
                        if (!err)
                            gutil.log(gutil.colors.green.bold(' ✓ style.css compiled & reloaded'));
                    })
                    .pipe(gulp.dest(dest))
                    .pipe(livereload());
    };

    return compileLess(styles+'/style.less', assets+'/css');
});

gulp.task('watch-less', function() {
    function watch(tasks, files) {
        gulp.watch(files.split(' '), tasks.split(' '))
            .on('change', function(evt) {
                gutil.log('File '+gutil.colors.magenta(evt.path.replace(__dirname+'/', ''))+' was '+evt.type+', running tasks...');
            });
    };

    watch('less', styles+'/**/*.less');
});

var b = browserify(assign({}, watchify.args, {
    entries: [src+'/index.js'],
    // extensions: ['.node', '.jsx'],
    // paths: ['./node_modules', './src'],
    debug: true,
    transform: [babelify]
}));

gulp.task('js-browser', bundle.bind(this, b));

function bundle(b, l) {
    var t = b.bundle()
            .on('error', swallowError)
            .on('end', function (evt) {
                gutil.log(gutil.colors.green.bold(' ✓ bundle.js compiled & reloaded'));
            })
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(assets+'/js'));

    //  disabled for livereload server
    //  becomes unreachable if server
    //  goes down for some reason
    if (l)
        t.pipe(livereload());

    return t;
}

gulp.task('watch-js', function () {
    var w = watchify(b);
        w.on('update', bundle.bind(this, w, 1));
        w.on('log', gutil.log);
        bundle(w, 1);
});

gulp.task('watch-dest', function () {
    gulp.watch([dest+'/**/*'], function (evt) {
            var relPath = evt.path.replace(__dirname, ''),
                dirPath = path.dirname(relPath);

            gulp.src('.'+relPath)
                .on('error', swallowError)
                .on('end', function (evt) {
                    gutil.log(gutil.colors.green.bold(' ✓ compiled files copied over to platform bundles'));
                })
                .pipe(gulp.dest('./platforms/ios'+dirPath))
                .pipe(gulp.dest('./platforms/ios/build/emulator/musicfeed.app'+dirPath))
                .pipe(livereload());
        })
        .on('change', function(evt) {
            gutil.log('File '+gutil.colors.magenta(evt.path.replace(__dirname+'/', ''))+' was '+evt.type+', running tasks...');
        });
});

gulp.task('watch', function(done) {
    livereload.listen({quiet: true});
    //  pass tasks in an array to run them
    //  in prallell (not in sequence)
    runSequence(['watch-js', 'watch-less'/*, 'watch-dest'*/], done);
});

gulp.task('build', function(done) {
    runSequence('less', 'js-browser', done);
});
