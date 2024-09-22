#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/out/client/src/test"
export CODE_TESTS_WORKSPACE="$(pwd)/packages/client/testFixture"

yarn node "$(pwd)/out/client/src/test/runTest"
