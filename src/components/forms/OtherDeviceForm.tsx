import React, { FC } from "react";
import {
  Button,
  Icon,
  Input,
  Label,
  Select,
  useNotify,
} from "@canonical/react-components";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import { LxdDeviceValue } from "types/device";
import { InstanceAndProfileFormikProps } from "./instanceAndProfileFormValues";
import { fetchProfiles } from "api/profiles";
import { fetchConfigOptions } from "api/server";
import { useSupportedFeatures } from "context/useSupportedFeatures";
import { toConfigFields } from "util/config";
import ConfigFieldDescription from "pages/settings/ConfigFieldDescription";
import Loader from "components/Loader";
import ScrollableForm from "components/ScrollableForm";
import RenameDeviceInput from "components/forms/RenameDeviceInput";
import { EditInstanceFormValues } from "pages/instances/EditInstance";
import { getInheritedOtherDevices } from "util/configInheritance";
import {
  deviceKeyToLabel,
  getExistingDeviceNames,
  isOtherDevice,
} from "util/devices";
import classnames from "classnames";
import ConfigurationTable from "components/ConfigurationTable";
import { MainTableRow } from "@canonical/react-components/dist/components/MainTable/MainTable";
import { getConfigurationRowBase } from "components/ConfigurationRow";
import { getInheritedDeviceRow } from "components/forms/InheritedDeviceRow";
import { ensureEditMode } from "util/instanceEdit";
import {
  addNoneDevice,
  deduplicateName,
  findNoneDeviceIndex,
  removeDevice,
} from "util/formDevices";

interface Props {
  formik: InstanceAndProfileFormikProps;
  project: string;
}

