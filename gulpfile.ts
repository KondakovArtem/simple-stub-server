import {task, watch, series, parallel, dest, src} from 'gulp';
import ts from 'gulp-typescript';
import sourcemaps from 'gulp-sourcemaps';
// @ts-ignore
// import javascriptObfuscator from 'gulp-javascript-obfuscator';

import del from 'del';
const BUILD_FOLDER = 'dist';

/* COMMON */

task('clean', () => {
  return del(BUILD_FOLDER);
});

/* TYPESCRIPT */
const tsProject = ts.createProject('tsconfig.prod.json');

task('ts', () => {
  const tsResult = tsProject
    .src() // src(['src/**/*.ts'])
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.'))
    .pipe(dest(BUILD_FOLDER));
  return tsResult;
});

task('uglify', () => {
  return (
    src(`${BUILD_FOLDER}/**/*.js`)
      // .pipe(
      //   // javascriptObfuscator({
      //   //   stringArrayEncoding: ['base64'],
      //   // }),
      // )
      .pipe(dest((file) => file.base))
  );
  //.pipe(dest('./*.js'))
});

task('package.json', () => {
  return src(['package.json', 'README.md']) // src(['src/**/*.ts'])
    .pipe(dest(BUILD_FOLDER));
});

task('stub', () => {
  return src(['stub/**/*']) // src(['src/**/*.ts'])
    .pipe(dest(`${BUILD_FOLDER}/stub`));
});

task('watchTs', () => {
  watch(['src/**/*.ts', 'src/**/*.d.ts'], series('ts'));
});

/* DEFAULT/ENTRY */
task('build', series('clean', 'ts', /*'uglify',*/ 'package.json', 'stub'));
task('watch', parallel(['watchTs']));
task('default', series('build'));
