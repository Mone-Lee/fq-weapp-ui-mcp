/**
 * TODO: 这里的映射关系后续可以考虑通过脚本自动生成，避免手动维护。或者优化组件库代码文件命名规范。
 */

// 基础库组件对应的源码路径映射
const SOURCE_CODE_PATH_MAP: Record<string, string> = {
  FQBadge: 'packages/fq-weapp-ui/src/components/badge/index.tsx',
  FQButton: 'packages/fq-weapp-ui/src/components/button/index.tsx',
  FQCard: 'packages/fq-weapp-ui/src/components/card/index.tsx',
  FQCheckbox: 'packages/fq-weapp-ui/src/components/checkbox/index.ts',
  FQCol: 'packages/fq-weapp-ui/src/components/col/index.ts',
  FQForm: 'packages/fq-weapp-ui/src/components/form/index.ts',
  FQInputNew: 'packages/fq-weapp-ui/src/components/input-new/index.tsx',
  FQModal: 'packages/fq-weapp-ui/src/components/modal/index.tsx',
  FQNoticeBar: 'packages/fq-weapp-ui/src/components/notice-bar/index.tsx',
  FQRadio: 'packages/fq-weapp-ui/src/components/radio/index.ts',
  FQRow: 'packages/fq-weapp-ui/src/components/row/index.ts',
  FQSpriteIcon: 'packages/fq-weapp-ui/src/components/sprite-icon/index.tsx',
  FQStepper: 'packages/fq-weapp-ui/src/components/stepper/index.tsx',
  FQSwitch: 'packages/fq-weapp-ui/src/components/switch/index.tsx',
  FQTag: 'packages/fq-weapp-ui/src/components/tag/index.tsx',
  FQTextareaNew: 'packages/fq-weapp-ui/src/components/textarea-new/index.tsx',
  FQWaterMark: 'packages/fq-weapp-ui/src/components/water-mark/index.tsx',
}


// 业务组件对应的源码路径映射
const PRO_SOURCE_CODE_PATH_MAP: Record<string, string> = {
  FQGoodsCard: 'packages/fq-weapp-ui-pro/src/components/goods-card/index.tsx',
  FQPrice: 'packages/fq-weapp-ui-pro/src/components/price/index.tsx',
  FQSearch: 'packages/fq-weapp-ui-pro/src/components/search/index.tsx',
  FQVideoPlayer: 'packages/fq-weapp-ui-pro/src/components/video-player/index.tsx',
}

// 合并基础库和业务组件的源码路径映射
export const FULL_SOURCE_CODE_PATH_MAP: Record<string, string> = {
  ...SOURCE_CODE_PATH_MAP,
  ...PRO_SOURCE_CODE_PATH_MAP,
};