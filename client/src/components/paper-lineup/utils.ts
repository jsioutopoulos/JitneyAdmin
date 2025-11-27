export const getCleanTripId = (id: string): string => {
  return id.replace(/sg|trans|\/|\+|\s+/gi, "").replace(/[^0-9]/g, "");
};
