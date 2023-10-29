#!/bin/bash
TAG=$1
if [ -z "$1" ]; then
  echo "publish: you must provide a valid tag"
  exit 1
fi

VSIX_URL="https://github.com/uqbar-project/wollok-lsp-ide/releases/download/v$TAG/wollok-lsp-ide-$TAG.vsix"
wget_output=$(wget -q "$VSIX_URL")
if [ $? -ne 0 ]; then
  echo "publish: problems while trying to get $VSIX_URL."
  echo "Please make sure it is a valid tag and you followed convention rules: if version is 0.1.0 the tag should be v0.1.0"
  exit 2
fi

npm i -g vsce
vsce publish
