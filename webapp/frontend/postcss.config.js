const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
    plugins: [
        require('cssnano')({
            preset: 'default',
        }),
        postcssPresetEnv({
                stage: 1,
        }),
    ],
};