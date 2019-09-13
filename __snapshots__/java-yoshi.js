exports['JavaYoshi creates a release PR 1'] = `
# Changelog

### [0.20.4](https://www.github.com/googleapis/java-trace/compare/v0.20.3...v0.20.4) (2019-09-13)


### Bug Fixes

* Fix declared dependencies from merge issue ([#291](https://www.github.com/googleapis/java-trace/issues/291)) ([35abf13](https://www.github.com/googleapis/java-trace/commit/35abf13))

`

exports['JavaYoshi creates a release PR 2'] = `
� �ॢ�Ij���'���+J֜����ӭ�%�ډب��bq�bz{_���i��+ޭ:�q�-i��+ޯ�kiǌj����i���!��]�*?��ޟ���ڗ��r����%y�h��࢈%{�%��~���z����i���!��]�*?��ޟ���ڗ��r����%y�h��࢈%{�%��~���z�����v�-�.���jب���q﩮�nrߝ��>
X����n���:�g���b�{kiǾrX��ߥ�����\r�ד�+�'��+��)��� ��,jwfk*q�"�v��)����rL��>�w(�����^r����'$�֫�������*'��]j׾�֫�
(�W�rZ.w�kiǫzW���H*.j���)�1�ޝ�]�������h��~)^�i]z��u���
躒r����%y�h��஋�!֫�'�r��� ������q�ڮ؟i�Hv���*'�]<��޵��z�"��z��u��ȇ��z�"��i�^i�m�+-�*.�שzw^�Ȟ�j����jb��(�
(�W������ ������q�5��>m�Z!����޺ȧ� Si�m�+-�*.�שzw^�Ȟ�'��bn���7�zw^�Ȟ�
`

exports['JavaYoshi creates a release PR 3'] = `
# Format:
# module:released-version:current-version

google-cloud-trace:0.108.1-beta:0.108.1-beta
grpc-google-cloud-trace-v1:0.73.1:0.73.1
grpc-google-cloud-trace-v2:0.73.1:0.73.1
proto-google-cloud-trace-v1:0.73.1:0.73.1
proto-google-cloud-trace-v2:0.73.1:0.73.1
`

exports['JavaYoshi creates a release PR 4'] = `
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

exports['JavaYoshi creates a release PR 5'] = `
:robot: I have created a release \\*beep\\* \\*boop\\* 
---
### [0.20.4](https://www.github.com/googleapis/java-trace/compare/v0.20.3...v0.20.4) 


### Bug Fixes

* Fix declared dependencies from merge issue ([#291](https://www.github.com/googleapis/java-trace/issues/291)) ([35abf13](https://www.github.com/googleapis/java-trace/commit/35abf13))
---


This PR was generated with [Release Please](https://github.com/googleapis/release-please).
`
