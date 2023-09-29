exports['JavaUpdate updateContent only updates current versions for snapshots 1'] = `
# this is an inline current entry and should always be replaced
3.3.3 # {x-version-update:module-name:current}

# this is a block current entry and should always be replaced
# {x-version-update-start:module-name:current}
3.3.3
3.3.3
# {x-version-update-end}

# this is an inline released entry and should be replaced for non-snapshot releases
1.2.3 # {x-version-update:module-name:released}

# this is a block released entry and should be replaced for non-snapshot releases
# {x-version-update-start:module-name:released}
2.3.4
3.4.5
# {x-version-update-end}

`

exports['JavaUpdate updateContent updates all versions for non snapshots 1'] = `
# this is an inline current entry and should always be replaced
3.3.3 # {x-version-update:module-name:current}

# this is a block current entry and should always be replaced
# {x-version-update-start:module-name:current}
3.3.3
3.3.3
# {x-version-update-end}

# this is an inline released entry and should be replaced for non-snapshot releases
3.3.3 # {x-version-update:module-name:released}

# this is a block released entry and should be replaced for non-snapshot releases
# {x-version-update-start:module-name:released}
3.3.3
3.3.3
# {x-version-update-end}

`

exports['JavaUpdate updateContent updates an LTS snapshot version 1'] = `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-parent</artifactId>
    <version>0.16.2-sp.1</version><!-- {x-version-update:google-auth-library-parent:current} -->
    <relativePath>../pom.xml</relativePath>
  </parent>

  <groupId>com.google.auth</groupId>
  <artifactId>google-auth-library-appengine</artifactId>
  <version>0.16.2-sp.1</version><!-- {x-version-update:google-auth-library-parent:current} -->
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
