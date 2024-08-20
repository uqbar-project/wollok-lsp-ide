#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/packages/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/packages/client/testFixture"

yarn node "$(pwd)/packages/client/out/test/runTest"
