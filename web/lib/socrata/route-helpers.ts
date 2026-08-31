import { NextResponse } from 'next/server';
import { env } from '../env';
import { toHttpError } from '../http-errors';
import { SocrataVmtClient } from './vmt';

export const vmtClient = new SocrataVmtClient({
  dataset: env.vmtDataKey ?? '',
  username: env.socrataUsername,
  password: env.socrataPassword,
  appToken: env.socrataAppToken,
});

/**
 * Fails clearly at request time rather than silently querying Socrata
 * with an empty dataset key, and formats thrown errors consistently
 * across the three VMT routes.
 */
export async function handleVmtRequest(run: () => Promise<unknown>): Promise<NextResponse> {
  if (!env.vmtDataKey) {
    return NextResponse.json({ error: 'VMT_DATA_KEY is not configured' }, { status: 500 });
  }

  try {
    return NextResponse.json(await run());
  } catch (error) {
    const httpError = toHttpError(error);
    return NextResponse.json({ error: httpError.message }, { status: httpError.statusCode });
  }
}
