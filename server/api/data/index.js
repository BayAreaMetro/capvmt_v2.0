'use strict';

var express = require('express');
var controller = require('./data.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/years/all', controller.getYears);
router.get('/jurisdictions/all', controller.getJurisdictions);
router.get('/vmt/:model_run/:cityname', controller.getVMTbyJurisdiction);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);

module.exports = router;
