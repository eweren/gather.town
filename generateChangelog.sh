#!/bin/bash
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

pattern="."
replacement="\."
PACKAGE_VERSION=$(printf '%s\n' "${PACKAGE_VERSION//$pattern/$replacement}")
pattern=" "
replacement=""
PACKAGE_VERSION=$(printf '%s\n' "${PACKAGE_VERSION//$pattern/$replacement}")
CHANGELOG=$(grep -in "" CHANGELOG.md)

RELEASE_STR=$(grep -Eo ".*$PACKAGE_VERSION.*" CHANGELOG.md)
pattern="## "
replacement=""
RELEASE_STR=$(printf '%s\n' "${RELEASE_STR//$pattern/$replacement}")
echo $RELEASE_STR
