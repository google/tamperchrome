#!/bin/bash

cd "$(dirname "$0")"
for patch in *.patch; do
    file=${patch%.patch}
    patch $file $patch
done
