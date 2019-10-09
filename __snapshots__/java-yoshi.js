exports['CHANGELOG'] = `
# Changelog

### [0.20.4](https://www.github.com/googleapis/java-trace/compare/v0.20.3...v0.20.4) 


### Bug Fixes

* Fix declared dependencies from merge issue ([#291](https://www.github.com/googleapis/java-trace/issues/291)) ([35abf13](https://www.github.com/googleapis/java-trace/commit/35abf13))

`

exports['README'] = `
# Google Cloud Java Client for Stackdriver Trace

Java idiomatic client for [Stackdriver Trace][stackdriver-trace].

[![Maven](https://img.shields.io/maven-central/v/com.google.cloud/google-cloud-trace.svg)](https://img.shields.io/maven-central/v/com.google.cloud/google-cloud-trace.svg)

- [Product Documentation][trace-product-docs]
- [Client Library Documentation][trace-client-lib-docs]

> Note: This client is a work-in-progress, and may occasionally
> make backwards-incompatible changes.

## Quickstart

[//]: # ({x-version-update-start:google-cloud-trace:released})
If you are using Maven, add this to your pom.xml file
\`\`\`xml
<dependency>
  <groupId>com.google.cloud</groupId>
  <artifactId>google-cloud-trace</artifactId>
  <version>0.108.1-beta</version>
</dependency>
\`\`\`
If you are using Gradle, add this to your dependencies
\`\`\`Groovy
compile 'com.google.cloud:google-cloud-trace:0.108.1-beta'
\`\`\`
If you are using SBT, add this to your dependencies
\`\`\`Scala
libraryDependencies += "com.google.cloud" % "google-cloud-trace" % "0.108.1-beta"
\`\`\`
[//]: # ({x-version-update-end})

## Authentication

See the [Authentication](https://github.com/googleapis/google-cloud-java#authentication) section in the base directory's README.

## About Stackdriver Trace

[Stackdriver Trace][stackdriver-trace] is a distributed tracing system that collects latency data from your applications and displays it in the Google Cloud Platform Console. You can track how requests propagate through your application and receive detailed near real-time performance insights.

See the [Trace client library docs][trace-client-lib-docs] to learn how to use this client library.

## Getting Started

### Prerequisites

You will need a [Google Developers Console](https://console.developers.google.com/) project with the Stackdriver Trace API enabled. [Follow these instructions](https://cloud.google.com/resource-manager/docs/creating-managing-projects) to get your project set up. You will also need to set up the local development environment by [installing the Google Cloud SDK](https://cloud.google.com/sdk/) and running the following commands in command line: \`gcloud auth login\` and \`gcloud config set project [YOUR PROJECT ID]\`.

### Installation and setup

You'll need to obtain the \`google-cloud-trace\` library.  See the [Quickstart](#quickstart) section to add \`google-cloud-trace\` as a dependency in your code.

## Troubleshooting

To get help, follow the instructions in the [shared Troubleshooting document](https://github.com/googleapis/google-cloud-common/blob/master/troubleshooting/readme.md#troubleshooting).

## Transport

Trace uses gRPC for the transport layer.

## Java Versions

Java 7 or above is required for using this client.

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

It is currently in major version zero (\`\`0.y.z\`\`), which means that anything may change at any time and the public API should not be considered stable.

## Contributing

Contributions to this library are always welcome and highly encouraged.

See \`google-cloud\`'s [CONTRIBUTING] documentation and the [shared documentation](https://github.com/googleapis/google-cloud-common/blob/master/contributing/readme.md#how-to-contribute-to-gcloud) for more information on how to get started.

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms. See [Code of Conduct][code-of-conduct] for more information.

## License

Apache 2.0 - See [LICENSE] for more information.

## CI Status

Java Version | Status
------------ | ------
Java 7 | [![Kokoro CI](https://storage.googleapis.com/cloud-devrel-public/java/badges/java-trace/java7.svg)](https://storage.googleapis.com/cloud-devrel-public/java/badges/java-trace/java7.html)
Java 8 | [![Kokoro CI](https://storage.googleapis.com/cloud-devrel-public/java/badges/java-trace/java8.svg)](https://storage.googleapis.com/cloud-devrel-public/java/badges/java-trace/java8.html)
Java 11 | [![Kokoro CI](https://storage.googleapis.com/cloud-devrel-public/java/badges/java-trace/java11.svg)](https://storage.googleapis.com/cloud-devrel-public/java/badges/java-trace/java11.html)


[CONTRIBUTING]:https://github.com/googleapis/google-cloud-java/blob/master/CONTRIBUTING.md
[code-of-conduct]:https://github.com/googleapis/google-cloud-java/blob/master/CODE_OF_CONDUCT.md#contributor-code-of-conduct
[LICENSE]: https://github.com/googleapis/google-cloud-java/blob/master/LICENSE
[cloud-platform]: https://cloud.google.com/
[stackdriver-trace]: https://cloud.google.com/trace/
[trace-product-docs]: https://cloud.google.com/trace/docs/
[trace-client-lib-docs]: https://googleapis.dev/java/google-cloud-clients/latest/index.html?com/google/cloud/trace/v1/package-summary.html

`

