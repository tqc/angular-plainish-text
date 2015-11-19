var gulp = require("gulp");
var builder = require("angular-directive-builder");
var ghPages = require('gh-pages');
var path = require("path");
var server = require('gulp-develop-server');
var chokidar = require('chokidar');

gulp.task("default", function() {
    builder.build({
        moduleName: "plainish-text"
    }, function(err) {
        gulp.src(["demo/**", "dist/**"])
            .pipe(gulp.dest("build"));
    });
});

gulp.task('deploy', ["default"], function() {
    ghPages.publish(path.join(__dirname, "/build"), {
        add: true,
        debug: true,
        push: true
    },
        function(err) {
            if (err) console.log(err);
        });
});

gulp.task("watch", ["default"], function() {
    server.listen({
        path: './server.js'
    });
    var watcher = chokidar.watch(["./src/**", "./demo/**"], {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true
    });

    watcher.on("all", function(type, file) {
        console.log(type + " event for " + file);
        gulp.run("default");
    });
});
