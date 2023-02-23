import React, { FC, ReactNode } from "react";
import classnames from "classnames";

import { Spinner } from "@canonical/react-components";

import "../../sass/_aside.scss";

interface Props {
  children: ReactNode;
  width?: "wide" | "narrow";
  pinned?: boolean;
  loading?: boolean;
  isSplit?: boolean;
}

const Aside: FC<Props> = ({
  children,
  width,
  pinned = false,
  loading = false,
  isSplit = false,
}: Props) => {
  return (
    <div
      className={classnames("l-aside", {
        "is-narrow": width === "narrow",
        "is-wide": width === "wide",
        "is-pinned": pinned,
        "is-split": isSplit,
      })}
    >
      {loading ? (
        <div className="loading">
          <Spinner />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default Aside;
