/** 实体浏览 · 对象画像 Tab。 */
export type EntityBrowsingObjectProfileTab =
  | "basic-info"
  | "entity-list"
  | "entity-stats"
  | "standard-usage";

/** 对象画像目录节点。 */
export interface EntityBrowsingObjectProfileTocNode {
  /** 锚点 id。 */
  id: string;
  /** 展示文案。 */
  label: string;
  /** 子目录。 */
  children?: EntityBrowsingObjectProfileTocNode[];
}

/** 对象画像图集项。 */
export interface EntityBrowsingObjectProfileImage {
  /** 图片 id。 */
  id: string;
  /** 图片地址。 */
  src: string;
  /** 图注。 */
  caption: string;
}

/** 对象画像正文块。 */
export interface EntityBrowsingObjectProfileBlock {
  /** 块 / 锚点 id。 */
  id: string;
  /** 块类型。 */
  type: "heading" | "paragraph" | "list" | "gallery";
  /** 标题或段落文案。 */
  content?: string;
  /** 标题层级。 */
  level?: 1 | 2 | 3;
  /** 列表项（type=list）。 */
  items?: string[];
  /** 图集。 */
  images?: EntityBrowsingObjectProfileImage[];
}

/** 对象画像属性子项（嵌套圆点）。 */
export interface EntityBrowsingObjectProfileAttrChild {
  /** 子项名；无 value 时整段作为条目文案。 */
  label: string;
  /** 子项值。 */
  value?: string;
  /** 再嵌套一层（如 Mk 41 下的构型数量）。 */
  children?: EntityBrowsingObjectProfileAttrChild[];
}

/** 对象画像属性项。 */
export interface EntityBrowsingObjectProfileAttrItem {
  /** 属性名。 */
  label: string;
  /** 单行属性值。 */
  value?: string;
  /** 多行属性值（如按 Flight 分行，右栏缩进对齐）。 */
  lines?: string[];
  /** 嵌套子项（如现役数量下的 Flight）。 */
  children?: EntityBrowsingObjectProfileAttrChild[];
}

/** 对象画像属性分组。 */
export interface EntityBrowsingObjectProfileAttrGroup {
  /** 分组 id。 */
  id: string;
  /** 分组标题（属性列表面板名）。 */
  label: string;
  /** 面板内居中小节（如级别概览）。 */
  sectionTitle?: string;
  /** 属性列表。 */
  items: EntityBrowsingObjectProfileAttrItem[];
}

/** 对象画像关系叶子节点。 */
export interface EntityBrowsingObjectProfileRelationNode {
  /** 节点 id。 */
  id: string;
  /** 节点名称。 */
  name: string;
}


/** 对象画像实体统计 · 饼/扇区项。 */
export interface EntityBrowsingObjectProfileStatsSlice {
  /** 类目名。 */
  name: string;
  /** 数值。 */
  value: number;
}

/** 对象画像实体统计 · 柱状图数据。 */
export interface EntityBrowsingObjectProfileStatsBar {
  /** 横轴类目。 */
  categories: string[];
  /** 与类目对齐的数值。 */
  values: number[];
}

/** 对象画像实体统计页数据。 */
export interface EntityBrowsingObjectProfileStatsData {
  /** 页面标题。 */
  title: string;
  /** 构型统计（饼图）。 */
  configPie: EntityBrowsingObjectProfileStatsSlice[];
  /** 服役数量（柱图）。 */
  serviceBar: EntityBrowsingObjectProfileStatsBar;
  /** 母港统计（柱图）。 */
  homePortBar: EntityBrowsingObjectProfileStatsBar;
  /** 状态统计（饼图）。 */
  statusPie: EntityBrowsingObjectProfileStatsSlice[];
  /** 制造厂商（柱图）。 */
  manufacturerBar: EntityBrowsingObjectProfileStatsBar;
  /** 下水时间（柱图）。 */
  launchBar: EntityBrowsingObjectProfileStatsBar;
}


/** 对象画像标准应用 · 分类树节点。 */
export interface EntityBrowsingObjectProfileStandardCategory {
  /** 分类 id。 */
  id: string;
  /** 分类名。 */
  label: string;
  /** 属性数量。 */
  propertyCount: number;
  /** 子分类。 */
  children?: EntityBrowsingObjectProfileStandardCategory[];
}

/** 对象画像标准应用 · 标准详情。 */
export interface EntityBrowsingObjectProfileStandardDetail {
  /** 所属标准。 */
  standardFullName: string;
  /** 数据元统一标识符。 */
  identifier: string;
  /** 数据元名称。 */
  name: string;
  /** 数据元简称。 */
  shortName: string;
  /** 数据元定义。 */
  definition: string;
  /** 数据元值的数据类型。 */
  valueDataType: string;
  /** 参数。 */
  parameter: string;
  /** 计量单位。 */
  unit: string;
  /** 组成模式代码。 */
  compositionCode: string;
  /** 交换格式。 */
  exchangeFormat: string;
  /** 数据元的值域。 */
  valueDomain: string;
  /** 数据元取多值标识。 */
  multiValue: string;
}

/** 对象画像标准应用 · 属性行。 */
export interface EntityBrowsingObjectProfileStandardAttrRow {
  /** 行 id。 */
  id: string;
  /** 所属分类 id。 */
  categoryId: string;
  /** 属性名称。 */
  name: string;
  /** 数据类型。 */
  dataType: string;
  /** 属性描述。 */
  description: string;
  /** 是否引用标准。 */
  referencesStandard: boolean;
  /** 标准名称（展示）。 */
  standardName: string;
  /** 标准符合度，null 表示无。 */
  compliancePercent: number | null;
  /** 标准详情；未引用时为空。 */
  standardDetail: EntityBrowsingObjectProfileStandardDetail | null;
}

/** 对象画像标准应用页数据。 */
export interface EntityBrowsingObjectProfileStandardUsageData {
  /** 分类树。 */
  categories: EntityBrowsingObjectProfileStandardCategory[];
  /** 属性行。 */
  rows: EntityBrowsingObjectProfileStandardAttrRow[];
}

/** 对象画像完整数据。 */
export interface EntityBrowsingObjectProfileData {
  /** 对象 id。 */
  objectId: string;
  /** 展示名。 */
  displayName: string;
  /** 封面图。 */
  coverImage: string;
  /** 侧栏缩略图。 */
  sideImage: string;
  /** 目录。 */
  toc: EntityBrowsingObjectProfileTocNode[];
  /** 正文块。 */
  blocks: EntityBrowsingObjectProfileBlock[];
  /** 属性分组。 */
  attributeGroups: EntityBrowsingObjectProfileAttrGroup[];
  /** 关系图中心名。 */
  relationCenterName: string;
  /** 关系叶子节点。 */
  relationNodes: EntityBrowsingObjectProfileRelationNode[];
}
