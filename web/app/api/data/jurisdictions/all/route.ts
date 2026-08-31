import { handleVmtRequest, vmtClient } from '@/lib/socrata/route-helpers';

export function GET() {
  return handleVmtRequest(() => vmtClient.getJurisdictions());
}
