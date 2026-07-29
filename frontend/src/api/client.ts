import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('flowops_token') ??
    sessionStorage.getItem('flowops_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('flowops_token')
      localStorage.removeItem('flowops_user')

      sessionStorage.removeItem('flowops_token')
      sessionStorage.removeItem('flowops_user')
    }

    return Promise.reject(error)
  },
)

export default apiClient