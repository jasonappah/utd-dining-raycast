import { ActionPanel, List, Action, Color, Icon } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useEffect, useMemo } from "react";

export type LocationStatusResponse =
  | {
      status: "success";
      request_time: number;
      records: number;
      locations: Array<{
        id: string;
        name: string;
        open: boolean;
        status: {
          label: string;
          message: string;
          color: string;
        };
        occupancy: string;
        address: {
          street: string;
          metadata?: string;
          city: string;
          state: string;
          zip_code: string;
          lat: number;
          lon: number;
          phone?: string;
          dst: boolean;
          gmt: number;
          phone_formatted?: string;
          gmt_offset: number;
          coordinates: Array<number>;
          manual_coords: Array<number>;
        };
      }>;
    }
  | { status: "failure" };

const locationsListApiURL = `https://api.dineoncampus.com/v1/locations/status?site_id=5751fd3790975b60e04893f2&platform=0`;
const diningHoursPageURL = `https://dineoncampus.com/utdallasdining/hours-of-operation`;

export default function Command() {
  const { isLoading, data, revalidate } = useFetch<LocationStatusResponse>(locationsListApiURL, {
    keepPreviousData: true,
  });
  useEffect(() => {
    const ONE_MIN_IN_MS = 1000 * 60;
    const interval = setInterval(() => {
      revalidate();
    }, ONE_MIN_IN_MS);

    return clearInterval(interval);
  }, []);

  const locationsGroupedByLabel = useMemo(() => {
    if (!data || data.status !== "success") return null;
    const locationsGroupedByLabel = data.locations.reduce(
      (acc, location) => {
        const formattedLabel = location.status.label[0].toUpperCase() + location.status.label.slice(1);
        if (!acc[formattedLabel]) {
          acc[formattedLabel] = [];
        }
        acc[formattedLabel].push(location);
        return acc;
      },
      {} as Record<string, typeof data.locations>,
    );
    return locationsGroupedByLabel;
  }, [data]);
  return (
    <List isLoading={isLoading}>
      {locationsGroupedByLabel &&
        Object.entries(locationsGroupedByLabel).map(([label, locations]) => (
          <List.Section title={label} key={label}>
            {locations.map((location) => (
              <List.Item
                key={location.id}
                title={location.name}
                subtitle={location.status.message}
                actions={
                  <ActionPanel>
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                      onAction={revalidate}
                    />
                    <Action.OpenInBrowser title="View Operational Hours" url={diningHoursPageURL} />
                  </ActionPanel>
                }
                icon={
                  location.status.color === "green"
                    ? { source: Icon.CheckCircle, tintColor: Color.Green }
                    : location.status.color === "red"
                      ? { source: Icon.XMarkCircle, tintColor: Color.Red }
                      : { source: Icon.ExclamationMark, tintColor: Color.Orange }
                }
              />
            ))}
          </List.Section>
        ))}
    </List>
  );
}
