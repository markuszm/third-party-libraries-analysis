const template = '<!DOCTYPE html> \
<html> \
<head lang="en"> \
    <meta charset="UTF-8"> \
    <title>Global write analysis</title> \
    <!-- Needed for finding type --> \
    <script type="text/javascript">{{{ underscore }}}</script> \
    \
    <script type="text/javascript">{{{ jalangiEnv }}}</script> \
    \
    <script type="text/javascript">{{{ globalWritesAnalysis }}}</script> \
    <script type="text/javascript">{{{ instrumentedCode }}}</script> \
    \
    <script> \
        J$.analysis.endExecution(); \
    </script> \
</head> \
<body> \
<h2>Analyzing global writes of <!--NAME--></h2> \
</body> \
</html>'

exports.template = template;