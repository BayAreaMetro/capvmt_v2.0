/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/data              ->  index
 * POST    /api/data              ->  create
 * GET     /api/data/:id          ->  show
 * PUT     /api/data/:id          ->  upsert
 * PATCH   /api/data/:id          ->  patch
 * DELETE  /api/data/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import {Data} from '../../sqldb';


//Socrate configuration
var soda = require("soda-js");
var sodaOpts = {
  username: process.env.SOCRATA_USERNAME,
  password: process.env.SOCRATA_PASSWORD,
  apiToken: process.env.SOCRATA_APP_TOKEN_MTC,
};
// console.log(sodaOpts);

var producer = new soda.Producer('data.bayareametro.gov', sodaOpts);
var consumer = new soda.Consumer('data.bayareametro.gov', sodaOpts);

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      // eslint-disable-next-line prefer-reflect
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Datas
export function index(req, res) {
  return Data.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Data from the DB
export function show(req, res) {
  return Data.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Data in the DB
export function create(req, res) {
  return Data.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// Upserts the given Data in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }

  return Data.upsert(req.body, {
    where: {
      _id: req.params.id
    }
  })
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Data in the DB
export function patch(req, res) {
  if(req.body._id) {
    Reflect.deleteProperty(req.body, '_id');
  }
  return Data.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Deletes a Data from the DB
export function destroy(req, res) {
  return Data.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

// Gets a list of model run years
export function getYears(req, res) {
  var years = [
    {'text':2015,'value':'2015_06_YYY'},
    {'text':2020,'value':'2020_06_694'},
    {'text':2025,'value':'2025_06_YYY'},
    {'text':2030,'value':'2030_06_YYY'},
    {'text':2040,'value':'2040_06_YYY'},
    {'text':2050,'value':'2050_06_YYY'}];

  //remove this block when connecting to Socrata
  res.json(years);
  //end remove block


  //Add ability to get years from a table on Socrata
  // consumer
  //     .query(query)
  //     .withDataset(process.env.VMT_DATA_KEY)
  //     .limit(5000000)
  //     .where(query)
  //     .getRows()
  //     .on('success', function(rows) {
  //       console.log(rows.length);
  //       console.log(query);
  //       res.json(rows);
  //     })
  //     .on('error', function(error) {
  //       console.error(error);
  //       console.log(query);
  //       res.json(error);
  //     });
     
}

export function getJurisdictions(req, res) {
  //Get list of jurisdictions from Socrata VMT table
  consumer
      .query()
      .withDataset(process.env.VMT_DATA_KEY)
      .limit(200)
      .select('cityname')
      .group('cityname')
      .order('cityname')
      .getRows()
      .on('success', function(rows) {
        console.log(rows.length);
        res.json(rows);
      })
      .on('error', function(error) {
        console.error(error);
        res.json(error);
      });
     
}

export function getVMTbyJurisdiction(req, res) {
  //Get VMT data based on model year and jurisdiction from Socrata VMT table
  var model_run = req.params.model_run;
  var cityname = req.params.cityname;

  var query = {
    model_run: model_run,
    cityname: cityname
  }
  consumer
      .query()
      .withDataset(process.env.VMT_DATA_KEY)
      .where(query)
      .limit(200)
      .getRows()
      .on('success', function(rows) {
        console.log(rows.length);
        res.json(rows);
      })
      .on('error', function(error) {
        console.error(error);
        res.json(error);
      });
     
}