exports['versions'] = `
# Format:
# module:released-version:current-version

google-cloud-trace:0.108.1-beta:0.108.1-beta
grpc-google-cloud-trace-v1:0.73.1:0.73.1
grpc-google-cloud-trace-v2:0.73.1:0.73.1
proto-google-cloud-trace-v1:0.73.1:0.73.1
proto-google-cloud-trace-v2:0.73.1:0.73.1
`

exports['pom'] = `
<?xml version='1.0' encoding='UTF-8'?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.google.cloud</groupId>
  <artifactId>google-cloud-trace-parent</artifactId>
  <packaging>pom</packaging>
  <version>0.108.1-beta</version><!-- {x-version-update:google-cloud-trace:current} -->
  <name>Google Cloud Trace Parent</name>
  <url>https://github.com/googleapis/java-core</url>
  <description>
    Java idiomatic client for Google Cloud Platform services.
  </description>

  <parent>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-shared-config</artifactId>
    <version>0.1.1</version>
  </parent>

  <developers>
    <developer>
      <id>garrettjonesgoogle</id>
      <name>Garrett Jones</name>
      <email>garrettjones@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>pongad</id>
      <name>Michael Darakananda</name>
      <email>pongad@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>shinfan</id>
      <name>Shin Fan</name>
      <email>shinfan@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>michaelbausor</id>
      <name>Micheal Bausor</name>
      <email>michaelbausor@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>vam-google</id>
      <name>Vadym Matsishevskyi</name>
      <email>vam@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>tswast</id>
      <name>Tim Swast</name>
      <email>tswast@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>neozwu</id>
      <name>Neo Wu</name>
      <email>neowu@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>lesv</id>
      <name>Les Vogel</name>
      <email>lesv@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>schmidt_sebastian</id>
      <name>Sebastian Schmidt</name>
      <email>mrschmidt@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>andreamlin</id>
      <name>Andrea Lin</name>
      <email>andrealin@google.com</email>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>hzyi-google</id>
      <name>Hanzhen Yi</name>
      <email>hzyi@google.com</email>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
  </developers>
  <organization>
    <name>Google LLC</name>
  </organization>
  <scm>
    <connection>scm:git:git@github.com:googleapis/java-core.git</connection>
    <developerConnection>scm:git:git@github.com:googleapis/java-core.git</developerConnection>
    <url>https://github.com/googleapis/java-core</url>
    <tag>HEAD</tag>
  </scm>
  <issueManagement>
    <url>https://github.com/googleapis/java-core/issues</url>
    <system>GitHub Issues</system>
  </issueManagement>
  <distributionManagement>
    <snapshotRepository>
      <id>sonatype-nexus-snapshots</id>
      <url>https://oss.sonatype.org/content/repositories/snapshots</url>
    </snapshotRepository>
    <repository>
      <id>sonatype-nexus-staging</id>
      <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
    </repository>
  </distributionManagement>
  <licenses>
    <license>
      <name>Apache-2.0</name>
      <url>https://www.apache.org/licenses/LICENSE-2.0.txt</url>
    </license>
  </licenses>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <github.global.server>github</github.global.server>
    <site.installationModule>google-cloud-trace-parent</site.installationModule>
    <google.core.version>1.90.0</google.core.version>
    <google.api-common.version>1.8.1</google.api-common.version>
    <google.common-protos.version>1.16.0</google.common-protos.version>
    <gax.version>1.48.1</gax.version>
    <grpc.version>1.23.0</grpc.version>
    <protobuf.version>3.9.1</protobuf.version>
    <junit.version>4.12</junit.version>
    <guava.version>28.0-android</guava.version>
    <threeten.version>1.4.0</threeten.version>
    <javax.annotations.version>1.3.2</javax.annotations.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>proto-google-cloud-trace-v1</artifactId>
        <version>0.73.1</version><!-- {x-version-update:proto-google-cloud-trace-v1:current} -->
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>proto-google-cloud-trace-v2</artifactId>
        <version>0.73.1</version><!-- {x-version-update:proto-google-cloud-trace-v2:current} -->
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>grpc-google-cloud-trace-v1</artifactId>
        <version>0.73.1</version><!-- {x-version-update:grpc-google-cloud-trace-v1:current} -->
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>grpc-google-cloud-trace-v2</artifactId>
        <version>0.73.1</version><!-- {x-version-update:grpc-google-cloud-trace-v2:current} -->
      </dependency>

      <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-bom</artifactId>
        <version>\${grpc.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>com.google.api</groupId>
        <artifactId>gax-bom</artifactId>
        <version>\${gax.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava-bom</artifactId>
        <version>\${guava.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>

      <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-core-grpc</artifactId>
        <version>\${google.core.version}</version>
      </dependency>
      <dependency>
        <groupId>com.google.protobuf</groupId>
        <artifactId>protobuf-java</artifactId>
        <version>\${protobuf.version}</version>
      </dependency>
      <dependency>
        <groupId>com.google.api</groupId>
        <artifactId>api-common</artifactId>
        <version>\${google.api-common.version}</version>
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>proto-google-common-protos</artifactId>
        <version>\${google.common-protos.version}</version>
      </dependency>
      <dependency>
        <groupId>org.threeten</groupId>
        <artifactId>threetenbp</artifactId>
        <version>\${threeten.version}</version>
      </dependency>
      <dependency>
        <groupId>javax.annotation</groupId>
        <artifactId>javax.annotation-api</artifactId>
        <version>\${javax.annotations.version}</version>
      </dependency>

      <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>\${junit.version}</version>
        <scope>test</scope>
      </dependency>
      <dependency>
        <groupId>com.google.api</groupId>
        <artifactId>gax-grpc</artifactId>
        <version>\${gax.version}</version>
        <classifier>testlib</classifier>
        <scope>test</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <build>
    <pluginManagement>
      <plugins>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-dependency-plugin</artifactId>
          <configuration>
            <ignoredUnusedDeclaredDependencies>org.objenesis:objenesis</ignoredUnusedDeclaredDependencies>
          </configuration>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>

  <modules>
    <module>proto-google-cloud-trace-v1</module>
    <module>proto-google-cloud-trace-v2</module>
    <module>grpc-google-cloud-trace-v1</module>
    <module>grpc-google-cloud-trace-v2</module>
    <module>google-cloud-trace</module>
  </modules>

  <reporting>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-project-info-reports-plugin</artifactId>
        <version>3.0.0</version>
        <reportSets>
          <reportSet>
            <reports>
              <report>index</report>
              <report>dependency-info</report>
              <report>team</report>
              <report>ci-management</report>
              <report>issue-management</report>
              <report>licenses</report>
              <report>scm</report>
              <report>dependency-management</report>
              <report>distribution-management</report>
              <report>summary</report>
              <report>modules</report>
            </reports>
          </reportSet>
        </reportSets>
        <configuration>
          <dependencyDetailsEnabled>true</dependencyDetailsEnabled>
          <artifactId>\${site.installationModule}</artifactId>
          <packaging>jar</packaging>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-javadoc-plugin</artifactId>
        <version>3.1.1</version>
        <reportSets>
          <reportSet>
            <id>html</id>
            <reports>
              <report>aggregate</report>
              <report>javadoc</report>
            </reports>
          </reportSet>
        </reportSets>
        <configuration>
          <doclint>none</doclint>
          <show>protected</show>
          <nohelp>true</nohelp>
          <outputDirectory>\${project.build.directory}/javadoc</outputDirectory>
          <groups>
            <group>
              <title>Test helpers packages</title>
              <packages>com.google.cloud.testing</packages>
            </group>
            <group>
              <title>SPI packages</title>
              <packages>com.google.cloud.spi*</packages>
            </group>
          </groups>

          <links>
            <link>https://grpc.io/grpc-java/javadoc/</link>
            <link>https://developers.google.com/protocol-buffers/docs/reference/java/</link>
            <link>https://googleapis.dev/java/google-auth-library/latest/</link>
            <link>https://googleapis.dev/java/gax/latest/</link>
            <link>https://googleapis.github.io/api-common-java/\${google.api-common.version}/apidocs/</link>
          </links>
        </configuration>
      </plugin>
    </plugins>
  </reporting>
</project>
`

