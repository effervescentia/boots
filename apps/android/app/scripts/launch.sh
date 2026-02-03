#!/bin/bash

export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"

EMULATOR="$ANDROID_HOME/emulator/emulator"
AVD_NAME="Pixel_3a_Google_API_36"
SNAPSHOT_NAME="dev"
SNAPSHOT_DIR="$HOME/.android/avd/$AVD_NAME.avd/snapshots/$SNAPSHOT_NAME"
HOSTS_PATH="config/hosts.txt"

function launch() {
  "$EMULATOR" \
    -avd "$AVD_NAME" \
    -writable-system \
    -netdelay none \
    -netspeed full \
    -no-snapshot-save \
    -qt-hide-window \
    -grpc-use-token \
    -idle-grpc-timeout 300 \
    "$@" \
    >/dev/null &

  adb wait-for-device
}

set -e

if [ -d "$SNAPSHOT_DIR" ]; then
  launch -snapshot "$SNAPSHOT_NAME"
else
  launch -no-snapshot-load

  adb root
  adb remount
  adb push "$(pwd)/$HOSTS_PATH" /system/etc/hosts
  adb reboot
  adb wait-for-device

  while [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" != "1" ]; do sleep 1; done

  adb emu avd snapshot save "$SNAPSHOT_NAME"
fi

../gradlew installDebug --configuration-cache

adb shell am start \
  -n "com.effervescentia.boots/.ui.MainActivity" \
  -a android.intent.action.MAIN \
  -c android.intent.category.LAUNCHER

wait
