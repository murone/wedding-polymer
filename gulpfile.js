//Gulp task packages
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var stylemod = require('gulp-style-modules');
var mincss = require('gulp-clean-css');
// var GulpSSH = require('gulp-ssh');

//Node Packages
var importOnce = require('node-sass-import-once');
var del = require('del');
var runSequence = require('run-sequence');
var path = require('path');

//Configuration task packages
var config = require('./gulpConfig/gulpconfig.json');
// var credentials = require('./gulpConfig/credentials.json');
// var ssh = new GulpSSH({
//     ignoreErrors: false,
//     sshConfig: {
//         host: credentials.hostURL,
//         username: credentials.username,
//         password: credentials.password,
//     }
// });

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
            browsers: ['> 5%', 'ie > 10', 'not ie <= 10'],
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


// /* Copy smaller files to the remote server */
// gulp.task('deploy', function() {
//     return gulp.src(credentials.filesToDeploy)
//         .pipe(ssh.dest(credentials.remotePath));
// });

//  Copy large, one time setup files to the remote server + the smaller guys
// gulp.task('deploy:initialize', function() {
//     return gulp.src(credentials.filesToDeploy.concat(credentials.bigFilesAndFolders))
//         .pipe(ssh.dest(credentials.remotePath));
// });


/* Tasks for cleanup before and after a build */
gulp.task('clean:build', function() {
    return del([config.cssDestFolder].concat(config.cleanupToMakeNewBuild));
});

gulp.task('clean:cleanup', function() {
    return del([config.cssDestFolder].concat(config.cleanupAfterBuild));
});

/* Build task */
gulp.task('build', function(cb) {
    runSequence('clean:build', 'sass', 'prefix', 'minify', 'polymerize', 'clean:cleanup', cb);
});

/* Watch task */
gulp.task('default', function() {
    gulp.watch(config.sassFileSources, ['build']);
});
