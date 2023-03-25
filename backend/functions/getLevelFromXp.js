const exp = 3;
const getLevel = xp => {
    return Math.floor(Math.pow((xp / exp), 1 / exp));
}

module.exports = getLevel;