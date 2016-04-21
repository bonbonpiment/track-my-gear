var gulp = require('gulp');
var copy = require('gulp-copy');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('copy', function() {
  gulp.src([
    './bower_components/ng-cordova-beacon.js',
    './bower_components/angular/angular.min.js',
    './bower_components/angular/angular.min.js.map',
    './bower_components/angular-translate/angular-translate.min.js',
    './bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
    './bower_components/angular-moment/angular-moment.min.js',
    './bower_components/angular-moment/angular-moment.min.js.map',
    './bower_components/ionic/js/ionic.bundle.min.js',
    './bower_components/ionic/fonts/*.*',
    './bower_components/moment/min/moment.min.js',
    './bower_components/ngCordova/dist/ng-cordova.min.js'
  ], {base: './bower_components'})
  .pipe(gulp.dest('./www/lib'));
});