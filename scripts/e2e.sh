#!/usr/bin/env bash

export ELECTRON_RUN_AS_NODE=1
export CODE_TESTS_PATH="$(pwd)/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/client/testFixture"

node "$(pwd)/client/out/test/runTest" --ms-enable-electron-run-as-node 