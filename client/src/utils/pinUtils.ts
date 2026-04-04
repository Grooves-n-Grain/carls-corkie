/**
 * Generates a consistent random rotation angle from a pin's ID.
 * Used to give each pin a slightly different tilt for a natural corkboard look.
 *
 * @param id - The unique pin identifier
 * @param range - The rotation range (default 40 gives -2 to 2 degrees, 60 gives -3 to 3 degrees)
 * @returns Rotation angle in degrees
 */
export function getRotation(id: string, range: number = 40): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return (hash % range - range / 2) / 10;
}
