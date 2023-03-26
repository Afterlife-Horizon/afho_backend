export function getLevelFromXp(xp: number) {
    const exp = 3;
    return Math.floor(Math.pow((xp / exp), 1 / exp));
}
