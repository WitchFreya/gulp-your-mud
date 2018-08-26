const config = require('./package.json').gulpConfig;

const paths = config.paths;
paths.local = process.env.MUD_PATH_LOCAL || paths.local;
paths.hackmud = process.env.MUD_PATH_HACKMUD || paths.hackmud;
const users = (process.env.MUD_USERS) ? process.env.MUD_USERS.split(' ') : config.users;
const doTransform = process.env.MUD_DO_TRANSFORM || config.doTransform;

const gulp = require('gulp'),
    multiDest = require('gulp-multi-dest'),
    replace = require('gulp-replace'),
    decomment = require('gulp-decomment'),
    clean = require('gulp-clean'),
    lazypipe = require('lazypipe');

//#region Build
/**
 * Add to pipeline to remove all comments from a valid JS
 * file (other than the autocomplete comments on the first line),
 * replace instances of $db/$fs/other internal function calls with 
 * '#' to be parsed by Hackmud's engine, and remove the function 
 * name from the top of the file. Basically, convert a file
 * containing valid JavaScript into Hackmud-parsable. 
 * @function toSeanJs 
 */
const toSeanJs = (() => {
    if (doTransform !== false) return lazypipe()
        .pipe(decomment, {
            ignore: /\/\/.+?\r?\n/
        })
        .pipe(replace, /\$([A-Za-z]+?\.|[A-Z]+?)/g, '#$1')
        .pipe(replace, /(function).+?\(/, '$1 (');
    else return lazypipe()
        .pipe(decomment, {
            ignore: /\/\/.+?\r?\n/
        });
})();

const fromSeanJs = (() => {
    return doTransform !== false ? lazypipe()
        .pipe(replace, /#/g, '\$')
        .pipe(replace, /(function)(.+?)$/m, '$1 wrapper$2') : lazypipe();
})();


//#region Local
gulp.task('build:local:scripts:users', done => {
    users.forEach(user => gulp.src(paths.local + `js/${user}/*.js`)
        .pipe(toSeanJs())
        .pipe(gulp.dest(`./build/${user}/scripts`))
    );
    done();
});

gulp.task('build:local:scripts:shared', () => gulp.src(paths.local + 'js/*.js')
    .pipe(toSeanJs())
    .pipe(multiDest(users.map(user => `./build/${user}/scripts`)))
);

gulp.task('build:local', gulp.parallel(['build:local:scripts:users', 'build:local:scripts:shared']));
//#endregion

//#region Remote
gulp.task('build:remote:scripts:users', done => {
    users.forEach(user => gulp.src(paths.local + `/${user}/*.js`)
        .pipe(toSeanJs())
        .pipe(gulp.dest(`${paths.hackmud}/${user}/scripts`))
    );
    done();
});

gulp.task('build:remote:scripts:shared', () => gulp.src(paths.local + '/*.js')
    .pipe(toSeanJs())
    .pipe(multiDest(users.map(user => paths.hackmud + `/${user}/scripts`)))
);

gulp.task('build:remote', gulp.parallel(['build:remote:scripts:users', 'build:remote:scripts:shared']));
//#endregion

gulp.task('build', gulp.parallel(['build:local', 'build:remote']));
//#endregion

//#region Clean
gulp.task('clean:local', () => gulp.src("./build", {
    allowEmpty: true
}).pipe(clean()));
gulp.task('clean:remote', () => gulp.src(paths.hackmud + "/**/scripts").pipe(clean({
    force: true
})));
gulp.task('clean', gulp.parallel(['clean:local', 'clean:remote']));
//#endregion

//#region Watch
gulp.task('watch:build:remote', () => gulp.watch(paths.local + '/**/*', gulp.parallel(['build:remote'])))
gulp.task('watch:build:local', () => gulp.watch(paths.local + '/**/*', gulp.parallel(['build:local'])));
gulp.task('watch', () => gulp.watch(paths.local + '/**/*', gulp.parallel(['build:remote', 'build:local'])))
//#endregion

gulp.task('rebuild', gulp.series(['clean'], ['build']));

gulp.task('default', gulp.parallel(['watch:build:remote']));

gulp.task('import', done => {
    users.forEach(
        user => gulp.src(paths.hackmud + '/' + user + "/scripts/*.js")
            .pipe(fromSeanJs())
            .pipe(gulp.dest(paths.local + '/' + user))
    );
    done();
});