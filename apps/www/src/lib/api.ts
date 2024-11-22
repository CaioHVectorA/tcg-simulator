
import axios from "axios";
const baseURL = 'http://localhost:8080'

export const api = axios.create({
    baseURL,
    validateStatus: () => true
})