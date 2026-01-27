#!/bin/sh

set -e

if [ -z "$ENV_FILE" ]; then
  echo "missing env var ENV_FILE"
  exit 1
fi

if [ -z "$ENTRYPOINT_CMD" ]; then
  echo "missing env var ENTRYPOINT_CMD"
  exit 1
fi

env_file="$ENV_FILE"
cmd="$ENTRYPOINT_CMD"

vex_env=$(env | grep '^VEX_' | cut -d= -f1)
for env_var in $vex_env
do
  env_val=$(eval echo "\$$env_var")
  echo "window.vexenv.${env_var#VEX_} = '$env_val';" >> "$env_file"
done

if [ "$NODE_ENV" = "development" ]; then
  ls ../../package.json ../*/package.json | entr -rnp bun install --ignore-scripts &
fi

eval "exec $cmd"
