var rest = require('restler')
    , fs = require('fs')
    , _ = require('lodash');
var AUTH_URL = 'https://api.ucloudbiz.olleh.com/storage/v1/auth';

function UcloudStorage(userid, apikey, options) {
    this._authParam = {
        'X-Storage-User': userid,
        'X-Storage-Pass': apikey
    };
    this.token = '';
    this.tokenExpires = new Date();
    this.baseUrl = '';
    this.storageUrl = '';
    this.dataType = options && options.dataType ? options.dataType : 'json';
}

UcloudStorage.prototype = {
    authentication: function (options) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (this.token && this.tokenExpires > Date.now()) {
                resolve()
            }

            rest.get(AUTH_URL, {headers: _this._authParam})
                .on('error', function (err, response) {
                    reject(new Error('Unable to authentication: ' + err.status));
                })
                .on('complete', function (data, response) {
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
                        reject(new Error('Unable to authentication'));
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
                    .on('error', function (err, response) {
                        reject(err);
                    })
                    .on('complete', function (result, response) {
                        resolve(result);
                    });
            }
        });
    },

    createObject: function (targetStorage, file) {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (!_this.token || _this.tokenExpires <= Date.now()) {
                reject(new Error('Token invalid'));
                return;
            }

            fs.readFile(file.path, null, function (err, data) {
                if (err) {
                    reject(err);
                    return;
                }

                const completeUrl = _.join([_this.storageUrl, targetStorage, file.filename + '-' + _.escape(file.originalname)], '/');
                const options = {
                    headers: {
                        'X-Auth-Token': _this.token,
                        'Content-Type': file.mimetype,
                        'Content-Length': file.size
                    },
                    data: data
                };

                rest.put(completeUrl, options)
                    .on('error', function (err, response) {
                        reject(err);
                    })
                    .on('complete', function (result, response) {
                        resolve({path: completeUrl});
                    });
            });
        });
    },

    removeObject: function () {
        var _this = this;

        return new Promise(function (resolve, reject) {
            if (!_this.token || _this.tokenExpires <= Date.now()) {
                reject(new Error('Token invalid'));
            }
            else {
                const completeUrl = _.join([_this.storageUrl, targetStorage, _.escape(name)], '/');

                rest.delete(completeUrl, {headers: {'X-Auth-Token': _this.token}})
                    .on('error', function (err, response) {
                        reject(err);
                    })
                    .on('complete', function (result, response) {
                        resolve();
                    });
            }
        });
    }
};

module.exports = UcloudStorage;