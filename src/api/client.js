import axios from 'axios'

const api = axios.create({
  baseURL: 'http://46.225.236.99/api/v1',
})

api.interceptors.response.use(
  function(response) {
    return response
  },
  function(error) {
    const originalRequest = error.config

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh')
      if (!refreshToken) {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      return axios.post('http://46.225.236.99/api/v1/auth/refresh/', {
        refresh: refreshToken
      }).then(function(res) {
        const newAccess = res.data.access
        localStorage.setItem('access', newAccess)
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccess
        return api(originalRequest)
      }).catch(function() {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.href = '/login'
        return Promise.reject(error)
      })
    }

    return Promise.reject(error)
  }
)

export default api