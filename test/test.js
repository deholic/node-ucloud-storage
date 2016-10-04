/**
 * Created by intobook on 2016. 10. 4..
 */
const assert = require('assert')
    , fs = require('fs');
const Ucloud = require('../index');

describe('Object Test', function() {
     it('should be uploaded file', function() {
         const client = new Ucloud('api_key', 'api_secret');
         return client
             .authentication()
             .then(function() {

             })

     });
});