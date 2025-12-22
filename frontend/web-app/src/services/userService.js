import api from './api';

const userService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.put('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/profile/password', data);
    return response.data;
  },

  getActivity: async () => {
    const response = await api.get('/profile/activity');
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await api.get('/profile/notifications');
    return response.data;
  },

  updateNotificationPreferences: async (preferences) => {
    const response = await api.put('/profile/notifications', preferences);
    return response.data;
  },
};

export default userService;

