#!/usr/bin/env bash

DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus

export CODE_TESTS_PATH="$(pwd)/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/client/testFixture"

node "$(pwd)/client/out/test/runTest" --env DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION_BUS_ADDRESS" --network=host