#!/usr/bin/env bash

VERSION_FILE=".cache-version"
HTML_FILE="index.html"

# Read current version
if [ ! -f "$VERSION_FILE" ]; then
  echo 1 > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE")
NEW_VERSION=$((VERSION + 1))

# Replace cache version in index.html
sed -i.bak -E "s/\?cache=[0-9]+/?cache=$NEW_VERSION/g" "$HTML_FILE"

# Save new version
echo "$NEW_VERSION" > "$VERSION_FILE"

echo "Cache version updated: $VERSION → $NEW_VERSION"
