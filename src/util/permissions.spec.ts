import { LxdMetadata } from "types/config";
import {
  generateEntitlementOptions,
  permissionSort,
  generateResourceOptions,
} from "./permissions";

describe("General util functions for permissions feature", () => {
  it("generateResourceOptions", () => {
    const resourceType = "instance";
    const permissions = [
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-1?project=default",
        entitlement: "entitlement-1",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-1?project=default",
        entitlement: "entitlement-2",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-1?project=default",
        entitlement: "entitlement-3",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-2?project=default",
        entitlement: "entitlement-1",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-2?project=default",
        entitlement: "entitlement-2",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-2?project=default",
        entitlement: "entitlement-3",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-3?project=default",
        entitlement: "entitlement-1",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-3?project=default",
        entitlement: "entitlement-2",
      },
      {
        entity_type: "instance",
        url: "/1.0/instances/instance-3?project=default",
        entitlement: "entitlement-3",
      },
    ];

    const imagesNamesLookup = {};
    const identityNamesLookup = {};

    const resourceOptions = generateResourceOptions(
      resourceType,
      permissions,
      imagesNamesLookup,
      identityNamesLookup,
    );
    expect(resourceOptions).toEqual([
      {
        disabled: true,
        label: "Select an option",
        value: "",
        title: "",
      },
      {
        value: "/1.0/instances/instance-1?project=default",
        label: "instance-1 (project: default) ",
      },
      {
        value: "/1.0/instances/instance-2?project=default",
        label: "instance-2 (project: default) ",
      },
      {
        value: "/1.0/instances/instance-3?project=default",
        label: "instance-3 (project: default) ",
      },
    ]);
  });

  describe("generateEntitlementOptions", () => {
    const resourceType = "server";
    const permissions = [
      {
        entity_type: "server",
        url: "/1.0",
        entitlement: "admin",
      },
      {
        entity_type: "server",
        url: "/1.0",
        entitlement: "viewer",
      },
      {
        entity_type: "server",
        url: "/1.0",
        entitlement: "can_edit",
      },
      {
        entity_type: "server",
        url: "/1.0",
        entitlement: "can_view",
      },
    ];

    it("should have description titles in entitlement options if metadata is provided", () => {
      const metadata: LxdMetadata = {
        configs: {
          cluster: {},
          instance: {},
          "network-bridge": {},
          "network-macvlan": {},
          "network-ovn": {},
          "network-physical": {},
          "network-sriov": {},
          project: {},
          server: {},
          "storage-btrfs": {},
          "storage-ceph": {},
          "storage-cephfs": {},
          "storage-cephobject": {},
          "storage-dir": {},
          "storage-lvm": {},
          "storage-powerflex": {},
          "storage-zfs": {},
        },
        entities: {
          server: [
            {
              name: "admin",
              description: "admin entitlement description",
            },
          ],
        },
      };

      const entitlementOptions = generateEntitlementOptions(
        resourceType,
        permissions,
        metadata,
      );

      expect(entitlementOptions).toEqual([
        {
          disabled: true,
          label: "Select an option",
          value: "",
          title: "",
        },
        {
          disabled: true,
          label: "Built-in roles",
          value: "",
        },
        {
          label: "admin",
          value: "admin",
          title: "admin entitlement description",
        },
        {
          label: "viewer",
          value: "viewer",
        },
        {
          disabled: true,
          label: "Granular entitlements",
          value: "",
        },
        {
          label: "can_edit",
          value: "can_edit",
        },
        {
          label: "can_view",
          value: "can_view",
        },
      ]);
    });

    it("should generate entitlement options without metadata", () => {
      const entitlementOptions = generateEntitlementOptions(
        resourceType,
        permissions,
      );

      expect(entitlementOptions).toEqual([
        {
          disabled: true,
          label: "Select an option",
          value: "",
          title: "",
        },
        {
          disabled: true,
          label: "Built-in roles",
          value: "",
        },
        {
          label: "admin",
          value: "admin",
        },
        {
          label: "viewer",
          value: "viewer",
        },
        {
          disabled: true,
          label: "Granular entitlements",
          value: "",
        },
        {
          label: "can_edit",
          value: "can_edit",
        },
        {
          label: "can_view",
          value: "can_view",
        },
      ]);
    });
  });

  it("generatePermissionSort", () => {
    const permissions = [
      {
        entity_type: "identity",
        url: "/1.0/auth/identities/oidc/bar@bar.com",
        entitlement: "can_delete",
        id: "identity/1.0/auth/identities/oidc/bar@bar.comcan_delete",
        resourceLabel: "bar",
      },
      {
        id: "group/1.0/auth/groups/g-1can_delete",
        entity_type: "group",
        url: "/1.0/auth/groups/g-1",
        entitlement: "can_delete",
        resourceLabel: "g-1",
      },
      {
        entity_type: "server",
        url: "/1.0",
        entitlement: "admin",
        id: "server/1.0admin",
        resourceLabel: "server",
      },
      {
        entity_type: "project",
        url: "/1.0/projects/default",
        entitlement: "image_alias_manager",
        id: "project/1.0/projects/defaultimage_alias_manager",
        resourceLabel: "default",
      },

      {
        entity_type: "group",
        url: "/1.0/auth/groups/g-1",
        entitlement: "can_view",
        id: "group/1.0/auth/groups/g-1can_view",
        resourceLabel: "g-1",
      },
      {
        id: "image/1.0/images/a56eb59962b706e727703aaa415ae4c584c8fc6a661fcd3aba83bc9eff237ac0?project=defaultcan_edit",
        entity_type: "image",
        url: "/1.0/images/a56eb59962b706e727703aaa415ae4c584c8fc6a661fcd3aba83bc9eff237ac0?project=default",
        entitlement: "can_edit",
        resourceLabel:
          "Alpinelinux 3.16 x86_64 (cloud) (20240415_0234) (project: default)",
      },
    ];

    permissions.sort(permissionSort);

    expect(permissions).toEqual([
      {
        entity_type: "server",
        url: "/1.0",
        entitlement: "admin",
        id: "server/1.0admin",
        resourceLabel: "server",
      },
      {
        entity_type: "identity",
        url: "/1.0/auth/identities/oidc/bar@bar.com",
        entitlement: "can_delete",
        id: "identity/1.0/auth/identities/oidc/bar@bar.comcan_delete",
        resourceLabel: "bar",
      },
      {
        id: "group/1.0/auth/groups/g-1can_delete",
        entity_type: "group",
        url: "/1.0/auth/groups/g-1",
        entitlement: "can_delete",
        resourceLabel: "g-1",
      },
      {
        entity_type: "group",
        url: "/1.0/auth/groups/g-1",
        entitlement: "can_view",
        id: "group/1.0/auth/groups/g-1can_view",
        resourceLabel: "g-1",
      },
      {
        entity_type: "project",
        url: "/1.0/projects/default",
        entitlement: "image_alias_manager",
        id: "project/1.0/projects/defaultimage_alias_manager",
        resourceLabel: "default",
      },
      {
        id: "image/1.0/images/a56eb59962b706e727703aaa415ae4c584c8fc6a661fcd3aba83bc9eff237ac0?project=defaultcan_edit",
        entity_type: "image",
        url: "/1.0/images/a56eb59962b706e727703aaa415ae4c584c8fc6a661fcd3aba83bc9eff237ac0?project=default",
        entitlement: "can_edit",
        resourceLabel:
          "Alpinelinux 3.16 x86_64 (cloud) (20240415_0234) (project: default)",
      },
    ]);
  });
});
