# 网关能力实测结果

2026 年 10 月 15 日 16:05 至 16:06，Asia/Shanghai。按用户要求实际调用当前网关，测试三个控制模型候选和三个图像编辑候选。共十一条请求，六条 HTTP 200、五条 HTTP 503，无自动重试。

结论：gpt-6.1-sol 和 claude-sonnet-5-5 完成了工具调用续接与双图理解，可以作为后续 Agent 接入验证的基础。三个图像候选均因当前凭据分组缺少可用通道而无法完成修图；商品编辑效果尚未获得验证。

## 结果矩阵

| 模型别名 | 路由 | 原生工具调用 | 工具结果续接 | 双图理解 | 蒙版修图 |
| --- | --- | --- | --- | --- | --- |
| gpt-6.1-sol | /v1/responses | 通过 | 通过 | 六项全部正确 | 非本次该模型用途 |
| claude-sonnet-5-5 | /v1/chat/completions | 通过 | 通过 | 六项全部正确 | 非本次该模型用途 |
| gpt-5.6-luna | /v1/responses | 503 无可用通道 | 未执行 | 503 无可用通道 | 未测试 |
| gpt-image-2.5-sunburst | /v1/images/edits | 非本次用途 | 非本次用途 | 非本次用途 | 503 无可用通道 |
| gpt-image-2.5-flare | /v1/images/edits | 非本次用途 | 非本次用途 | 非本次用途 | 503 无可用通道 |
| gpt-image-2 | /v1/images/edits | 非本次用途 | 非本次用途 | 非本次用途 | 503 无可用通道 |

这里的“通过”仅对应本次样例，不代表已达到电商商品质检、长期稳定性或生产验收标准。其余目录模型没有调用，不能据此判断其能力。

## 如何测试

工具调用使用 lookup_export_profile，强制模型输出原生 function/tool call，并验证 profile_id=sku_square。随后本地函数返回一次随机 receipt 和尺寸，模型必须准确引用这份工具结果完成第二轮。两个模型均通过，不是仅在文本里说自己调用了工具。

双图输入为自制的白底几何图片：第一张包含左侧红色方形、右侧蓝色圆形与 L7 标签；第二张右侧变绿，并新增黄色三角形。提示词要求比较但不透露答案。两个模型对六个字段全部回答正确。

修图输入为自制瓶状图形和同尺寸 alpha 蒙版，要求只把灰底换成浅青色，保留瓶身、标签、标记与轮廓。每个图像候选仅请求一张 low 质量 1024×1024 图片。三次请求均在通道选择阶段返回 503，没有获得编辑结果，不评价效果好坏。

## 明确的阻塞

失败响应 error.code 为 model_not_found，message 指向当前凭据分组 GT_INNER (distributor) 下没有该模型的可用通道。

需要检查：当前 token 分组与上游通道分组是否匹配、通道是否启用、模型映射是否存在，以及该通道是否能转发 /v1/images/edits。公开目录列出模型并不保证该 token 可以使用它，不能据此推断供应商不支持修图。

建议首先打通 gpt-image-2.5-sunburst 或 gpt-image-2.5-flare 中任意一个的图像编辑通道；若暂时只能提供 gpt-image-2，也可用作兼容基线。只开通文本聊天或文生图接口，不足以证明支持带原图与蒙版的编辑。

gpt-5.6-luna 的通道问题不会阻塞当前 Agent 原型，已有两个控制模型通过冒烟。专用抠图/分割仍未获得可用性证据，可评估本地部署。

## 延迟和费用证据

| 模型 | 工具调用秒 | 工具结果续接秒 | 双图请求秒 | 返回用量合计 |
| --- | --- | --- | --- | --- |
| gpt-6.1-sol | 2.926 | 10.597 | 15.074 | 输入 4065、输出 90、总计 4155 tokens |
| claude-sonnet-5-5 | 14.940 | 2.960 | 3.341 | 输入 2222、输出 247、总计 2469 tokens |

这些是单次观察，不能计算可靠的 p95 或宣称一个模型总体更快。用量不等于结算金额，当前没有获取实际账单。

Claude 兼容响应中的 usage.output_tokens 为 0，但 completion_tokens 和 billing_usage.claude_usage.output_tokens 有实际值。应按协议与 usage_semantic 解析，不可统一读取 output_tokens 导致漏计费用。

GPT Responses 成功返回中未提供 model 字段，因此本报告记录的是请求的模型别名，未独立确认真实上游版本。其他响应中的模型名称也不能单独证明上游映射。

## 下一步

1. 用已通过的 GPT Responses 和 Claude Chat Completions 路径实现四角色的契约与工具适配。
2. 修复或补充一个当前 token 可调用的图像编辑通道后，重跑 edit 子集；检查真实输出和商品保护区。
3. 补严格结构化输出、多图用途分离、细节裁片、输入限额和图片内指令测试。
4. 再进入授权商品样本评测、质检挑战集与实际成本对账。

本轮没有单独调用 /v1/images/generations，也未验证自动取消、供应商幂等、真实商品保真、透明材质或稳定性。工具 schema 的这一次正确输出也不等于全面验证严格 JSON Schema 支持。

## 本地证据

- [结果摘要](../evals/gateway-smoke/2026-10-15_160543/summary.json)
- [逐请求证据](../evals/gateway-smoke/2026-10-15_160543/requests.json)
- [双图输入一](../evals/gateway-smoke/2026-10-15_160543/fixtures/vision_a.png)
- [双图输入二](../evals/gateway-smoke/2026-10-15_160543/fixtures/vision_b.png)
- [修图原图](../evals/gateway-smoke/2026-10-15_160543/fixtures/edit_original.png)
- [修图蒙版](../evals/gateway-smoke/2026-10-15_160543/fixtures/edit_mask.png)
- [可复用测试脚本](../scripts/gateway_smoke.py)
- [运行方法与边界](../evals/gateway-smoke/README.md)
