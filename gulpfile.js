const gulp   = require('gulp');
const zip    = require('gulp-zip');
const minify = require('gulp-minify');
const merge  = require('merge-stream');
const del    = require('del');
const fs     = require('fs');

const npm    = JSON.parse(fs.readFileSync('./package.json'));


const destination = 'release/dist/' + npm.version + '/';
const outputZip = 'v' + npm.version + '.zip';

gulp.task('clean', () => { return del([destination, 'release/' + outputZip]); });

gulp.task('build', () => {
    const html = gulp.src(['html/*.html'])
        .pipe(gulp.dest(destination + 'html'));

    const js = gulp.src(['js/*.js', '!js/*.test.js'])
        .pipe(minify({noSource: true, ext: { min: '.js'}}))
        .pipe(gulp.dest(destination + 'js'));

    const css = gulp.src(['css/*', '!css/*.scss'])
        .pipe(gulp.dest(destination + 'css'));

    const data = gulp.src(['data/*'])
        .pipe(gulp.dest(destination + 'data'));

    const images = gulp.src(['images/*'])
        .pipe(gulp.dest(destination + 'images'));

    return merge(html, css, js, data, images);
});

gulp.task('zip', (done) => {
    gulp.src(destination + '**')
        .pipe(zip(outputZip))
        .pipe(gulp.dest('release'));

    done();
});

gulp.task('default', gulp.series('clean', 'build', 'zip'));