#!/bin/bash
TAG=$1
if [ -z "$1" ]; then
  echo "publish: you must provide a valid tag"
  exit 1
fi

BASE_URL="https://github.com/uqbar-project/wollok-lsp-ide/releases/download/v$TAG/"
VSIX_FILE="wollok-lsp-ide-$TAG.vsix"
wget_output=$(wget -q -O $VSIX_FILE "$BASE_URL$VSIX_FILE")
if [ $? -ne 0 ]; then
  echo "publish: problems while trying to get $BASE_URL$VSIX_FILE."
  echo "Please make sure it is a valid tag and you followed convention rules: if version is 0.1.0 the tag should be v0.1.0"
  exit 2
fi

if ! grep -q -F $TAG "package.json"; then
  echo "publish: version $TAG does not match package.json"
  exit 3
fi

if ! grep -q -F $TAG "CHANGELOG.md"; then
  echo "publish: version $TAG missing in CHANGELOG.md"
  exit 4
fi

echo "Everything ok. Publishing $TAG in Marketplace..."
npm i -g vsce
vsce publish
echo "Check new version in https://marketplace.visualstudio.com/manage/publishers/uqbar"
