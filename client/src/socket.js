import { io } from "socket.io-client";
import { API } from "./api.js";

export const socket = io(API, { autoConnect: false });
