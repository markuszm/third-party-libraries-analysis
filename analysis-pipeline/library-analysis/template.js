const template =
    '<!DOCTYPE html> \
<html> \
<head lang="en"> \
    <meta charset="UTF-8"> \
    <title>Global write analysis</title> \
    <!-- Needed for finding type --> \
    <script type="text/javascript">{{{ jalangiEnv }}} \n {{{globalWritesAnalysis }}} \n {{{ instrumentedCode }}} \n \
    </script> \
</head> \
<body> \
<h2>Analyzing global writes of <!--NAME--></h2> \
</body> \
</html>';

exports.template = template;
