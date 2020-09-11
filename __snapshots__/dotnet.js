exports['DotNet run creates a release PR 1'] = `

filename: docs/history.md
# Changelog

### [1.2.1](https://www.github.com/googleapis/foo-dot-net/compare/v1.2.0...v1.2.1) (1983-10-10)


### Bug Fixes

* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/foo-dot-net/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))
* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/foo-dot-net/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))

filename: README.md
## Quickstart: Hello, World on your local machine

First, install the template package into the .NET tooling:

\`\`\`sh
dotnet new -i Google.Cloud.Functions.Templates::1.2.1
\`\`\`

filename: src/CommonProperties.xml
<Project>
  <!-- Properties common to all packaged projects under this directory -->

  <!-- Version information -->
  <PropertyGroup>
    <Version>1.2.1</Version>
  </PropertyGroup>

  <!-- Build information -->
  <PropertyGroup>
    <TargetFramework>netcoreapp3.1</TargetFramework>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <AssemblyOriginatorKeyFile>../GoogleApis.snk</AssemblyOriginatorKeyFile>
    <SignAssembly>true</SignAssembly>
    <Deterministic>true</Deterministic>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <Nullable>Enable</Nullable>
    <OutputType>Library</OutputType>

    <!-- Stop Visual Studio adding a launchSettings.properties file -->
    <NoDefaultLaunchSettingsFile>true</NoDefaultLaunchSettingsFile>
  </PropertyGroup>

  <!-- Packaging information -->
  <PropertyGroup>
    <IsPackable>True</IsPackable>
    <Copyright>Copyright 2020 Google LLC</Copyright>
    <Authors>Google LLC</Authors>
    <!-- TODO: Find a Functions-specific icon URL. -->
    <PackageIconUrl>https://cloud.google.com/images/gcp-icon-64x64.png</PackageIconUrl>
    <PackageIcon>NuGetIcon.png</PackageIcon>
    <PackageLicenseFile>LICENSE</PackageLicenseFile>
    <PackageProjectUrl>https://github.com/GoogleCloudPlatform/functions-framework-dotnet</PackageProjectUrl>
    <RepositoryType>git</RepositoryType>
    <RepositoryUrl>https://github.com/GoogleCloudPlatform/functions-framework-dotnet</RepositoryUrl>

    <!-- Properties to get SourceLink to work -->
    <AllowedOutputExtensionsInPackageBuildOutputFolder>$(AllowedOutputExtensionsInPackageBuildOutputFolder);.pdb</AllowedOutputExtensionsInPackageBuildOutputFolder>
    <PublishRepositoryUrl>true</PublishRepositoryUrl>
    <EmbedUntrackedSources>true</EmbedUntrackedSources>
  </PropertyGroup>

  <ItemGroup>
    <None Include="../../LICENSE" Pack="true" PackagePath="" />
    <None Include="../NuGetIcon.png" Pack="true" PackagePath="" />
  </ItemGroup>

</Project>

filename: foo.csproj
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp3.1</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Google.Cloud.Functions.Invoker" Version="1.0.0" />
    <PackageReference Include="Google.Events.Protobuf" Version="1.2.1" />
  </ItemGroup>
</Project>

`
