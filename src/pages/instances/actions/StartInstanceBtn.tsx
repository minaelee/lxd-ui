import React, { FC } from "react";
import { LxdInstance } from "types/instance";
import { useQueryClient } from "@tanstack/react-query";
import { startInstance, unfreezeInstance } from "api/instances";
import { queryKeys } from "util/queryKeys";
import { Button } from "@canonical/react-components";
import { useNotify } from "context/notify";
import { useInstanceLoading } from "context/instanceLoading";
import InstanceLink from "pages/instances/InstanceLink";

interface Props {
  instance: LxdInstance;
}

const StartInstanceBtn: FC<Props> = ({ instance }) => {
  const instanceLoading = useInstanceLoading();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const isLoading =
    instanceLoading.getType(instance) === "Starting" ||
    instance.status === "Starting";

  const enabledStatuses = ["Stopped", "Frozen"];
  const isDisabled = isLoading || !enabledStatuses.includes(instance.status);

  const handleStart = () => {
    instanceLoading.setLoading(instance, "Starting");
    const mutation =
      instance.status === "Frozen" ? unfreezeInstance : startInstance;
    mutation(instance)
      .then(() => {
        notify.success(
          <>
            Instance <InstanceLink instance={instance} /> started.
          </>
        );
      })
      .catch((e) => {
        notify.failure(
          <>
            Error starting instance <InstanceLink instance={instance} />.
          </>,
          e
        );
      })
      .finally(() => {
        instanceLoading.setFinish(instance);
        void queryClient.invalidateQueries({
          queryKey: [queryKeys.instances],
        });
      });
  };

  return (
    <Button
      appearance="base"
      hasIcon
      dense={true}
      disabled={isDisabled}
      onClick={handleStart}
      type="button"
      aria-label={isLoading ? "Starting" : "Start"}
      title="Start"
    >
      <i
        className={
          isLoading
            ? "p-icon--spinner u-animation--spin"
            : "p-icon--start-instance"
        }
      />
    </Button>
  );
};

export default StartInstanceBtn;