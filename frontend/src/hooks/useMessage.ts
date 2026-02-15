/**
 * 使用 Ant Design message 的 hook
 * 解决静态函数无法消费上下文的问题
 */

import { App } from 'antd';

export function useMessage() {
  const { message } = App.useApp();
  return message;
}
