import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

/**
 * Wrapper asynchrone de la fonction native `scrypt` de Node.js.
 * Évite d'utiliser `scryptSync` qui bloquerait l'event loop pendant le calcul.
 */
const scryptAsync = promisify(scrypt);

/**
 * Hache un mot de passe en clair avec l'algorithme scrypt.
 *
 * Génère un sel aléatoire de 16 octets pour chaque appel, ce qui garantit
 * que deux mots de passe identiques produiront des hashes différents.
 *
 * Format du hash stocké : `<sel_hex>.<clé_dérivée_hex>`
 *
 * @param password - Mot de passe en clair à hacher.
 * @returns Hash formaté `salt.derivedKey` prêt à être stocké en base.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}.${derivedKey.toString('hex')}`;
}

/**
 * Vérifie qu'un mot de passe en clair correspond à un hash stocké.
 *
 * Utilise `timingSafeEqual` pour la comparaison finale afin de prévenir
 * les attaques par timing (timing attacks) — le temps de comparaison est
 * constant quelle que soit la position de la différence.
 *
 * @param password - Mot de passe en clair soumis par l'utilisateur.
 * @param storedHash - Hash au format `salt.derivedKey` stocké en base.
 * @returns `true` si le mot de passe correspond, `false` sinon.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split('.');

  // Hash invalide ou malformé
  if (!salt || !key) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, 'hex');

  // Comparaison en temps constant pour prévenir les timing attacks
  return timingSafeEqual(storedKey, derivedKey);
}
