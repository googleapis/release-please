exports['GenericXml updateContent updates matching attribute 1'] = `
<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="2.3.4">
  <PropertyGroup>
    <Version>1.2.0</Version>
    <TargetFrameworks>netstandard2.0;net461</TargetFrameworks>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <Description>Recommended Google client library to access the Google Cloud Channel API, which enables Google Cloud resellers and distributors to manage their customers, channel partners, entitlements and reports.</Description>
    <PackageTags>channel;reseller;Google;Cloud</PackageTags>
    <CodeAnalysisRuleSet>..\\..\\..\\grpc.ruleset</CodeAnalysisRuleSet>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="ConfigureAwaitChecker.Analyzer" Version="5.0.0" PrivateAssets="All"/>
    <PackageReference Include="Google.Api.Gax.Grpc.GrpcCore" Version="[3.5.0, 4.0.0)"/>
    <PackageReference Include="Google.LongRunning" Version="[2.3.0, 3.0.0)"/>
    <PackageReference Include="Grpc.Core" Version="[2.38.1, 3.0.0)" PrivateAssets="None"/>
    <PackageReference Include="Microsoft.DotNet.Analyzers.Compatibility" Version="0.2.12-alpha" PrivateAssets="All"/>
    <PackageReference Include="Microsoft.NETFramework.ReferenceAssemblies" Version="1.0.2" PrivateAssets="All"/>
    <Analyzer Condition="Exists('..\\..\\..\\tools\\Google.Cloud.Tools.Analyzers\\bin\\$(Configuration)\\netstandard1.3\\publish\\Google.Cloud.Tools.Analyzers.dll')" Include="..\\..\\..\\tools\\Google.Cloud.Tools.Analyzers\\bin\\$(Configuration)\\netstandard1.3\\publish\\Google.Cloud.Tools.Analyzers.dll"/>
  </ItemGroup>
</Project>
`

exports['GenericXml updateContent updates matching entry 1'] = `
<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>2.3.4</Version>
    <TargetFrameworks>netstandard2.0;net461</TargetFrameworks>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <Description>Recommended Google client library to access the Google Cloud Channel API, which enables Google Cloud resellers and distributors to manage their customers, channel partners, entitlements and reports.</Description>
    <PackageTags>channel;reseller;Google;Cloud</PackageTags>
    <CodeAnalysisRuleSet>..\\..\\..\\grpc.ruleset</CodeAnalysisRuleSet>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="ConfigureAwaitChecker.Analyzer" Version="5.0.0" PrivateAssets="All"/>
    <PackageReference Include="Google.Api.Gax.Grpc.GrpcCore" Version="[3.5.0, 4.0.0)"/>
    <PackageReference Include="Google.LongRunning" Version="[2.3.0, 3.0.0)"/>
    <PackageReference Include="Grpc.Core" Version="[2.38.1, 3.0.0)" PrivateAssets="None"/>
    <PackageReference Include="Microsoft.DotNet.Analyzers.Compatibility" Version="0.2.12-alpha" PrivateAssets="All"/>
    <PackageReference Include="Microsoft.NETFramework.ReferenceAssemblies" Version="1.0.2" PrivateAssets="All"/>
    <Analyzer Condition="Exists('..\\..\\..\\tools\\Google.Cloud.Tools.Analyzers\\bin\\$(Configuration)\\netstandard1.3\\publish\\Google.Cloud.Tools.Analyzers.dll')" Include="..\\..\\..\\tools\\Google.Cloud.Tools.Analyzers\\bin\\$(Configuration)\\netstandard1.3\\publish\\Google.Cloud.Tools.Analyzers.dll"/>
  </ItemGroup>
</Project>
`
