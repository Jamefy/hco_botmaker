const express = require("express");
const { getReadiness } = require("../services/readiness");

function createHealthRouter(config) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({
      status: "ok",
      service: "hco-botmaker",
      timestamp: new Date().toISOString()
    });
  });

  router.get("/ready", (req, res) => {
    const readiness = getReadiness(config);
    res.status(readiness.status === "ready" ? 200 : 503).json(readiness);
  });

  return router;
}

module.exports = {
  createHealthRouter
};
