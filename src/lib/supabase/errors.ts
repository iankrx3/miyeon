/** PostgREST / Postgres codes for "this relation is not in the schema". */
export function isMissingRelation(error: { code?: string } | null | undefined): boolean {
  if (!error?.code) return false;
  return error.code === 'PGRST205' || error.code === '42P01';
}

/** PostgREST / Postgres codes for "this function is not in the schema". */
export function isMissingRpc(error: { code?: string } | null | undefined): boolean {
  if (!error?.code) return false;
  return error.code === 'PGRST202' || error.code === '42883';
}
