import axios from 'axios';

const api = axios.create({
  baseURL: 'https://mapedia.org/api/v1',
});

// 1. EKSİK OLAN KISIM: İstek (Request) Interceptor'ı
// Bu bölüm, API'ye giden her isteğin başlığına (header) otomatik olarak access token'ı ekler.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. YENİLENMİŞ KISIM: Yanıt (Response) Interceptor'ı
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Eğer hata 401 (Yetkisiz) ise ve bu istek daha önce tekrar denenmediyse
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh');
      
      // Refresh token yoksa direkt çıkış işlemlerini yap
      if (!refreshToken) {
        return logoutAndRedirect(error);
      }

      try {
        // Token yenileme isteğini gönder (async/await ile daha temiz görünüm)
        const res = await axios.post('https://mapedia.org/api/v1/auth/refresh/', {
          refresh: refreshToken
        });

        const newAccess = res.data.access;
        localStorage.setItem('access', newAccess);

        // Orijinal isteğin Authorization başlığını yeni token ile güncelle ve tekrar istek at
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Yenileme işlemi başarısız olursa (örneğin refresh token süresi de dolmuşsa)
        return logoutAndRedirect(error);
      }
    }

    return Promise.reject(error);
  }
);

// Tekrar eden çıkış ve yönlendirme kodlarını tek bir fonksiyonda topladık
const logoutAndRedirect = (error) => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  window.location.href = '/login';
  return Promise.reject(error);
};

export default api;