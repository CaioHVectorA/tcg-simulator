
import axios from "axios";
import { redirect } from "next/navigation";
const baseURL = 'http://localhost:8080'

export const api = axios.create({
    baseURL,
    validateStatus: () => true,
})
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log({error})
        if (error.response.status === 401) {
            redirect('/login')
        }
        return Promise.reject(error)
    }
)
export const getApiImage = (url: string) => `${baseURL}${url}`