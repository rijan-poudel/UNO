// Accept a shared room link or a code without silently truncating input.
export function parseRoomCode(value: string): string {
  let code = value.trim();
  try {
    code = new URL(code).searchParams.get('room') ?? code;
  } catch {
    /* Plain room code. */
  }
  return code.toUpperCase().replace(/[\s-]/g, '');
}
export function isRoomCode(value: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(value);
}
