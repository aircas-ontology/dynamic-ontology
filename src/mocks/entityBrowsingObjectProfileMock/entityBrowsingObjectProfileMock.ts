import coverImage from "@/assets/pages/ontologySpaceManagement/images/navy.webp";
import {
  ENTITY_BROWSING_FULL_PROFILE_OBJECT_ID,
  ENTITY_BROWSING_LITE_PROFILE_OBJECT_ID,
} from "@/utils/entityBrowseConstants";
import type { EntityBrowsingObjectProfileData } from "@/types";

/** 阿利·伯克级默认对象画像 Mock（完整四 Tab）。 */
export const burkeEntityBrowsingObjectProfileMock: EntityBrowsingObjectProfileData = {
  objectId: ENTITY_BROWSING_FULL_PROFILE_OBJECT_ID,
  displayName: "阿利·伯克级驱逐舰",
  coverImage,
  sideImage: coverImage,
  toc: [
    {
      id: "root",
      label: "阿利伯克级驱逐舰",
      children: [
        {
          id: "features",
          label: "1. 特征",
          children: [
            { id: "models", label: "1.1 型号" },
            { id: "structure", label: "1.2 结构" },
          ],
        },
      ],
    },
  ],
  blocks: [
    {
      id: "intro-1",
      type: "paragraph",
      content:
        "阿利·伯克级导弹驱逐舰（DDG）是美国海军的一级以“宙斯盾”作战系统和 SPY-1D 多任务无源相控阵雷达为核心的导弹驱逐舰。该级驱逐舰以二战时期的美国驱逐舰舰队指挥官阿利·伯克命名，他后来还担任了海军作战部长。阿利·伯克级驱逐舰全长 505 至 509.5 英尺（153.9 至 155.3 米），排水量在 8300 至 9700 吨之间，武器装备包括超过 90 枚导弹，其体积和火力甚至超过了以往的许多导弹巡洋舰。",
    },
    {
      id: "intro-2",
      type: "paragraph",
      content:
        "这些战舰是多功能驱逐舰，能够执行多种任务，包括使用“宙斯盾”系统和航空导弹进行防空作战；使用“战斧”巡航导弹进行战术陆地打击；使用拖曳声呐阵列、反潜火箭和反潜直升机进行反潜战（ASW）；以及使用舰对舰导弹和火炮进行反水面战（ASuW）。随着其 AN/SPY-1 雷达系统及其相关导弹载荷的升级，成为“宙斯盾”弹道导弹防御系统的一部分，以及引入了 AN/SPY-6 雷达系统，该级驱逐舰还发展出了作为移动反导和反卫星平台的能力。",
    },
    {
      id: "intro-3",
      type: "paragraph",
      content:
        "该级驱逐舰的首舰“阿利·伯克”号（USS Arleigh Burke）于 1991 年 7 月 4 日服役，当时阿利·伯克上将仍然在世。随着最后一艘斯普鲁恩斯级驱逐舰“库欣”号（USS Cushing）于 2005 年 9 月 21 日退役，阿利·伯克级驱逐舰成为美国海军唯一的现役驱逐舰，直到 2016 年朱姆沃尔特级驱逐舰服役。阿利·伯克级驱逐舰是美国海军水面战斗舰中生产时间最长的一级。截至 2025 年 1 月，已有 74 艘在役，另有 25 艘计划服役。",
    },
    { id: "features", type: "heading", level: 1, content: "特征" },
    {
      id: "features-body",
      type: "paragraph",
      content:
        "该级舰采用全钢上层建筑、倾斜舷侧与综合桅杆布局，强调雷达隐身与生存性；舰载 SPY 系列相控阵雷达与 SM-2/SM-6、ESSM 等拦截武器构成多层防空体系，并可挂载舰载直升机执行反潜与搜救。",
    },
    { id: "models", type: "heading", level: 2, content: "型号" },
    {
      id: "models-body",
      type: "paragraph",
      content: "阿利·伯克级驱逐舰有四个子型号，称为“Flights”。较新的子型号融入了更多先进技术。",
    },
    {
      id: "models-list",
      type: "list",
      items: ["Flight I: DDGs 51-71", "Flight II: DDGs 72-78", "Flight IIA: DDGs 79-124 和 DDG-127", "Flight III: DDGs 125-126 和 DDG-128"],
    },
    {
      id: "models-gallery",
      type: "gallery",
      images: [
        { id: "flight-i", src: coverImage, caption: "Flight I" },
        { id: "flight-iia", src: coverImage, caption: "Flight IIA" },
        { id: "flight-iii", src: coverImage, caption: "Flight III" },
      ],
    },
    { id: "structure", type: "heading", level: 2, content: "结构" },
    {
      id: "structure-body",
      type: "paragraph",
      content:
        "阿利·伯克级驱逐舰是美国建造的最大型驱逐舰之一；只有斯普鲁恩斯级、基德级（563英尺或172米）和朱姆沃尔特级（600英尺或180米）比它更长。阿利·伯克级的设计采用了新的大型水线面积船体形式，其特点是宽大的外倾船艏，显著提高了航行性能，并允许在恶劣海况下保持高速航行。该级舰的设计还融入了隐身技术，例如倾斜的表面（而非传统的垂直表面）和倾斜的三脚主桅杆，这些设计使舰船更难被雷达探测到。阿利·伯克级驱逐舰的设计者们吸取了提康德罗加级巡洋舰的经验教训。海军认为提康德罗加级巡洋舰建造成本过高，且难以进一步升级。因此，对于这些驱逐舰，美国海军重新采用了全钢结构，只有桅杆使用了铝制材料。提康德罗加级巡洋舰的船体采用钢制，上层建筑则使用较轻的铝制材料以减少顶部重量，但铝制材料容易出现裂纹。铝制材料的耐火性也较差；1975年，USS Belknap 上的一场大火烧毁了其铝制上层建筑。1982年福克兰战争中，英国皇家海军舰船因铝制上层建筑在战斗中受损严重，进一步支持了使用钢制材料的决定。福克兰战争中的其他教训还促使海军决定用双层间隔的钢制结构保护阿利·伯克级驱逐舰的关键区域，以抵御反舰导弹（AShMs），并在内部使用凯夫拉尔防弹衬层。此外，还进行了一项名为“巡洋舰基线”的设计研究，旨在将具备垂直发射系统（VLS）能力的提康德罗加级巡洋舰的功能整合到与阿利·伯克级相同标准的船体和上层建筑中，但这项研究仅用于分析目的，没有实际建造这样的船只。",
    },
  ],
  attributeGroups: [
    {
      id: "overview",
      label: "属性列表",
      sectionTitle: "级别概览",
      items: [
        { label: "名称", value: "阿利·伯克级" },
        {
          label: "制造商",
          value: "亨廷顿·英格尔斯造船厂和巴斯钢铁造船厂",
        },
        { label: "使用者", value: "美国海军" },
        {
          label: "前序型号",
          value: "Kidd级驱逐舰和斯普鲁恩斯级驱逐舰",
        },
        { label: "后序型号", value: "朱姆沃尔特级驱逐舰" },
        { label: "制造成本", value: "每艘22亿美元" },
        { label: "建造时间", value: "1988-2011, 2013年至今" },
        { label: "服役时间", value: "1991年至今" },
        { label: "计划建造数量", value: "99" },
        { label: "当前订单数量Flight III", value: "15" },
        { label: "当前建造数量Flight III", value: "6" },
        { label: "已完成建造数量", value: "78" },
        {
          label: "现役数量",
          value: "总计: 74",
          children: [
            { label: "Flight I", value: "21" },
            { label: "Flight II", value: "7" },
            { label: "Flight IIA", value: "34" },
            { label: "Flight IIA Restart", value: "3" },
            { label: "Flight IIA Technology Insertion", value: "8" },
            { label: "Flight III", value: "1" },
          ],
        },
      ],
    },
    {
      id: "basic",
      label: "属性列表",
      sectionTitle: "基础属性",
      items: [
        { label: "类型", value: "导弹驱逐舰" },
        {
          label: "满载排水量",
          children: [
            { label: "Flight I", value: "8400吨" },
            { label: "Flight II", value: "8500吨" },
            { label: "Flight IIA", value: "9700吨" },
            { label: "Flight III", value: "9900吨" },
          ],
        },
        {
          label: "长度",
          children: [
            { label: "Flight I & II", value: "154米" },
            { label: "Flight IIA & III", value: "155.3米" },
          ],
        },
        { label: "宽度", value: "20米" },
        { label: "吃水深度", value: "9.4米" },
        { label: "速度", value: "最大航速35节" },
        { label: "巡航里程", value: "8100公里@23节" },
        {
          label: "武器装备",
          children: [
            {
              label: "Mk 41垂直发射系统",
              children: [
                { label: "90具(Flight I/II构型)(前:29,后:61)" },
                { label: "96具(Flight IIA/III构型)(前:32,后:64)" },
              ],
            },
            {
              label: "可装载弹药种类",
              value:
                "BGM-109战斧巡航导弹, RGM-84鱼叉反舰导弹 (除Flight II构型外), RIM-161导弹, RIM-162海麻雀防空导弹 (DDG-79之前), 阿斯洛克反潜导弹, RIM-66导弹, AGM-158C远程反舰导弹",
            },
            {
              label:
                "一具5吋 (127mm/54) Mk 45轻型舰炮 (DDG-51到80) / 一具5吋 (127mm/62) Mk 45 Mod 4舰炮轻型舰炮 (DDG-81后)",
            },
            {
              label: "两具20mm方阵快炮 (DDG-51到84) / 一具20mm方阵快炮 (DDG-85后)",
            },
            {
              label: "两具Mk 32型水面船舰鱼雷管(一次6枚Mk 46或Mk 50鱼雷)",
            },
          ],
        },
      ],
    },
  ],

  relationCenterName: "阿利伯克级驱逐舰",
  relationNodes: [
    { id: "aegis", name: "宙斯盾作战系统" },
    { id: "spy", name: "SPY 相控阵雷达" },
    { id: "vls", name: "Mk 41 垂发" },
    { id: "sm2", name: "SM-2 导弹" },
    { id: "sm6", name: "SM-6 导弹" },
    { id: "essm", name: "ESSM" },
    { id: "asroc", name: "反潜火箭" },
    { id: "helo", name: "舰载直升机" },
    { id: "ciws", name: "近防武器" },
    { id: "sonar", name: "舰壳声呐" },
    { id: "datalink", name: "数据链终端" },
    { id: "crew", name: "舰员编制" },
    { id: "port", name: "母港部署" },
    { id: "task", name: "编队任务" },
    { id: "flight1", name: "Flight I" },
    { id: "flight2", name: "Flight II" },
    { id: "flight2a", name: "Flight IIA" },
    { id: "flight3", name: "Flight III" },
  ],
};

