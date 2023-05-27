/**
 *
 * @param xp the xp to get the level from
 * @returns the level after converting the xp
 */
export default function getLevelFromXp(xp: number) {
	const exp = 2
	return Math.floor(Math.pow(xp / exp, 1 / exp)) + 1
}
