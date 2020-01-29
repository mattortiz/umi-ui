#!/usr/bin/env node

const shell = require("shelljs");
const { existsSync } = require("fs");
const { join } = require("path");
const { fork } = require("child_process");
const { uiDist } = require("./uiPlugins");

if (
  !shell
    .exec("npm config get registry")
    .stdout.includes("https://registry.npmjs.org/")
) {
  console.error(
    "Failed: set npm registry to https://registry.npmjs.org/ first"
  );
  process.exit(1);
}

const { code: buildCode } = shell.exec("npm run build");
if (buildCode === 1) {
  console.error("Failed: npm run build");
  process.exit(1);
}

const { code: UIBuildCode } = shell.exec("npm run ui:build");
if (UIBuildCode === 1) {
  console.error("Failed: npm run ui:build");
  process.exit(1);
}

// check ui dist umd, or publish will be forbidden
checkUiDist();

const cp = fork(
  join(process.cwd(), "node_modules/.bin/lerna"),
  ["publish"].concat(process.argv.slice(2)),
  {
    stdio: "inherit",
    cwd: process.cwd()
  }
);
cp.on("error", err => {
  console.log(err);
});
cp.on("close", code => {
  console.log("code", code);
  if (code === 1) {
    console.error("Failed: lerna publish");
    process.exit(1);
  }
});

// check dist existed
function checkUiDist() {
  uiDist.forEach(dist => {
    const distPath = join(process.cwd(), dist);
    if (!existsSync(distPath)) {
      console.error(`ui dist: ${distPath} not exist`);
      process.exit(1);
    }
  });
}