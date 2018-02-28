#!/bin/bash

# First argument is path to library result map (map.json)
# Second argument is path to temporary folder to store results

if [[ -z $1 || -z $2 ]]; then
    echo "Not enough arguments"
    echo "First argument needs to be path to library result map (map.json)"
    echo "Second argument needs to be path to temporary folder to store results"
else
    MODELPATH=$1
    TEMPPATH=$2
    node main.js downloadWebsites ./websites.txt $TEMPPATH/websites
    node main.js instrumentWebsites -d $TEMPPATH/websites ./globalWritesAnalysis.js $TEMPPATH/instrumentedWebsites
    node main.js analyzeWebsites -d $TEMPPATH/instrumentedWebsites $TEMPPATH/websiteResults
    node main.js detect -d $TEMPPATH/websiteResults $MODELPATH $TEMPPATH/detectionResults

    echo "See results in $TEMPPATH/detectionResults"
    echo "each JSON there contains libraries that were detected"
fi

