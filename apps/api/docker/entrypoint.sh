#!/bin/sh

set -e

if [ -z "$ENTRYPOINT_CMD" ]; then
  echo "missing env var ENTRYPOINT_CMD"
  exit 1
fi

cmd="$ENTRYPOINT_CMD"

if [ "$NODE_ENV" = "development" ]; then
  ls ../../package.json ../*/package.json | entr -rnp bun install --ignore-scripts &
fi

eval "exec $cmd"