exports['PR body'] = `
:robot: I have created a release \\*beep\\* \\*boop\\* 
---
### [0.20.4](https://www.github.com/googleapis/java-trace/compare/v0.20.3...v0.20.4) 


### Bug Fixes

* Fix declared dependencies from merge issue ([#291](https://www.github.com/googleapis/java-trace/issues/291)) ([35abf13](https://www.github.com/googleapis/java-trace/commit/35abf13))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please).
`

exports['labels'] = {
  "labels": [
    "autorelease: pending",
    "type: process"
  ]
}

exports['versions-snapshot'] = `
# Format:
# module:released-version:current-version

google-cloud-trace:0.108.0-beta:0.108.1-beta-SNAPSHOT
grpc-google-cloud-trace-v1:0.73.0:0.73.1-SNAPSHOT
grpc-google-cloud-trace-v2:0.73.0:0.73.1-SNAPSHOT
proto-google-cloud-trace-v1:0.73.0:0.73.1-SNAPSHOT
proto-google-cloud-trace-v2:0.73.0:0.73.1-SNAPSHOT
`

exports['pom-snapshot'] = `
<?xml version='1.0' encoding='UTF-8'?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.google.cloud</groupId>
  <artifactId>google-cloud-trace-parent</artifactId>
  <packaging>pom</packaging>
  <version>0.108.1-beta-SNAPSHOT</version><!-- {x-version-update:google-cloud-trace:current} -->
  <name>Google Cloud Trace Parent</name>
  <url>https://github.com/googleapis/java-core</url>
  <description>
    Java idiomatic client for Google Cloud Platform services.
  </description>

  <parent>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-shared-config</artifactId>
    <version>0.1.1</version>
  </parent>

  <developers>
    <developer>
      <id>garrettjonesgoogle</id>
      <name>Garrett Jones</name>
      <email>garrettjones@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>pongad</id>
      <name>Michael Darakananda</name>
      <email>pongad@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>shinfan</id>
      <name>Shin Fan</name>
      <email>shinfan@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>michaelbausor</id>
      <name>Micheal Bausor</name>
      <email>michaelbausor@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>vam-google</id>
      <name>Vadym Matsishevskyi</name>
      <email>vam@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>tswast</id>
      <name>Tim Swast</name>
      <email>tswast@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>neozwu</id>
      <name>Neo Wu</name>
      <email>neowu@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>lesv</id>
      <name>Les Vogel</name>
      <email>lesv@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>schmidt_sebastian</id>
      <name>Sebastian Schmidt</name>
      <email>mrschmidt@google.com</email>
      <organization>Google</organization>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>andreamlin</id>
      <name>Andrea Lin</name>
      <email>andrealin@google.com</email>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
    <developer>
      <id>hzyi-google</id>
      <name>Hanzhen Yi</name>
      <email>hzyi@google.com</email>
      <roles>
        <role>Developer</role>
      </roles>
    </developer>
  </developers>
  <organization>
    <name>Google LLC</name>
  </organization>
  <scm>
    <connection>scm:git:git@github.com:googleapis/java-core.git</connection>
    <developerConnection>scm:git:git@github.com:googleapis/java-core.git</developerConnection>
    <url>https://github.com/googleapis/java-core</url>
    <tag>HEAD</tag>
  </scm>
  <issueManagement>
    <url>https://github.com/googleapis/java-core/issues</url>
    <system>GitHub Issues</system>
  </issueManagement>
  <distributionManagement>
    <snapshotRepository>
      <id>sonatype-nexus-snapshots</id>
      <url>https://oss.sonatype.org/content/repositories/snapshots</url>
    </snapshotRepository>
    <repository>
      <id>sonatype-nexus-staging</id>
      <url>https://oss.sonatype.org/service/local/staging/deploy/maven2/</url>
    </repository>
  </distributionManagement>
  <licenses>
    <license>
      <name>Apache-2.0</name>
      <url>https://www.apache.org/licenses/LICENSE-2.0.txt</url>
    </license>
  </licenses>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <github.global.server>github</github.global.server>
    <site.installationModule>google-cloud-trace-parent</site.installationModule>
    <google.core.version>1.90.0</google.core.version>
    <google.api-common.version>1.8.1</google.api-common.version>
    <google.common-protos.version>1.16.0</google.common-protos.version>
    <gax.version>1.48.1</gax.version>
    <grpc.version>1.23.0</grpc.version>
    <protobuf.version>3.9.1</protobuf.version>
    <junit.version>4.12</junit.version>
    <guava.version>28.0-android</guava.version>
    <threeten.version>1.4.0</threeten.version>
    <javax.annotations.version>1.3.2</javax.annotations.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>proto-google-cloud-trace-v1</artifactId>
        <version>0.73.1-SNAPSHOT</version><!-- {x-version-update:proto-google-cloud-trace-v1:current} -->
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>proto-google-cloud-trace-v2</artifactId>
        <version>0.73.1-SNAPSHOT</version><!-- {x-version-update:proto-google-cloud-trace-v2:current} -->
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>grpc-google-cloud-trace-v1</artifactId>
        <version>0.73.1-SNAPSHOT</version><!-- {x-version-update:grpc-google-cloud-trace-v1:current} -->
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>grpc-google-cloud-trace-v2</artifactId>
        <version>0.73.1-SNAPSHOT</version><!-- {x-version-update:grpc-google-cloud-trace-v2:current} -->
      </dependency>

      <dependency>
        <groupId>io.grpc</groupId>
        <artifactId>grpc-bom</artifactId>
        <version>\${grpc.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>com.google.api</groupId>
        <artifactId>gax-bom</artifactId>
        <version>\${gax.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava-bom</artifactId>
        <version>\${guava.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>

      <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-core-grpc</artifactId>
        <version>\${google.core.version}</version>
      </dependency>
      <dependency>
        <groupId>com.google.protobuf</groupId>
        <artifactId>protobuf-java</artifactId>
        <version>\${protobuf.version}</version>
      </dependency>
      <dependency>
        <groupId>com.google.api</groupId>
        <artifactId>api-common</artifactId>
        <version>\${google.api-common.version}</version>
      </dependency>
      <dependency>
        <groupId>com.google.api.grpc</groupId>
        <artifactId>proto-google-common-protos</artifactId>
        <version>\${google.common-protos.version}</version>
      </dependency>
      <dependency>
        <groupId>org.threeten</groupId>
        <artifactId>threetenbp</artifactId>
        <version>\${threeten.version}</version>
      </dependency>
      <dependency>
        <groupId>javax.annotation</groupId>
        <artifactId>javax.annotation-api</artifactId>
        <version>\${javax.annotations.version}</version>
      </dependency>

      <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>\${junit.version}</version>
        <scope>test</scope>
      </dependency>
      <dependency>
        <groupId>com.google.api</groupId>
        <artifactId>gax-grpc</artifactId>
        <version>\${gax.version}</version>
        <classifier>testlib</classifier>
        <scope>test</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <build>
    <pluginManagement>
      <plugins>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-dependency-plugin</artifactId>
          <configuration>
            <ignoredUnusedDeclaredDependencies>org.objenesis:objenesis</ignoredUnusedDeclaredDependencies>
          </configuration>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>

  <modules>
    <module>proto-google-cloud-trace-v1</module>
    <module>proto-google-cloud-trace-v2</module>
    <module>grpc-google-cloud-trace-v1</module>
    <module>grpc-google-cloud-trace-v2</module>
    <module>google-cloud-trace</module>
  </modules>

  <reporting>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-project-info-reports-plugin</artifactId>
        <version>3.0.0</version>
        <reportSets>
          <reportSet>
            <reports>
              <report>index</report>
              <report>dependency-info</report>
              <report>team</report>
              <report>ci-management</report>
              <report>issue-management</report>
              <report>licenses</report>
              <report>scm</report>
              <report>dependency-management</report>
              <report>distribution-management</report>
              <report>summary</report>
              <report>modules</report>
            </reports>
          </reportSet>
        </reportSets>
        <configuration>
          <dependencyDetailsEnabled>true</dependencyDetailsEnabled>
          <artifactId>\${site.installationModule}</artifactId>
          <packaging>jar</packaging>
        </configuration>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-javadoc-plugin</artifactId>
        <version>3.1.1</version>
        <reportSets>
          <reportSet>
            <id>html</id>
            <reports>
              <report>aggregate</report>
              <report>javadoc</report>
            </reports>
          </reportSet>
        </reportSets>
        <configuration>
          <doclint>none</doclint>
          <show>protected</show>
          <nohelp>true</nohelp>
          <outputDirectory>\${project.build.directory}/javadoc</outputDirectory>
          <groups>
            <group>
              <title>Test helpers packages</title>
              <packages>com.google.cloud.testing</packages>
            </group>
            <group>
              <title>SPI packages</title>
              <packages>com.google.cloud.spi*</packages>
            </group>
          </groups>

          <links>
            <link>https://grpc.io/grpc-java/javadoc/</link>
            <link>https://developers.google.com/protocol-buffers/docs/reference/java/</link>
            <link>https://googleapis.dev/java/google-auth-library/latest/</link>
            <link>https://googleapis.dev/java/gax/latest/</link>
            <link>https://googleapis.github.io/api-common-java/\${google.api-common.version}/apidocs/</link>
          </links>
        </configuration>
      </plugin>
    </plugins>
  </reporting>
</project>
`

exports['PR body-snapshot'] = `
:robot: I have created a release \\*beep\\* \\*boop\\* 
---
### Updating meta-information for bleeding-edge SNAPSHOT release.
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please).
`

exports['labels-snapshot'] = {
  "labels": [
    "type: process"
  ]
}
