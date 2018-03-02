# Third Party JavaScript Library Detection using Jalangi 2

## Library Detection CLI
See folder `analysis-pipeline`

Detection of third party libraries on websites.
Downloads websites using a scraper and analyses them with Jalangi 2 and a global writes analysis.

Global Writes Analysis from [ConflictJS](https://github.com/sola-da/ConflictJS)

Before detecting libraries a library model needs to be created. Either from analyzing all latest versions of libraries from cdnjs or from downloaded JavaScript files.

Uses [APTED](https://github.com/DatabaseGroup/apted) as tree comparision library

Dockerfile is also included that has all requirements preinstalled to quickly run the cli. Running in docker is not recommended for performance intensive tasks like instrumentation and analysis of libraries/websites. It was not used for the evaluation and was just included if the requirements needed to run all commands of the CLI can't be meet.  

### Requirements:

Requires Node.js (tested with version 9.2.1) and Java 8

Install npm packages with:

`npm install`

### Usage:

The CLI can be run with:

`node main.js <command> [options] <parameters>`

OR

with Docker build the image and run it like this in ./analysis-pipeline folder:

```
docker build -t analysis .
docker run -v <absolute path to temp folder on host machine to store results>:/home/tmp analysis <command> [options] <parameters>
```

When running with docker the paths should be given relative to `/home/tmp` so that it writes it into this folder on the host

In case of memory exception when Jalangi 2 instrumentation takes too much memory, run node with the flag `--max-old-space-size=16384`

e.g.

`node --max-old-space-size=16384 main.js ...`

##### Commands
- fullAnalysis <path>

    Downloads libraries from cdnJS, instruments the libraries and embeds them in a HTML with Jalangi context, serves instrumented library and navigates to it in headless chrome running the analysis and aggregates the results in one map. Parameter `path` is temporary folder to store all files (Libaries stored as JSON, HTMLs and Results - can be reused with other commands later). In the end the library model is stored in `map.json` in that path.

- analyzeInstrumentedLibrary <htmlPath> <destPath>

    Runs the analysis for one HTML that contains the instrumented library with Jalangi context. `htmlPath` is file path to that HTML and `destPath` is folder to store result.

- analyzeLibrary [options] <libraryPath> <destPath>
    
    Instruments library file oder all libraries from a folder, serves instrumented library and navigates to it in headless chrome running the analysis and aggregates the results in a map. `destPath` is folder to store temporary files and result map (`map.json`).
    
    Options:
    
    `-d` : specify when `libraryPath` is a folder path to JavaScript files (one file per library) instead of just a file path to a JavaScript file   

- aggregateResults <resultsPath> <destPath>

    Aggregates results files generated from analysis to a map representing the library model used for library detection. `resultsPath` is folder path where results are stored and `destPath` is folder path where to store the map. End result is the map as `map.json`.

- downloadWebsites <urlsPath> <destPath>

    Downloads websites specified in text file. One website url per line - divide only with line break. `urlsPath` is path to that websites text file (example is `analysis-pipeline/websites.txt`), `destPath` is folder path where to store the websites. 

- instrumentWebsite [options] <websitesPath> <analysisPath> <destPath>

    Instruments a website or multiple websites when directory option is activated. Uses `instrumentFolder` method from Jalangi 2 API. `websitesPath` is either path to folder containing one website or path to folder containing multiple website folders. `analysisPath` is path to global writes analysis - use `analysis-pipeline/globalWritesAnalysis.js`. `destPath` is folder path where to store instrumented websites.
    
    Options:
    
    `-d` : specify when `websitesPath` is a folder path to website folders (one folder per website) instead direct folder path to one website   

- analyzeWebsite [options] <websitesPath> <destPath>

    Analysis a website or multiple websites when directory option is activated. Serves instrumented website with `express` and navigates to it with a headless chrome to run the analysis. `websitesPath` is either path to folder containing one instrumented website or path to folder containing multiple instrumented website folders. `destPath` is folder path where to store the analysis results.

    Options:
    
    `-d` : specify when `websitesPath` is a folder path to instrumented website folders (one folder per website) instead direct folder path to one instrumented website   

- detect [options] <websiteResultPath> <resultMap> <destPath>
    Detects libraries from analysis results. `websiteResultPath` is either path to one analysis result file or a folder path to analysis results. `resultMap` is file path to json file containing the libary model created from analyzing libraries. `destPath` is folder path where to store the detection results. Creates a JSON file per website containing detected libaries with their confidence level.

    Options:

    `-n`: Searches for nested libraries (increases false positives)

    `-v`: Does not filter libaries with low confidence for debug purposes

    `-d`: specify when `websiteResultPath` is a folder path to analysis results instead of a file path to analysis result 

## Reproduce Evaluation
There are 3 bash scripts that run all necessary commands of the CLI to reproduce the evaluation results.
The evaluation was done using all libraries from cdnJS. To reproduce that run `createLibraryModelCDNJS.sh`. This can take a long time so you might only want to run it with a selection of libraries using `createLibraryModelLibrariesFolder.sh`.
The default for running the library detection contains all websites that were used for the evaluation, so to reproduce you can run `runLibraryDetectionOnWebsites.sh` or add additional websites to the website.txt file.

- `createLibraryModelCDNJS.sh <folder path to store model>`
  
    Creates a library model from all libraries hosted on CDNJS. This takes a lot of time (more than 24 hours)
    Model is stored as `map.json`

- `createLibraryModelLibrariesFolder.sh <folder path to libraries> <folder path to store model>`

    Creates a library model from libraries. Put JavaScript files from libraries (single file per library) into folder.
    Model is stored as `map.json`

- `runLibraryDetectionOnWebsites.sh <file path to model> <folder path to store results>`

    Runs library detection on websites specified in /analysis-pipeline/websites.txt (divide websites with line break). Use with model created with one of the above scripts.
    Results are in specified folder as JSON files named with website. The files contain the detected libraries with their confidence level. Minimum confidence level is 70%. 

## Examples
`examples` folder contains:

- example_error
    
    Example for analysis error when a library is analyzed that depends on an other library to run. In this case it is `bootstrap-validator` depending on `jQuery`

- example_website 

    Example for website using two libaries `jQuery` and `underscore`. Can be used to test website downloader, website analysis and library detection. 
