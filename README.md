# third-party-libraries-analysis

## Analysis Pipeline
Runs analysis for all latest versions of libraries from cdnjs.

Requires nodejs (tested with version 9.2.1) and Java 8

#### First install requirements with:

``` npm install ```

#### Usage:
Analysis CLI can be run with: 

``` node main.js <command> [options] <parameters>```

TODO: explain all commands

In the case of memory exception run the cli with the option ``--max-old-space-size=16384`` because Jalangi instrumentation takes more memory than the nodeJS default specifies.