const OtherDeviceForm: FC<Props> = ({ formik, project }) => {
  const notify = useNotify();
  const isInstance = formik.values.entityType === "instance";
  const isContainer =
    isInstance &&
    (formik.values as EditInstanceFormValues).instanceType === "container";
  const isVm =
    isInstance &&
    (formik.values as EditInstanceFormValues).instanceType ===
      "virtual-machine";

  const { hasMetadataConfiguration } = useSupportedFeatures();

  const { data: configOptions, isLoading: isConfigOptionsLoading } = useQuery({
    queryKey: [queryKeys.configOptions],
    queryFn: () => fetchConfigOptions(hasMetadataConfiguration),
  });

  const {
    data: profiles = [],
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: [queryKeys.profiles],
    queryFn: () => fetchProfiles(project),
  });

  if (profileError) {
    notify.failure("Loading profiles failed", profileError);
  }

  const inheritedDevices = getInheritedOtherDevices(formik.values, profiles);
  const existingDeviceNames = getExistingDeviceNames(formik.values, profiles);

  const addDevice = () => {
    const copy = [...formik.values.devices];
    copy.push({
      type: "usb",
      name: deduplicateName("custom-device", 1, existingDeviceNames),
    });
    void formik.setFieldValue("devices", copy);
  };

  if (isProfileLoading || isConfigOptionsLoading) {
    return <Loader />;
  }

  const hasCustomDevices = formik.values.devices.some(isOtherDevice);

  const inheritedRows: MainTableRow[] = [];
  inheritedDevices.forEach((item) => {
    const noneDeviceId = findNoneDeviceIndex(item.key, formik);
    const isNoneDevice = noneDeviceId !== -1;

    inheritedRows.push(
      getConfigurationRowBase({
        className: "no-border-top override-with-form",
        configuration: (
          <div
            className={classnames("device-name", {
              "u-text--muted": isNoneDevice,
            })}
          >
            <b>{item.key}</b>
          </div>
        ),
        inherited: (
          <div className="p-text--small u-text--muted u-no-margin--bottom">
            From: {item.source}
          </div>
        ),
        override: isNoneDevice ? (
          <Button
            className="u-no-margin--top u-no-margin--bottom"
            onClick={() => {
              ensureEditMode(formik);
              removeDevice(noneDeviceId, formik);
            }}
            type="button"
            appearance="base"
            hasIcon
            dense
            title="Attach device"
          >
            <Icon name="connected" />
            <span>Reattach</span>
          </Button>
        ) : (
          <Button
            className="u-no-margin--top u-no-margin--bottom"
            onClick={() => {
              ensureEditMode(formik);
              addNoneDevice(item.key, formik);
            }}
            type="button"
            appearance="base"
            hasIcon
            dense
            title="Detach device"
          >
            <Icon name="disconnect" />
            <span>Detach</span>
          </Button>
        ),
      }),
    );

    Object.keys(item.device).forEach((key) => {
      if (key === "name" || key === "type") {
        return null;
      }

      inheritedRows.push(
        getInheritedDeviceRow({
          label: deviceKeyToLabel(key),
          inheritValue: item.device[key as keyof typeof item.device],
          readOnly: false,
          isDeactivated: isNoneDevice,
        }),
      );
    });
  });

  const customRows: MainTableRow[] = [];
  formik.values.devices.forEach((formDevice, index) => {
    if (!isOtherDevice(formDevice)) {
      return;
    }
    const device = formik.values.devices[index];

    const type = device.type === "usb" ? "unix-usb" : device.type;
    const id = `device-${type}` as "server";

    const rawOptions = configOptions?.configs[id];
    const configFields = rawOptions ? toConfigFields(rawOptions) : [];

    customRows.push(
      getConfigurationRowBase({
        className: "no-border-top custom-device-name",
        configuration: (
          <RenameDeviceInput
            name={device.name}
            index={index}
            setName={(name) => {
              ensureEditMode(formik);
              void formik.setFieldValue(`devices.${index}.name`, name);
            }}
          />
        ),
        inherited: "",
        override: (
          <Button
            className="u-no-margin--top u-no-margin--bottom"
            onClick={() => {
              ensureEditMode(formik);
              removeDevice(index, formik);
            }}
            type="button"
            appearance="base"
            hasIcon
            dense
            title="Detach GPU"
          >
            <Icon name="disconnect" />
            <span>Detach</span>
          </Button>
        ),
      }),
    );

    customRows.push(
      getConfigurationRowBase({
        className: "no-border-top inherited-with-form",
        configuration: <Label forId={`devices.${index}.type`}>Type</Label>,
        inherited: (
          <Select
            name={`devices.${index}.type`}
            id={`devices.${index}.type`}
            className="u-no-margin--bottom"
            onBlur={formik.handleBlur}
            onChange={(e) => {
              ensureEditMode(formik);
              void formik.setFieldValue(`devices.${index}`, {
                type: e.target.value,
                name: device.name,
              });
            }}
            value={device.type}
            options={[
              {
                label: "Infiniband (container only)",
                value: "infiniband",
                disabled: isVm,
              },
              {
                label: "PCI (VM only)",
                value: "pci",
                disabled: isContainer,
              },
              { label: "TPM", value: "tpm" },
              {
                label: "Unix Block (container only)",
                value: "unix-block",
                disabled: isVm,
              },
              {
                label: "Unix Char (container only)",
                value: "unix-char",
                disabled: isVm,
              },
              {
                label: "Unix Hotplug (container only)",
                value: "unix-hotplug",
                disabled: isVm,
              },
              { label: "USB", value: "usb" },
            ]}
          />
        ),
        override: "",
      }),
    );

    configFields.forEach((field) => {
      const key = `devices.${index}.${field.key}`;
      const value = device[field.key as keyof LxdDeviceValue];

      if (field.key === "name") {
        return;
      }

      customRows.push(
        getConfigurationRowBase({
          className: "no-border-top inherited-with-form",
          configuration: (
            <Label forId={key}>{deviceKeyToLabel(field.key)}</Label>
          ),
          inherited: (
            <Input
              name={key}
              id={key}
              key={`${key}-${type}`}
              onBlur={formik.handleBlur}
              onChange={(e) => {
                ensureEditMode(formik);
                formik.handleChange(e);
              }}
              value={value}
              type="text"
              placeholder={field.default}
              help={<ConfigFieldDescription description={field.shortdesc} />}
              className="u-no-margin--bottom"
            />
          ),
          override: "",
        }),
      );
    });
  });

  return (
    <ScrollableForm className="device-form">
      {/* hidden submit to enable enter key in inputs */}
      <Input type="submit" hidden value="Hidden input" />

      {inheritedRows.length > 0 && (
        <div className="inherited-devices">
          <h2 className="p-heading--4">Inherited devices</h2>
          <ConfigurationTable rows={inheritedRows} />
        </div>
      )}

      {hasCustomDevices && (
        <div className="custom-devices">
          <h2 className="p-heading--4 custom-devices-heading">
            Custom devices
          </h2>
          <ConfigurationTable rows={customRows} />
        </div>
      )}

      <Button
        onClick={() => {
          ensureEditMode(formik);
          addDevice();
        }}
        type="button"
        hasIcon
      >
        <Icon name="plus" />
        <span>Attach custom device</span>
      </Button>
    </ScrollableForm>
  );
};

export default OtherDeviceForm;