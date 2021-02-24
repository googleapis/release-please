import synthtool as s
import synthtool.gcp as gcp
import logging
logging.basicConfig(level=logging.DEBUG)

AUTOSYNTH_MULTIPLE_COMMITS = True

common_templates = gcp.CommonTemplates()
templates = common_templates.node_library()
s.copy(templates, excludes=[
  'README.md',
  'CONTRIBUTING.md',
  '.eslintignore',
  '.eslintrc.json',
  '.mocharc.js',
  '.prettierignore',
  '.prettierrc',
  '.nycrc',
  '.kokoro/presubmit/node10/system-test.cfg',
  '.kokoro/continuous/node10/system-test.cfg',
  '.kokoro/system-test.sh',
  '.mocharc.js'
])
