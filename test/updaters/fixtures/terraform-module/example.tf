/**
 * Copyright 2024-2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/beta-autopilot-private-cluster"
  version = "~> 1.0"

  project_id                        = var.project_id
  name                              = "${local.cluster_type}-cluster"
  regional                          = true
  region                            = var.region
  network                           = module.gcp-network.network_name
  subnetwork                        = local.subnet_names[index(module.gcp-network.subnets_names, local.subnet_name)]
  ip_range_pods                     = local.pods_range_name
  ip_range_services                 = local.svc_range_name
  release_channel                   = "REGULAR"
  enable_vertical_pod_autoscaling   = true
  enable_private_endpoint           = true
  enable_private_nodes              = true
  master_ipv4_cidr_block            = "172.16.0.0/28"
  add_cluster_firewall_rules        = true
  add_master_webhook_firewall_rules = true
  add_shadow_firewall_rules         = true
  network_tags                      = ["allow-google-apis"]
  deletion_protection               = false
  enable_binary_authorization       = true

  master_authorized_networks = [
    {
      cidr_block   = "10.60.0.0/17"
      display_name = "VPC"
    },
  ]
}
