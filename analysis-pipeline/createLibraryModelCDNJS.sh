#!/bin/bash

# First argument is path to temporary folder to store results

if [[ -z "$1" ]]; then
    echo "Not enough arguments"
    echo "First argument needs to be path to temporary folder to store results"
else
    TEMPPATH=$1
    node main.js fullAnalysis $TEMPPATH

    echo "Library model stored in $TEMPPATH/map.json"
    echo "Use this file as model to detect libraries"
fi

