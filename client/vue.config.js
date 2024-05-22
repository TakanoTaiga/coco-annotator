module.exports = {
  devServer: {
    disableHostCheck: true,
    proxy: {
      "/api/*": {
        target: "http://webserver:6400/api/",
        changeOrigin: true,
        pathRewrite: {
          "^/api": ""
        }
      },
      "/socket.io*": {
        target: "http://webserver:6400/socket.io",
        changeOrigin: true,
        pathRewrite: {
          "^/socket.io": ""
        }
      }
    }
  },
  lintOnSave: undefined,
  runtimeCompiler: true
};
