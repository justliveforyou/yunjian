/** 标签 */
export interface Tag {
  id: string;
  name: string;
  color: string;             // HEX 颜色
  icon?: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 创建标签参数 */
export interface CreateTagParams {
  name: string;
  color: string;
  icon?: string;
}

/** 更新标签参数 */
export interface UpdateTagParams {
  name?: string;
  color?: string;
  icon?: string;
}
