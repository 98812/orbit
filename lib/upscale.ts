/**
 * Google profile photos come back at 96px by default (…=s96-c).
 * Ask for a bigger one so it stays sharp when shown large.
 * Any other URL is returned untouched.
 */
export function upscaleAvatar(url?: string | null, size = 512): string | undefined {
  if (!url) return undefined;

  // googleusercontent: replace the size token at the end
  if (url.includes('googleusercontent.com')) {
    // handles =s96-c, =s96, =w96-h96, -c suffixes etc.
    if (/=s\d+(-c)?$/.test(url)) {
      return url.replace(/=s\d+(-c)?$/, `=s${size}-c`);
    }
    if (/=w\d+-h\d+(-c)?$/.test(url)) {
      return url.replace(/=w\d+-h\d+(-c)?$/, `=s${size}-c`);
    }
    // no size token at all — append one
    if (!url.includes('=')) {
      return `${url}=s${size}-c`;
    }
  }

  return url;
}
