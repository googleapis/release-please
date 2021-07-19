# Project Package

A kpt package to configure a GCP project and a Kubernetes namespace.

The namespace can be used to manage project resources with Config Connector.

## Resources

```
File          APIVersion                                     Kind     Name        Namespace
project.yaml  resourcemanager.cnrm.cloud.google.com/v1beta1  Project  project-id  projects
```

## Resource References

- [Project](https://cloud.google.com/config-connector/docs/reference/resource-docs/resourcemanager/project)

## Sub-packages

- [kcc-namespace](/catalog/project/kcc-namespace)

## Setters

Setters are inherited by sub-packages.

```
$ kpt cfg list-setters .
./
          NAME                    VALUE           SET BY            DESCRIPTION             COUNT   REQUIRED   IS SET
  billing-account-id      AAAAAA-BBBBBB-CCCCCC             Billing account ID               1       No         No
  folder-name             name.of.folder                   Kubernetes metadata name of      1       No         No
                                                           the parent folder resource.
  folder-namespace        hierarchy                        Kubernetes metadata namespace    1       No         No
                                                           of the parent folder resource.
  management-namespace    config-control                                                    0       No         No
  management-project-id   management-project-id            Config Controller host project   0       No         No
                                                           id.
  networking-namespace    networking                       Namespace for networking.        0       No         No
  project-id              project-id                       Project ID                       2       No         No
  projects-namespace      projects                         Namespace for projects.          1       No         No
```