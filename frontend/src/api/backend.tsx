import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

export async function sendTrajectoryPoint(objectId: string, point: any) {
  const res = await api.post(`/trajectory/${objectId}/add`, point);
  return res.data; // { probability }
}

export async function getLatestTrajectory(objectId: string) {
  const res = await api.get(`/trajectory/${objectId}/latest`);
  return res.data; // Array of points
}
