/** PostgREST / Postgres codes for "this relation is not in the schema". */
export function isMissingRelation(error: { code?: string } | null | undefined): boolean {
  if (!error?.code) return false;
  return error.code === 'PGRST205' || error.code === '42P01';
}
