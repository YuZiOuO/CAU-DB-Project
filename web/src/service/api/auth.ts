import { request } from '../http';

/** 获取当前登录用户的信息 */
export function fetchGetProfile() {
  const methodInstance = request.Get<Service.ResponseResult<Auth.UserInfo>>('/auth/profile');
  return methodInstance;
}

/** 更新当前登录用户的基本信息 */
export function fetchUpdateProfile(data: Partial<Pick<Auth.UserInfo, 'name' | 'address' | 'phone_number'>>) {
  const methodInstance = request.Put<Service.ResponseResult<Auth.UserInfo>>('/auth/profile', data);
  return methodInstance;
}

/** 修改当前登录用户的密码 */
export function fetchChangePassword(data: Auth.PasswordChangeForm) {
  const methodInstance = request.Put<Service.ResponseResult<null>>('/auth/change-password', data);
  return methodInstance;
}