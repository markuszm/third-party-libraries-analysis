#!/bin/bash

# First argument is path to libraries folder containing JavaScript files
# Second argument is path to temporary folder to store results

if [[ -z $1 || -z $2 ]]; then
    echo "Not enough arguments"
    echo "First argument needs to be path to libraries folder containing JavaScript files"    
    echo "Second argument needs to be path to temporary folder to store results"
else
    LIBRARIESPATH=$1
    TEMPPATH=$2
    node main.js analyzeLibrary -d $LIBRARIESPATH $TEMPPATH
    echo "Library model stored in $TEMPPATH/map.json"
    echo "Use this file as model to detect libraries"
fi
