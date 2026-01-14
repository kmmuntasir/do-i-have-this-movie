import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'content.js',
    output: {
        file: 'dist/content-bundled.js',
        format: 'iife',
        name: 'ContentScript'
    },
    plugins: [
        resolve()
    ]
};
