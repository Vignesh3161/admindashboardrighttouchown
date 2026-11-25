import React from "react";
import PageSkeleton from "./skeletons/PageSkeleton";

/**
 * Universal Loading State.
 * Renders high-performance PageSkeleton (no spinners).
 */
export default function LoadingState(props) {
  const {
    type = "dashboard",
    statsCount = 5,
    columns = 6,
    rows = 6,
    ...rest
  } = props;

  return (
    <PageSkeleton
      type={type}
      statsCount={statsCount}
      columns={columns}
      rows={rows}
      {...rest}
    />
  );
}
