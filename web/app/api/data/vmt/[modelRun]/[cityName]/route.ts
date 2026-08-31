import type { NextRequest } from 'next/server';
import { handleVmtRequest, vmtClient } from '@/lib/socrata/route-helpers';

export function GET(_request: NextRequest, ctx: RouteContext<'/api/data/vmt/[modelRun]/[cityName]'>) {
  return handleVmtRequest(async () => {
    const { modelRun, cityName } = await ctx.params;
    return vmtClient.getVmtByJurisdiction(modelRun, cityName);
  });
}
