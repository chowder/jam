#!/usr/bin/env bash

set -Eeuo pipefail

pushd "$(git rev-parse --show-toplevel)"

pushd static && npm run build && popd

go run . -addr 0.0.0.0:8080
