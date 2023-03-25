const exp = 3;
const getLevelFromXp = xp => {
    return Math.floor(Math.pow((xp / exp), 1 / exp));
}

module.exports = getLevelFromXp;