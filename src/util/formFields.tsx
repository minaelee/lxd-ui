import { CreateInstanceFormValues } from "pages/instances/CreateInstanceForm";
import { EditInstanceFormValues } from "pages/instances/EditInstanceForm";
import { SharedFormTypes } from "pages/instances/forms/sharedFormTypes";
import { LxdProfile } from "types/profile";
import { isDiskDevice, isNicDevice } from "util/devices";
import { LxdNicDevice } from "types/device";

export const formFieldsToPayloadFields: Record<string, string> = {
  rootStorage: "",
  limits_cpu: "limits.cpu",
  limits_memory: "limits.memory",
  limits_memory_swap: "limits.memory.swap",
  limits_disk_priority: "limits.disk.priority",
  limits_processes: "limits.processes",
  security_privileged: "security.privileged",
  security_protection_delete: "security.protection.delete",
  security_protection_shift: "security.protection.shift",
  security_idmap_base: "security.idmap.base",
  security_idmap_size: "security.idmap.size",
  security_idmap_isolated: "security.idmap.isolated",
  security_devlxd: "security.devlxd",
  security_devlxd_images: "security.devlxd.images",
  security_secureboot: "security.secureboot",
  snapshots_pattern: "snapshots.pattern",
  snapshots_expiry: "snapshots.expiry",
  snapshots_schedule: "snapshots.schedule",
  snapshots_schedule_stopped: "snapshots.schedule.stopped",
  cloud_init_network_config: "cloud-init.network-config",
  cloud_init_user_data: "cloud-init.user-data",
  cloud_init_vendor_data: "cloud-init.vendor-data",
};

export const figureInheritedValue = (
  values: SharedFormTypes,
  formField: string,
  profiles: LxdProfile[]
): [string, string] => {
  if (Object.prototype.hasOwnProperty.call(values, "profiles")) {
    const payloadField = formFieldsToPayloadFields[formField];
    const appliedProfiles = [
      ...(values as CreateInstanceFormValues | EditInstanceFormValues).profiles,
    ].reverse();
    for (const profileName of appliedProfiles) {
      const profile = profiles.find((profile) => profile.name === profileName);
      if (profile?.config[payloadField]) {
        return [profile.config[payloadField], `${profileName} profile`];
      }
    }
  }

  return ["-", "LXD"];
};

export const figureInheritedRootStorage = (
  values: SharedFormTypes,
  profiles: LxdProfile[]
): [string, string] => {
  if (Object.prototype.hasOwnProperty.call(values, "profiles")) {
    const appliedProfiles = [
      ...(values as CreateInstanceFormValues | EditInstanceFormValues).profiles,
    ].reverse();
    for (const profileName of appliedProfiles) {
      const profile = profiles.find((profile) => profile.name === profileName);
      if (!profile) {
        continue;
      }
      const rootDevice = Object.values(profile.devices)
        .filter(isDiskDevice)
        .find((device) => device.path === "/");
      if (rootDevice) {
        return [rootDevice.pool, `${profileName} profile`];
      }
    }
  }

  return ["", "LXD"];
};

interface InheritedNetwork {
  key: string;
  network: LxdNicDevice | null;
  source: string;
}

export const figureInheritedNetworks = (
  values: SharedFormTypes,
  profiles: LxdProfile[]
): InheritedNetwork[] => {
  const inheritedNetworks: InheritedNetwork[] = [];
  if (Object.prototype.hasOwnProperty.call(values, "profiles")) {
    const appliedProfiles = [
      ...(values as CreateInstanceFormValues | EditInstanceFormValues).profiles,
    ].reverse();
    for (const profileName of appliedProfiles) {
      const profile = profiles.find((profile) => profile.name === profileName);
      if (!profile) {
        continue;
      }
      Object.entries(profile.devices)
        .filter(([_key, network]) => isNicDevice(network))
        .map(([key, network]) => {
          inheritedNetworks.push({
            key: key,
            network: network as LxdNicDevice,
            source: `${profileName} profile`,
          });
        });
    }
  }

  if (inheritedNetworks.length > 0) {
    return inheritedNetworks;
  }

  return [];
};

export const collapsedViewMaxWidth = 1340;