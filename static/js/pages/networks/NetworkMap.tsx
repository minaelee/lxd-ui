import React, { FC, useRef } from "react";
import { Row } from "@canonical/react-components";
import NotificationRow from "components/NotificationRow";
import BaseLayout from "components/BaseLayout";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "util/queryKeys";
import useNotification from "util/useNotification";
import { useParams } from "react-router-dom";
import CytoscapeComponent from "react-cytoscapejs";
import { fetchInstances } from "api/instances";
import { isNicDevice } from "util/devices";
import Cytoscape, { EdgeDefinition } from "cytoscape";
import { fetchNetworks } from "api/networks";
import { LxdInstance } from "types/instance";
import Loader from "components/Loader";
import popper from "cytoscape-popper";
import MapTooltip, {
  MapTooltipProps,
  mountElement,
} from "pages/networks/MapTooltip";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
Cytoscape.use(popper);

interface PopperRef {
  destroy: () => void;
}

interface CyEvent {
  target: {
    data: () => {
      details: MapTooltipProps;
    };
    popper: (content: {
      content: HTMLDivElement;
      popper: {
        placement: string;
        removeOnDestroy: boolean;
      };
    }) => PopperRef;
  };
}

const NetworkMap: FC = () => {
  const notify = useNotification();
  const { project } = useParams<{
    project: string;
  }>();
  const cyPopperRef = useRef<PopperRef | null>(null);

  if (!project) {
    return <>Missing project</>;
  }

  const { data: instances = [], isLoading: instanceLoading } = useQuery({
    queryKey: [queryKeys.instances],
    queryFn: () => fetchInstances(project),
  });

  const { data: networks = [], isLoading: networkLoading } = useQuery({
    queryKey: [queryKeys.networks],
    queryFn: () => fetchNetworks(project),
  });

  if (instanceLoading || networkLoading) {
    return <Loader />;
  }

  const getInstanceColor = (instance: LxdInstance) => {
    switch (instance.status) {
      case "Running":
        return "#0E8420";
      default:
        return "#D9D9D9";
    }
  };

  const instanceNodes = instances.map((instance) => {
    return {
      data: {
        id: instance.name,
        label: instance.name,
        details: {
          type: "instance",
          item: instance,
        },
      },
      style: {
        backgroundColor: getInstanceColor(instance),
      },
    };
  });

  const networkNodes = networks.map((network) => {
    return {
      data: {
        id: network.name,
        label: network.name,
        details: {
          type: "network",
          item: network,
        },
      },
      style: {
        shape: "square",
        backgroundColor: "#0066cc",
      },
    };
  });

  const edges: EdgeDefinition[] = [];
  instances.map((instance) =>
    Object.values(instance.expanded_devices)
      .filter(isNicDevice)
      .map((network) => {
        edges.push({
          data: { source: instance.name, target: network.network, label: "" },
          style: {
            lineColor: "#D9D9D9",
          },
        });
      })
  );

  const elements = [...networkNodes, ...instanceNodes, ...edges];

  return (
    <>
      <BaseLayout title="Network map (beta)">
        <NotificationRow notify={notify} />
        <Row>
          <CytoscapeComponent
            elements={elements}
            id="network-map"
            layout={{
              name: "cose",
              nodeDimensionsIncludeLabels: true,
              animate: false,
            }}
            cy={(cy) => {
              cy.nodes().on("mouseover", (event: CyEvent) => {
                cyPopperRef.current = event.target.popper({
                  content: mountElement(
                    <MapTooltip {...event.target.data().details} />
                  ),
                  popper: {
                    placement: "right",
                    removeOnDestroy: true,
                  },
                });
              });
              cy.nodes().on("mouseout", () => {
                if (cyPopperRef.current) {
                  cyPopperRef.current.destroy();
                  const tooltip =
                    document.getElementsByClassName("map-tooltip");
                  tooltip[0].parentNode?.removeChild(tooltip[0]);
                }
              });
            }}
          />
        </Row>
      </BaseLayout>
    </>
  );
};

export default NetworkMap;
