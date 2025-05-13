/// <reference path="../global.d.ts"/>

namespace Api {
  namespace Login {
    /* 登录返回的用户字段, 该数据是根据用户表扩展而来, 部分字段可能需要覆盖，例如id */
    interface Info {
      /** 访问token */
      access_token: string
      /** 刷新token */
      refresh_token: string
      /** 用户基本信息 */
      user: Entity.User
    }
  }
}
