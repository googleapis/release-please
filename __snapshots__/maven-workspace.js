exports['MavenWorkspace plugin run appends to existing candidate 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven3: 3.3.4</summary>

Release notes for path: maven3, releaseType: maven
</details>

<details><summary>maven4: 4.4.5</summary>

### Dependencies

* Updated foo to v3
* The following workspace dependencies were updated
    * com.google.example:maven3 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run appends to existing candidate with special updater 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven3: 3.3.4</summary>

Release notes for path: maven3, releaseType: maven
</details>

<details><summary>maven4: 4.4.5</summary>

### Dependencies

* Updated foo to v3
* The following workspace dependencies were updated
    * com.google.example:maven3 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run can consider all artifacts 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>multi1: 1.1.2</summary>

Release notes for path: multi1, releaseType: java-yoshi
</details>

<details><summary>com.google.example:my-bom: 1.2.4</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:multi1-bom bumped to 1.1.2,
    * com.google.example:multi1-sub1 bumped to 2.2.3,
    * com.google.example:multi1-sub2 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run can consider all artifacts 2'] = `
<?xml version="1.0" encoding="UTF-8"?>
<project>
  <groupId>com.google.example</groupId>
  <artifactId>my-bom</artifactId>
  <version>1.2.4</version>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>com.google.example</groupId>
        <artifactId>multi1-bom</artifactId>
        <version>1.1.2</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>com.google.example</groupId>
        <artifactId>multi1-sub1</artifactId>
        <version>2.2.3</version>
      </dependency>
      <dependency>
        <groupId>com.google.example</groupId>
        <artifactId>multi1-sub2</artifactId>
        <version>3.3.4</version>
      </dependency>
      <dependency>
        <groupId>com.google.example</groupId>
        <artifactId>multi2-sub1</artifactId>
        <version>5.5.5</version>
      </dependency>
      <dependency>
        <groupId>com.google.example</groupId>
        <artifactId>multi2-sub2</artifactId>
        <version>6.6.6</version>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
`

exports['MavenWorkspace plugin run handles a single maven package 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven4: 4.4.5</summary>

Release notes for path: maven4, releaseType: maven
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run skips pom files not configured for release 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven1: 1.1.2</summary>

Release notes for path: maven1, releaseType: maven
</details>

<details><summary>com.google.example:maven2: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven1 bumped to 1.1.2
</details>

<details><summary>com.google.example:maven3: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven2 bumped to 2.2.3
</details>

<details><summary>com.google.example:maven4: 4.4.5</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven3 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`

exports['MavenWorkspace plugin run walks dependency tree and updates previously untouched packages 1'] = `
:robot: I have created a release *beep* *boop*
---


<details><summary>maven1: 1.1.2</summary>

Release notes for path: maven1, releaseType: maven
</details>

<details><summary>com.google.example:maven2: 2.2.3</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven1 bumped to 1.1.2
</details>

<details><summary>com.google.example:maven3: 3.3.4</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven2 bumped to 2.2.3
</details>

<details><summary>com.google.example:maven4: 4.4.5</summary>

### Dependencies

* The following workspace dependencies were updated
    * com.google.example:maven3 bumped to 3.3.4
</details>

---
This PR was generated with [Release Please](https://github.com/googleapis/release-please). See [documentation](https://github.com/googleapis/release-please#release-please).
`
