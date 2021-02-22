exports['PomXML updateContent handles multiple versions in pom.xml 1'] = `
<project xmlns="http://maven.apache.org/POM/4.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.google.api.grpc</groupId>
  <artifactId>proto-google-cloud-trace-v1</artifactId>
  <version>0.25.0</version><!-- {x-version-update:proto-google-cloud-trace-v1:current} -->
  <name>proto-google-cloud-trace-v1</name>
  <description>PROTO library for proto-google-cloud-trace-v1</description>
  <parent>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-trace-parent</artifactId>
    <version>0.16.2-SNAPSHOT</version><!-- {x-version-update:google-cloud-trace:current} -->
  </parent>
  <dependencies>
    <dependency>
      <groupId>com.google.protobuf</groupId>
      <artifactId>protobuf-java</artifactId>
    </dependency>
    <dependency>
      <groupId>com.google.api.grpc</groupId>
      <artifactId>proto-google-common-protos</artifactId>
    </dependency>
  </dependencies>
</project>
`

exports['PomXML updateContent handles specific versions in pom.xml 1'] = `
<project xmlns="http://maven.apache.org/POM/4.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.google.api.grpc</groupId>
  <artifactId>proto-google-cloud-trace-v1</artifactId>
  <version>0.73.1-SNAPSHOT</version><!-- {x-version-update:proto-google-cloud-trace-v1:current} -->
  <name>proto-google-cloud-trace-v1</name>
  <description>PROTO library for proto-google-cloud-trace-v1</description>
  <parent>
    <groupId>com.google.cloud</groupId>
    <artifactId>google-cloud-trace-parent</artifactId>
    <version>0.19.0</version><!-- {x-version-update:google-cloud-trace:current} -->
  </parent>
  <dependencies>
    <dependency>
      <groupId>com.google.protobuf</groupId>
      <artifactId>protobuf-java</artifactId>
    </dependency>
    <dependency>
      <groupId>com.google.api.grpc</groupId>
      <artifactId>proto-google-common-protos</artifactId>
    </dependency>
  </dependencies>
</project>
`

exports['PomXML updateContent updates version in pom.xml 1'] = `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-parent</artifactId>
    <version>0.19.0</version><!-- {x-version-update:google-auth-library-parent:current} -->
    <relativePath>../pom.xml</relativePath>
  </parent>

  <groupId>com.google.auth</groupId>
  <artifactId>google-auth-library-appengine</artifactId>
  <version>0.19.0</version><!-- {x-version-update:google-auth-library-parent:current} -->
  <name>Google Auth Library for Java - Google App Engine</name>

  <distributionManagement>
    <snapshotRepository>
      <id>ossrh</id>
      <url>https://oss.sonatype.org/content/repositories/snapshots</url>
    </snapshotRepository>
  </distributionManagement>

  <build>
    <sourceDirectory>java</sourceDirectory>
    <testSourceDirectory>javatests</testSourceDirectory>
    <plugins>
      <plugin>
        <groupId>org.sonatype.plugins</groupId>
        <artifactId>nexus-staging-maven-plugin</artifactId>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-source-plugin</artifactId>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-javadoc-plugin</artifactId>
      </plugin>
    </plugins>
  </build>

  <dependencies>
    <dependency>
      <groupId>com.google.auth</groupId>
      <artifactId>google-auth-library-credentials</artifactId>
    </dependency>
    <dependency>
      <groupId>com.google.auth</groupId>
      <artifactId>google-auth-library-oauth2-http</artifactId>
    </dependency>
    <dependency>
      <groupId>com.google.http-client</groupId>
      <artifactId>google-http-client</artifactId>
    </dependency>
    <dependency>
      <groupId>com.google.http-client</groupId>
      <artifactId>google-http-client-jackson2</artifactId>
    </dependency>
    <dependency>
      <groupId>com.google.appengine</groupId>
      <artifactId>appengine-api-1.0-sdk</artifactId>
      <scope>provided</scope>
    </dependency>
    <dependency>
      <groupId>com.google.guava</groupId>
      <artifactId>guava</artifactId>
    </dependency>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>com.google.auth</groupId>
      <artifactId>google-auth-library-oauth2-http</artifactId>
      <type>test-jar</type>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
`
