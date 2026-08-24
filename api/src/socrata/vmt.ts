import { SocrataClient, type SocrataConfig } from './client';

export type SocrataVmtClientConfig = SocrataConfig;

/**
 * Typed replacement for the ad hoc soda-js queries in
 * server/api/data/data.controller.js. Returns whatever fields the
 * Socrata dataset has for a row — including a future commercial-vehicle
 * field, once the dataset owner adds one — without needing a code
 * change here (see docs/superpowers/specs/2026-08-14-modernization-design.md,
 * "Vehicle type scope").
 */
export class SocrataVmtClient {
  private client: SocrataClient;

  constructor(config: SocrataVmtClientConfig) {
    this.client = new SocrataClient(config);
  }

  /** Replaces the legacy #getJurisdictions select/group/order/limit query. */
  getJurisdictions() {
    return this.client.query({
      $select: 'cityname',
      $group: 'cityname',
      $order: 'cityname',
      $limit: '200',
    });
  }

  /** Replaces the legacy #getVMTbyJurisdiction where/limit query. */
  getVmtByJurisdiction(modelRun: string, cityName: string) {
    return this.client.query({
      model_run: modelRun,
      cityname: cityName,
      $limit: '200',
    });
  }

  /**
   * Finishes the migration the legacy code left commented out in
   * #getYears — today that endpoint returns a hardcoded array instead
   * of querying Socrata.
   */
  getModelRunYears() {
    return this.client.query({
      $select: 'model_run',
      $group: 'model_run',
      $order: 'model_run',
    });
  }
}
