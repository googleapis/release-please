exports['DotNet run creates a release PR 1'] = `
[
  [
    "docs/history.md",
    {
      "content": "# Changelog\\n\\n### [1.2.1](https://www.github.com/googleapis/foo-dot-net/compare/v1.2.0...v1.2.1) (1983-10-10)\\n\\n\\n### Bug Fixes\\n\\n* **deps:** update dependency com.google.cloud:google-cloud-spanner to v1.50.0 ([1f9663c](https://www.github.com/googleapis/foo-dot-net/commit/1f9663cf08ab1cf3b68d95dee4dc99b7c4aac373))\\n* **deps:** update dependency com.google.cloud:google-cloud-storage to v1.120.0 ([fcd1c89](https://www.github.com/googleapis/foo-dot-net/commit/fcd1c890dc1526f4d62ceedad561f498195c8939))\\n",
      "mode": "100644"
    }
  ],
  [
    "README.md",
    {
      "content": "## Quickstart: Hello, World on your local machine\\n\\nFirst, install the template package into the .NET tooling:\\n\\n\`\`\`sh\\ndotnet new -i Google.Cloud.Functions.Templates::1.2.1\\n\`\`\`\\n",
      "mode": "100644"
    }
  ],
  [
    "src/CommonProperties.xml",
    {
      "content": "<Project>\\n  <!-- Properties common to all packaged projects under this directory -->\\n\\n  <!-- Version information -->\\n  <PropertyGroup>\\n    <Version>1.2.1</Version>\\n  </PropertyGroup>\\n\\n  <!-- Build information -->\\n  <PropertyGroup>\\n    <TargetFramework>netcoreapp3.1</TargetFramework>\\n    <GenerateDocumentationFile>true</GenerateDocumentationFile>\\n    <AssemblyOriginatorKeyFile>../GoogleApis.snk</AssemblyOriginatorKeyFile>\\n    <SignAssembly>true</SignAssembly>\\n    <Deterministic>true</Deterministic>\\n    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>\\n    <Nullable>Enable</Nullable>\\n    <OutputType>Library</OutputType>\\n\\n    <!-- Stop Visual Studio adding a launchSettings.properties file -->\\n    <NoDefaultLaunchSettingsFile>true</NoDefaultLaunchSettingsFile>\\n  </PropertyGroup>\\n\\n  <!-- Packaging information -->\\n  <PropertyGroup>\\n    <IsPackable>True</IsPackable>\\n    <Copyright>Copyright 2020 Google LLC</Copyright>\\n    <Authors>Google LLC</Authors>\\n    <!-- TODO: Find a Functions-specific icon URL. -->\\n    <PackageIconUrl>https://cloud.google.com/images/gcp-icon-64x64.png</PackageIconUrl>\\n    <PackageIcon>NuGetIcon.png</PackageIcon>\\n    <PackageLicenseFile>LICENSE</PackageLicenseFile>\\n    <PackageProjectUrl>https://github.com/GoogleCloudPlatform/functions-framework-dotnet</PackageProjectUrl>\\n    <RepositoryType>git</RepositoryType>\\n    <RepositoryUrl>https://github.com/GoogleCloudPlatform/functions-framework-dotnet</RepositoryUrl>\\n\\n    <!-- Properties to get SourceLink to work -->\\n    <AllowedOutputExtensionsInPackageBuildOutputFolder>$(AllowedOutputExtensionsInPackageBuildOutputFolder);.pdb</AllowedOutputExtensionsInPackageBuildOutputFolder>\\n    <PublishRepositoryUrl>true</PublishRepositoryUrl>\\n    <EmbedUntrackedSources>true</EmbedUntrackedSources>\\n  </PropertyGroup>\\n\\n  <ItemGroup>\\n    <None Include=\\"../../LICENSE\\" Pack=\\"true\\" PackagePath=\\"\\" />\\n    <None Include=\\"../NuGetIcon.png\\" Pack=\\"true\\" PackagePath=\\"\\" />\\n  </ItemGroup>\\n\\n</Project>\\n",
      "mode": "100644"
    }
  ],
  [
    "foo.csproj",
    {
      "content": "<Project Sdk=\\"Microsoft.NET.Sdk\\">\\n  <PropertyGroup>\\n    <OutputType>Exe</OutputType>\\n    <TargetFramework>netcoreapp3.1</TargetFramework>\\n  </PropertyGroup>\\n\\n  <ItemGroup>\\n    <PackageReference Include=\\"Google.Cloud.Functions.Invoker\\" Version=\\"1.0.0\\" />\\n    <PackageReference Include=\\"Google.Events.Protobuf\\" Version=\\"1.2.1\\" />\\n  </ItemGroup>\\n</Project>\\n",
      "mode": "100644"
    }
  ]
]
`
