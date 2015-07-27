'use strict';
var fs = require('fs');
var path = require('path');
var mkpath = require('mkpath');
var babel = require('babel-core');
var Promise = require('es6-promise').Promise;

module.exports = function (grunt) {

    var writeFile = function writeFile (dest, content, result) {
        return new Promise(function (resolve, reject) {
                    
            mkpath(path.dirname(dest), function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                fs.writeFile(dest, content, function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(result);
                });
            });
        });
    };

    grunt.registerMultiTask('babel', 'Transpile ES6 to ES5', function () {
        var options = this.options();

        var done = this.async();
        var results = [];

        this.files.forEach(function (el) {
            delete options.filename;
            delete options.filenameRelative;

            var result = new Promise(function (resolve, reject) {
                babel.transformFile(el.src[0], options, function (err, result) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(result);
                });
            }).then(function (res) {

                var sourceMappingURL = '';
                if (res.map) {
                    sourceMappingURL = '\n//# sourceMappingURL=' + path.basename(el.dest) + '.map';
                }

                return writeFile(el.dest, res.code + sourceMappingURL + '\n', res);

            }).then(function (res) {

                if (res.map) {
                	return writeFile(el.dest + '.map', JSON.stringify(res.map), res);
                }

            });

            results.push(result);
        });

        Promise.all(results).then(function () {
            done();
        }, function (err) {
            grunt.fail.fatal(err);
        });

    });
};
