//Gulp task packages
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var stylemod = require('gulp-style-modules');
var mincss = require('gulp-clean-css');
// var GulpSSH = require('gulp-ssh');
const imagemin = require('gulp-imagemin');
var responsive = require('gulp-responsive');
var shell = require('gulp-shell')


//Node Packages
var importOnce = require('node-sass-import-once');
var del = require('del');
var runSequence = require('run-sequence');
var path = require('path');

//Configuration task packages
var config = require('./gulpConfig/gulpconfig.json');

/* Compile SASS */
gulp.task('sass', function() {
    var sassOptions = {
        importer: importOnce,
        importOnce: {
            index: true,
            bower: true
        }
    };

    return gulp.src(config.sassFileSources)
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(gulp.dest(config.cssDestFolder));
});

gulp.task('minify', function() {
    return gulp.src(config.cssDestFolder + '/**/*.css')
        .pipe(mincss())
        .pipe(gulp.dest(config.cssDestFolder));
});

/* Autoprefixer */
gulp.task('prefix', function() {
    return gulp.src(config.cssDestFolder + '/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 4 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(config.cssDestFolder));
});

/* Generate Polymer Style-Module from .css file */
/* note that functions can be implemented in filename/module ID for more than 1 file support */
gulp.task("polymerize", function() {
    return gulp.src(config.cssDestFolder+'/**/*.css')
        .pipe(stylemod({
            filename: function(file) {
                return path.basename(file.path, path.extname(file.path));
            },
            moduleId: function(file) {
                return path.basename(file.path, path.extname(file.path));
            }
        }))
        .pipe(gulp.dest(config.polymerModuleDest));
});

/* Tasks for cleanup before and after a build */
gulp.task('clean:build', function() {
    return del([config.cssDestFolder].concat(config.cleanupToMakeNewBuild));
});

gulp.task('clean:cleanup', function() {
    return del([config.cssDestFolder].concat(config.cleanupAfterBuild));
});

gulp.task('clean:imagemin', function() {
    return del(config.imageDest);
});

gulp.task('clean:responsive', function() {
    return del(config.resImages);
});

/* Build task */
gulp.task('build', function(cb) {
    runSequence('clean:build', 'sass', 'prefix', 'minify', 'polymerize', 'clean:cleanup', cb);
});

/* Dist task */
gulp.task('dist', function(cb) {
    runSequence('build', 'img', 'polybuild');

});

/* Images task */
gulp.task('img', function() {
    runSequence('responsive', 'imagemin');

});

/* Watch task */
gulp.task('default', function(cb) {
    gulp.watch(config.sassFileSources, ['build']);
});

gulp.task('imagemin', ['clean:imagemin'], function() {
    gulp.src('./' + config.resImages + '/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./' + config.imageDest))
});

gulp.task('responsive', ['clean:responsive'], function () {
  return gulp.src(config.rawImages + '/*.{png,jpg}')
    .pipe(responsive({
      // Resize all JPG images to five different sizes: 400, 810, 1280, 1920, and original size for 2x screens.
      'bg-*.jpg': [{
        width: 400,
        rename: { suffix: '-mobile' },
      }, {
        width: 810,
        rename: { suffix: '-tablet' },
      }, {
        width: 1280,
        rename: { suffix: '-laptop' },
      }, {
        width: 1920,
        rename: { suffix: '-hd' },
      }, {
        // Compress, strip metadata, and rename original image
        rename: { suffix: '-original' },
      }],
      // Resize all PNG images to be retina ready
      // '*.png': [{
      //   width: 250,
      // }, {
      //   width: 250 * 2,
      //   rename: { suffix: '@2x' },
      // }],
      // Resize all PNG images to be retina ready
      'slyn.jpg': [{
        width: 150,
      }, {
        width: 150 * 2,
        rename: { suffix: '-2x' },
      }],

      'chalkboard.jpg': [{
        width: 1920,
      }],
    }, {
      // Global configuration for all images
      // The output quality for JPEG, WebP and TIFF output formats
      quality: 70,
      // Use progressive (interlace) scan for JPEG and PNG output
      progressive: true,
      // Strip all metadata
      withMetadata: false,
    }))
    .pipe(gulp.dest('./' + config.resImages));
});

gulp.task('polybuild', shell.task([
  'polymer build'
]))