exports['Apis updateContent updates the specific version while preserving formatting 1'] = `
{
  "apis": [
    {
      "id": "Google.Analytics.Admin.V1Alpha",
      "version": "1.0.0-alpha10",
      "type": "grpc",
      "productName": "Analytics Admin",
      "productUrl": "https://developers.google.com/analytics",
      "description": "Recommended Google client library to access the Analytics Admin API (v1alpha)",
      "tags": [
        "analytics"
      ],
      "dependencies": {},
      "generator": "micro",
      "protoPath": "google/analytics/admin/v1alpha",
      "shortName": "analyticsadmin",
      "serviceConfigFile": "analyticsadmin_v1alpha.yaml"
    },
    {
      "id": "Google.Cloud.SecurityCenter.V1",
      "generator": "micro",
      "protoPath": "google/cloud/securitycenter/v1",
      "productName": "Google Cloud Security Command Center",
      "productUrl": "https://cloud.google.com/security-command-center/",
      "version": "2.12.0",
      "type": "grpc",
      "description": "Recommended Google client library to access the Google Cloud Security Command Center API, which helps security teams gather data, identify threats, and act on them before they result in business damage or loss.",
      "dependencies": {
        "Google.Api.Gax.Grpc.GrpcCore": "3.6.0",
        "Google.Cloud.Iam.V1": "2.3.0",
        "Google.LongRunning": "2.3.0",
        "Grpc.Core": "2.41.0"
      },
      "tags": [
        "security",
        "data risk"
      ],
      "shortName": "securitycenter",
      "serviceConfigFile": "securitycenter_v1.yaml"
    }
  ],
  "ignoredPaths": {
    "google/ads/googleads/v1": "Ads maintains its own libraries",
    "google/ads/googleads/v2": "Ads maintains its own libraries",
    "google/ads/googleads/v3": "Ads maintains its own libraries",
    "google/partner/aistreams": "Team is maintaining its own libraries",
    "google/cloud/bigquery/v2": "Relying on REST API for now",
    "google/cloud/recommender/logging/v1": "No services yet",
    "google/maps/playablelocations/v3": "Non-Cloud",
    "google/maps/routespreferred/v1": "Non-Cloud",
    "google/storage/v1": "Relying on REST API for now",
    "google/watcher/v1": "Meta-API, mostly replaced by PubSub"
  },
  "packageGroups": [
    {
      "id": "Google.Cloud.Spanner",
      "displayName": "Spanner",
      "packageIds": [
        "Google.Cloud.Spanner.Admin.Database.V1",
        "Google.Cloud.Spanner.Admin.Instance.V1",
        "Google.Cloud.Spanner.Data",
        "Google.Cloud.Spanner.Common.V1",
        "Google.Cloud.Spanner.V1"
      ]
    },
    {
      "id": "Google.Cloud.Diagnostics",
      "displayName": "diagnostics",
      "packageIds": [
        "Google.Cloud.Diagnostics.AspNetCore",
        "Google.Cloud.Diagnostics.AspNetCore3",
        "Google.Cloud.Diagnostics.Common"
      ]
    },
    {
      "id": "Google.Cloud.DevTools.ContainerAnalysis",
      "displayName": "Container Analysis",
      "packageIds": [
        "Google.Cloud.DevTools.ContainerAnalysis.V1",
        "Grafeas.V1"
      ]
    },
    {
      "id": "Google.Cloud.Firestore",
      "displayName": "Firestore",
      "packageIds": [
        "Google.Cloud.Firestore",
        "Google.Cloud.Firestore.V1"
      ]
    },
    {
      "id": "Google.Cloud.GSuite",
      "displayName": "GSuite Add-Ons",
      "packageIds": [
        "Google.Apps.Script.Type",
        "Google.Cloud.GSuiteAddOns.V1"
      ]
    },
    {
      "id": "Google.Cloud.OsLogin",
      "displayName": "OS Login",
      "packageIds": [
        "Google.Cloud.OsLogin.Common",
        "Google.Cloud.OsLogin.V1",
        "Google.Cloud.OsLogin.V1Beta"
      ]
    },
    {
      "id": "Google.Cloud.Workflows.V1",
      "displayName": "Cloud Workflows V1",
      "packageIds": [
        "Google.Cloud.Workflows.Common.V1",
        "Google.Cloud.Workflows.Executions.V1",
        "Google.Cloud.Workflows.V1"
      ]
    },
    {
      "id": "Google.Cloud.Workflows.V1Beta",
      "displayName": "Cloud Workflows V1Beta",
      "packageIds": [
        "Google.Cloud.Workflows.Common.V1Beta",
        "Google.Cloud.Workflows.Executions.V1Beta",
        "Google.Cloud.Workflows.V1Beta"
      ]
    }
  ]
}
`
