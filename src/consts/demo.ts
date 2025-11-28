
// TODO: 优化组件库的文档命名
// 基础库组件对应的 demo 文档路径映射
const DEMO_PATH_MAP: Record<string, string> = {
  FQBadge: 'packages/fq-weapp-ui-doc/docs/components/presentation/Badge 徽标数.mdx',
  FQButton: 'packages/fq-weapp-ui-doc/docs/components/basic/Button 按钮.mdx',
  FQCard: 'packages/fq-weapp-ui-doc/docs/components/presentation/Card 卡片.mdx',
  FQCheckbox: 'packages/fq-weapp-ui-doc/docs/components/form/Checkbox 复选框.mdx',
  FQCol: 'packages/fq-weapp-ui-doc/docs/components/basic/Grid 栅格.mdx',
  FQForm: 'packages/fq-weapp-ui-doc/docs/components/form/FQForm 表单.mdx',
  FQInputNew: 'packages/fq-weapp-ui-doc/docs/components/form/Input 输入框.mdx',
  FQModal: 'packages/fq-weapp-ui-doc/docs/components/reaction/Modal 对话框.mdx',
  FQNoticeBar: 'packages/fq-weapp-ui-doc/docs/components/reaction/NoticeBar 信息通知栏.mdx',
  FQRadio: 'packages/fq-weapp-ui-doc/docs/components/form/Radio 单选框.mdx',
  FQRow: 'packages/fq-weapp-ui-doc/docs/components/basic/Grid 栅格.mdx',
  FQSpriteIcon: 'packages/fq-weapp-ui-doc/docs/components/basic/SpriteIcon 精灵图.mdx',
  FQStepper: 'packages/fq-weapp-ui-doc/docs/components/form/Stepper 步进器.mdx',
  FQSwitch: 'packages/fq-weapp-ui-doc/docs/components/form/Switch 开关.mdx',
  FQTag: 'packages/fq-weapp-ui-doc/docs/components/presentation/Tag 标签.mdx',
  FQTextareaNew: 'packages/fq-weapp-ui-doc/docs/components/form/TextArea 输入框.mdx',
  FQWaterMark: 'packages/fq-weapp-ui-doc/docs/components/reaction/FQWaterMark 水印.mdx',
}


// 业务组件对应的 demo 文档路径映射
const PRO_DEMO_PATH_MAP: Record<string, string> = {
  FQGoodsCard: 'packages/fq-weapp-ui-doc/docs/components-pro/GoodsCard 商品卡片.mdx',
  FQPrice: 'packages/fq-weapp-ui-doc/docs/components-pro/Price 价格.mdx',
  FQSearch: 'packages/fq-weapp-ui-doc/docs/components-pro/Search 搜索框.mdx',
  FQVideoPlayer: 'packages/fq-weapp-ui-doc/docs/components-pro/VideoPlayer 视频播放器.mdx',
}

// 合并基础库和业务组件的 demo 文档路径映射
export const FULL_DEMO_PATH_MAP: Record<string, string> = {
  ...DEMO_PATH_MAP,
  ...PRO_DEMO_PATH_MAP,
};