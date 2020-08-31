#!/bin/bash

set -e

for i in {0..4}; do
  npm start ".env$i" &
done