/** 052D 精简画像 Mock（仅实体列表 / 标准应用情况；头图供顶栏展示）。 */
export const type052dEntityBrowsingObjectProfileMock: EntityBrowsingObjectProfileData = {
  objectId: ENTITY_BROWSING_LITE_PROFILE_OBJECT_ID,
  displayName: "052D型驱逐舰",
  coverImage,
  sideImage: coverImage,
  toc: [],
  blocks: [],
  attributeGroups: [],
  relationCenterName: "052D型驱逐舰",
  relationNodes: [],
};

const profileByObjectId: Record<string, EntityBrowsingObjectProfileData> = {
  [burkeEntityBrowsingObjectProfileMock.objectId]: burkeEntityBrowsingObjectProfileMock,
  [type052dEntityBrowsingObjectProfileMock.objectId]: type052dEntityBrowsingObjectProfileMock,
};

/**
 * @description 按对象 id 解析画像；无匹配时回落默认样例。
 * @param objectId 对象 id。
 * @param displayNameFallback 展示名兜底。
 */
export function resolveEntityBrowsingObjectProfile(objectId: string, displayNameFallback?: string): EntityBrowsingObjectProfileData {
  const matched = profileByObjectId[objectId];
  if (matched) return matched;
  return {
    ...burkeEntityBrowsingObjectProfileMock,
    objectId,
    displayName: displayNameFallback?.trim() || burkeEntityBrowsingObjectProfileMock.displayName,
  };
}
