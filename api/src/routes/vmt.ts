import { Router } from 'express';
import { env } from '../env';
import { toHttpError } from '../lib/http-errors';
import { SocrataVmtClient } from '../socrata/vmt';

export const vmtRouter = Router();

const client = new SocrataVmtClient({
  dataset: env.vmtDataKey ?? '',
  username: env.socrataUsername,
  password: env.socrataPassword,
  appToken: env.socrataAppToken,
});

// Fail clearly at request time rather than silently querying Socrata
// with an empty dataset key.
vmtRouter.use((_req, res, next) => {
  if (!env.vmtDataKey) {
    res.status(500).json({ error: 'VMT_DATA_KEY is not configured' });
    return;
  }
  next();
});

vmtRouter.get('/years/all', async (_req, res, next) => {
  try {
    res.json(await client.getModelRunYears());
  } catch (error) {
    next(toHttpError(error));
  }
});

vmtRouter.get('/jurisdictions/all', async (_req, res, next) => {
  try {
    res.json(await client.getJurisdictions());
  } catch (error) {
    next(toHttpError(error));
  }
});

vmtRouter.get('/vmt/:modelRun/:cityName', async (req, res, next) => {
  try {
    res.json(await client.getVmtByJurisdiction(req.params.modelRun, req.params.cityName));
  } catch (error) {
    next(toHttpError(error));
  }
});
