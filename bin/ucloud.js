
var rest = require('restler')
    , fs = require('fs')
    , mime = require('mime')
    , _ = require('lodash');
var AUTH_URL = 'https://api.ucloudbiz.olleh.com/storage/v1/auth';

function UcloudStorage(userid, apikey, options) {
    this._authParam = {
        'X-Storage-User': userid,
        'X-Storage-Pass': apikey
    };
    this.token = '';
    this.tokenExpires = new Date();
    this.storageUrl = '';
    this.dataType = options && options.dataType ? options.dataType : 'json';
}

UcloudStorage.prototype = {
    authentication: function () {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (this.token && this.tokenExpires > Date.now()) {
                resolve()
            }

            rest.get(AUTH_URL, {headers: _this._authParam})
                .on('complete', function (result, response) {
                    if (response.headers['x-auth-token']) {
                        var serverTime = new Date(response.headers['date']);
                        var serverTimeSeconds = serverTime.getTime();
                        var tokenExpireSeconds = parseInt(response.headers['x-auth-token-expires']);

                        _this.token = response.headers['x-auth-token'];
                        _this.tokenExpires = new Date((serverTimeSeconds + tokenExpireSeconds) * 1000);
                        _this.storageUrl = response.headers['x-storage-url'];

                        resolve();
                    }
                    else {
                        reject(result instanceof Error ? result : new Error('Unable to authentication'));
                    }
                });
        });
    },

    getObject: function (targetStorage, name) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (!_this.token || _this.tokenExpires <= Date.now()) {
                reject(new Error('Token invalid'));
            }
            else {
                const completeUrl = _.join([_this.storageUrl, targetStorage, _.escape(name)], '/');

                rest.get(completeUrl, {headers: {'X-Auth-Token': _this.token}})
                    .on('complete', function (result) {
                        if (result instanceof Error) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
            }
        });
    },

    createObject: function (targetStorage, file) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (!_this.token || _this.tokenExpires <= Date.now()) {
                reject(new Error('Token invalid'));
            }

            if (!file.path) {
                reject(new Error('Not found file path'));
            }

            fs.readFile(file.path, null, function (err, data) {
                if (err) {
                    reject(err);
                }

                const pathParts = file.path.split('/');
                const filename = file.filename || pathParts[pathParts.length - 1];
                const completeUrl = _.join([_this.storageUrl, targetStorage, filename], '/');
                var options = {
                    headers: {
                        'X-Auth-Token': _this.token,
                        'Content-Length': data.length,
                        'Content-Type': file.mimetype || mime.lookup(filename)
                    },
                    data: data
                };

                rest.put(completeUrl, options)
                    .on('complete', function (result) {
                        if (result instanceof Error) {
                            console.log(result.message);
                            reject(err);
                        }
                        else {
                            console.log(result);
                            resolve({path: completeUrl});
                        }
                    });
            });
        });
    },

    removeObject: function (targetStorage, name) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (!_this.token || _this.tokenExpires <= Date.now()) {
                reject(new Error('Token invalid'));
            }
            else {
                const completeUrl = _.join([_this.storageUrl, targetStorage, _.escape(name)], '/');

                rest.del(completeUrl, {headers: {'X-Auth-Token': _this.token}})
                    .on('complete', function (result) {
                        if (result instanceof Error) {
                            console.log(result.message);
                            reject(result);
                        }
                        else {
                            resolve();
                        }
                    });
            }
        });
    },

    removeObjectPath: function (path) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (!_this.token || _this.tokenExpires <= Date.now()) {
                reject(new Error('Token invalid'));
            }
            else {
                rest.del(path, {headers: {'X-Auth-Token': _this.token}})
                    .on('complete', function (result) {
                        if (result instanceof Error) {
                            console.log(result.message);
                            reject(result);
                        }
                        else {
                            resolve();
                        }
                    });
            }
        });
    }
};

module.exports = UcloudStorage;