const { createApp } = require("./app");
const { getConfig } = require("./config");
const logger = require("./logger");

const config = getConfig();
const app = createApp(config);

app.listen(config.port, () => {
  logger.info("Server listening", {
    port: config.port
  });
});
