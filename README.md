# Third Party JavaScript Library Detection using Jalangi 2

## Library Detection CLI

Detection of third party libraries on websites.
Downloads websites using a scraper and analyses them with Jalangi 2 and a global writes analysis.

Global Writes Analysis from [ConflictJS](https://github.com/sola-da/ConflictJS)

Before detecting libraries a library model needs to be created. Either from analyzing all latest versions of libraries from cdnjs or from downloaded JavaScript files.

Uses [APTED](https://github.com/DatabaseGroup/apted) as tree comparision library

Dockerfile is also included that contains installs all requirements to quickly run the cli

### Requirements:

Requires nodejs (tested with version 9.2.1) and Java 8

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

- analyzeInstrumentedLibrary <htmlPath> <destPath>

- analyzeLibrary [options] <libraryPath> <destPath>

- aggregateResults <resultsPath> <destPath>

- downloadWebsites <urlsPath> <destPath>

- instrumentWebsite [options] <websitesPath> <analysisPath> <destPath>

- analyzeWebsite [options] <websitesPath> <destPath>

- model [options] <resultPath>

- detect [options] <websiteResultPath> <resultMap> <destPath>

#### Bash Scripts 
There are 3 bash scripts that run all necessary commands of the cli

- `createLibraryModelCDNJS.sh <folder path to store model>`
  
    Creates a library model from all libraries hosted on CDNJS. This takes a lot of time (more than 24 hours)
    Model is stored as `map.json`

- `createLibraryModelLibrariesFolder.sh <folder path to libraries> <folder path to store model>`

    Creates a library model from libraries in a folder.
    Model is stored as `map.json`

- `runLibraryDetectionOnWebsites.sh <file path to model> <folder path to store results>`

    Runs library detection on websites specified in /analysis-pipeline/websites.txt (divide websites with line break). Use model created with one of the above scripts.
    Results are in specified folder as JSON files named with website and containing libraries with their confidence level 