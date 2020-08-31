#!/bin/bash

set -e

for i in {0..3}; do
  npm start ".env$i" &
  sleep 1
done
