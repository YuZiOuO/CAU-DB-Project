import { defineStore } from 'pinia';
import { fetchLogin, fetchGetProfile, fetchUpdateProfile, fetchChangePassword } from '@/service/api/auth';
import { getToken, setToken, clearToken,加密密码 } from '@/utils/auth';
import { fetchLogout } from '@/service';
import { useRouterPush } from '@/hooks';

interface AuthState {
  token: string | null;
  userInfo: Auth.UserInfo;
  // ... other state properties
}

const initialUserInfo: Auth.UserInfo = {
  user_id: 0,
  name: '',
  email: '',
  role: [],
  address: '',
  phone_number: '',
  join_date: '',
};

export const useAuthStore = defineStore('auth-store', {
  // ...existing state and getters...
  state: (): AuthState => ({
    token: getToken(),
    userInfo: { ...initialUserInfo },
    // ... other state properties
  }),
  getters: {
    isLogin(): boolean {
      return Boolean(this.token);
    },
    // ... other getters
  },
  actions: {
    // ...existing login, logout, getUserInfo actions...
    async login(loginName: string, loginPsw: string) {
      const { data, isSuccess } = await fetchLogin<{ token: string }>(
        loginName,
        加密密码(loginPsw),
      )
      if (isSuccess) {
        setToken(data.token)
        this.token = data.token
        await this.getUserInfo() // 获取用户信息
        const { routerPush } = useRouterPush(false)
        routerPush({ path: import.meta.env.VITE_HOME_PATH }) // 跳转首页
        window.$message.success('登录成功')
      }
    },

    async getUserInfo() {
      if (!this.token)
        return
      const { data, isSuccess } = await fetchGetProfile()
      if (isSuccess)
        this.userInfo = data
      else
        this.resetAuthStore() // 获取用户信息失败，重置状态
    },
    
    async updateUserProfile(profileData: Partial<Pick<Auth.UserInfo, 'name' | 'address' | 'phone_number'>>) {
      try {
        const { data, isSuccess } = await fetchUpdateProfile(profileData);
        if (isSuccess) {
          // Update local userInfo with the response, as backend might return the full updated object
          this.userInfo = { ...this.userInfo, ...data };
          window.$message.success('资料更新成功');
        } else {
          // Error message is handled by the global request interceptor
        }
        return isSuccess;
      } catch (error) {
        console.error('更新用户资料失败:', error);
        return false;
      }
    },

    async changePassword(passwordData: Auth.PasswordChangeForm) {
      try {
        const { isSuccess } = await fetchChangePassword({
          old_password: 加密密码(passwordData.old_password),
          new_password: 加密密码(passwordData.new_password),
        });
        if (isSuccess) {
          window.$message.success('密码修改成功');
        } else {
          // Error message is handled by the global request interceptor
        }
        return isSuccess;
      } catch (error) {
        console.error('修改密码失败:', error);
        return false;
      }
    },
    
    resetAuthStore() {
      clearToken();
      this.$reset();
    },

    async logout() {
      await fetchLogout();
      this.resetAuthStore();
      const { routerPush } = useRouterPush(false);
      routerPush({ name: 'login', query: { redirect: '/' } });
      window.$message.success('退出成功');
    },
  },
});
