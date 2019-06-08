import synthtool as s
import synthtool.gcp as gcp
import logging
logging.basicConfig(level=logging.DEBUG)
common_templates = gcp.CommonTemplates()
templates = common_templates.node_library()
s.copy(templates, excludes=[
  '.eslintignore',
  '.eslintrc.yml',
  '.prettierignore',
  '.prettierrc',
  '.nycrc',
  '.kokoro/presubmit/node10/system-test.cfg',
  '.kokoro/continuous/node10/system-test.cfg',
  '.kokoro/continuous/node10/test.cfg',
  '.kokoro/system-test.sh',
  '.kokoro/test.sh'
])
