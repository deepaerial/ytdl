const { merge } = require('webpack-merge'); 
const base = require('./webpack.base.js') 

module.exports = merge(base, {
    mode: 'development',
    devtool: 'inline-source-maps',
    devServer: {
        historyApiFallback: true
    },
})