var program = require('commander');
var analysis = require('./analysis.js');
var fs = require('fs');

program
    .arguments('<code_file> [analysis_files...]')
    .action(function (codeFile, analysisFiles) {
        let code = fs.readFileSync(codeFile, 'utf8');
        analysis.analyzeCodeFile(code, analysisFiles);
    })
    .parse(process.argv);

