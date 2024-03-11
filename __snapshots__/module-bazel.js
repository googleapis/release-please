exports['ModuleBazel updateContent updates version in MODULE.bazel file 1'] = `
module(
    name = "rules_cc",
    version = "0.0.5",
    compatibility_level = 1,
)

bazel_dep(name = "bazel_skylib", version = "1.3.0")
bazel_dep(name = "platforms", version = "0.0.7")

cc_configure = use_extension("@bazel_tools//tools/cpp:cc_configure.bzl", "cc_configure_extension")
use_repo(cc_configure, "local_config_cc_toolchains")

register_toolchains("@local_config_cc_toolchains//:all")

bazel_dep(name = "rules_testing", version = "0.6.0", dev_dependency = True)
`

exports['ModuleBazel updateContent updates version when inline 1'] = `
module(name = "rules_cc", version = "0.0.5")

bazel_dep(name = "bazel_skylib", version = "1.3.0")
bazel_dep(name = "platforms", version = "0.0.7")

cc_configure = use_extension("@bazel_tools//tools/cpp:cc_configure.bzl", "cc_configure_extension")
use_repo(cc_configure, "local_config_cc_toolchains")

register_toolchains("@local_config_cc_toolchains//:all")

bazel_dep(name = "rules_testing", version = "0.6.0", dev_dependency = True)
`

exports['ModuleBazel updateContent updates version when ordered improperly 1'] = `
bazel_dep(name = "bazel_skylib", version = "1.3.0")
bazel_dep(name = "platforms", version = "0.0.7")

cc_configure = use_extension("@bazel_tools//tools/cpp:cc_configure.bzl", "cc_configure_extension")
use_repo(cc_configure, "local_config_cc_toolchains")

module(name = "rules_cc", version = "0.0.5")

register_toolchains("@local_config_cc_toolchains//:all")

bazel_dep(name = "rules_testing", version = "0.6.0", dev_dependency = True)
`
