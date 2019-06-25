// @ts-check
"use strict";

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
    throw err;
});

const http = require("http");
const https = require("https");
const proxy = require("http-proxy-middleware");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const paths = require("../config/paths");
const webpackConfig = require("../config/webpack.config");

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const viewerTarget = process.env.VIEWER_URL || "https://webzoo.latitudegeo.com/webviewer";

const compiler = webpack(webpackConfig);
const serverConfig = {
    before: function(app) {
        app.use(
            proxy("/viewer", {
                target: viewerTarget,
                agent: viewerTarget.startsWith("https") ? httpsAgent : httpAgent,
                changeOrigin: true,
                logLevel: "warn",
                secure: false,
                pathRewrite: {
                    // Strip /viewer from path so it isn't forwarded to the target
                    // /viewer/index.html => /index.html => https://apps.geocortex.com/webviewer/index.html
                    "^/viewer": "",
                },
            })
        );
    },
    clientLogLevel: "silent",
    compress: true,
    contentBase: paths.projPublicDir,
    disableHostCheck: true,
    headers: {
        "Access-Control-Allow-Origin": "*",
    },
    // Allow binding to any host (localhost, jdoe-pc.latitudegeo.com, etc).
    host: "0.0.0.0",
    hot: true,
    open: true,
    port: 3000,
    // publicPath: "/",
    stats: "minimal",
    // watchContentBase: true,
};

const devServer = new WebpackDevServer(compiler, serverConfig);
devServer.listen(serverConfig.port, serverConfig.host, err => {
    if (err) {
        throw err;
    }
});

["SIGINT", "SIGTERM"].forEach(function(sig) {
    process.on(sig, function() {
        devServer.close();
        process.exit();
    });
});