import axios from "axios";

const instance = axios.create({
    baseURL: process.env.NODE_ENV === "production" ? "/" : "/api/",
    withCredentials: true
});

export default instance;
