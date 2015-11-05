var gulp = require("gulp");
var builder = require("angular-directive-builder");
var ghPages = require('gh-pages');

gulp.task("default", function() {
    builder.build({
        moduleName: "plainish-text"
    });
});

gulp.task('deploy', function() {
    ghPages.publish(__dirname, {
        src: "./+(index.html|dist)",
        add: true,
        debug: true,
        push: true,
        repo: __dirname
    },
    function(err) {
        if (err) console.log(err);
    });
});