# Agent 交接示例

这些 JSON 是 S0 实现契约校验器的输入样例，不是实际任务结果，也不是完整 JSON Schema。所有图片引用均为虚构测试资源，价格为测试数据，不得用于真实商品宣传。

| 文件 | 用途 |
| --- | --- |
| [task.example.json](task.example.json) | SKU、事实、保护约束、交付物与禁用付费调用 |
| [plan.example.json](plan.example.json) | 四角色计划、并行依赖和工具步骤 |
| [design.example.json](design.example.json) | 设计方案与确定性文字布局 |
| [quality.example.json](quality.example.json) | 单个候选产物的问题定位与建议返工 |
| [multimodal-input.example.json](multimodal-input.example.json) | 原图、风格、结果与细节裁片的用途、来源及坐标 |

示例使用同一 job_id 与 revision。plan 的 design 和 prepare_subject 可以并行；scene 依赖两者；render_promo 复用 scene 和 design。质量检查完成后由用户决定接受，不设置“Agent 自动代表用户接受”步骤。

quality 示例是假设 scene 已产生后的失败报告，展示返工路由，不声称 plan 已真实执行。正常成功路径到 review_ready；失败时由编排器生成修订计划，只重做问题产物及其依赖后代，不直接重跑整份计划。

design 的保护约束继承 task；即使设计建议超出约束，执行端也要拒绝。对象引用在真实系统中必须验证租户归属，不能由传入路径决定访问权。

## S0 需要实现的严格校验

1. schema_version 受支持；未知字段、错误类型、非法枚举按契约规则拒绝。
2. job_id、revision、SKU 与输入文档版本相互对应。
3. 步骤 ID 唯一、依赖存在、无自依赖、无环；所有交付物有生产步骤。
4. Agent 角色与工具白名单匹配，引用必须来自已有输入或依赖产物。
5. paid_calls_enabled=false 时任何真实付费供应商都不可调用。
6. paid_calls_enabled=true 时必须提供正数预算、货币、报价/预留策略；费用未知不能当作零。
7. 保护商品主体的任务不允许计划插入主体重绘步骤。
8. 质量报告的 bbox 在 [0,1] 内且对应指定产物；产物版本与当前待验版本一致。
9. 修改示例形成非法依赖、越权工具、旧文档版本、无预算付费调用，均须在实际副作用发生前拒绝。

示例中模板、规则与字体均为 fixture 名称。真实模板与字体需要明确版本与许可；中文文字不得依赖用户机器恰好安装了某字体。

契约示例版本现为 0.2，增加多模态用途与来源说明。multimodal-input 为虚构引用示例，不是网关冒烟的实际输入；真正上传的图形位于 evals/gateway-smoke 的运行目录。transport_policy 约束送入模型的派生预览，服务端需要实际执行像素额度和裁片变换检查，不能仅保存这几个字段。
